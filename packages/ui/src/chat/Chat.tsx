import { Fragment } from "preact";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { announce } from "../announce/announce.ts";
import { Button, IconButton } from "../button/Button.tsx";
import { useI18n } from "../i18n/I18n.tsx";
import { Icon } from "../icon/Icon.tsx";
import { Skeleton } from "../skeleton/Skeleton.tsx";
import type {
  ChatMessage,
  ChatTransport,
  Conversation,
  Participant,
} from "./transport.ts";

export type * from "./transport.ts";
export { fakeTransport } from "./transport.ts";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w[0] ?? ""))
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

type ThreadProps = {
  conversation: Conversation;
  me: Participant;
  transport: ChatTransport;
  /** A back button before the title (narrow frames). */
  onBack?: () => void;
};

/**
 * One conversation: its messages as a log, a composer that grows with the
 * text. New messages from others are announced once (the log itself stays
 * quiet, so loading the history reads nothing); the view follows them only
 * when it is already at the end, else a button says how many came.
 */
export function ChatThread({
  conversation,
  me,
  transport,
  onBack,
}: ThreadProps) {
  const id = useId();
  const { t, plural, date } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const log = useRef<HTMLDivElement>(null);
  // Stuck to the end: true until the reader scrolls up, true again when
  // they come back down (or send). While stuck, the log follows whatever
  // grows it: new messages, someone typing, fonts arriving late.
  const stuck = useRef(true);
  const content = useRef<HTMLDivElement>(null);
  const names = new Map([
    [me.id, me.name],
    ...conversation.participants.map((p) => [p.id, p.name] as const),
  ]);
  const group = conversation.participants.length > 1;

  // History, then live events: one subscription per conversation.
  useEffect(() => {
    let alive = true;
    setMessages(null);
    setTyping(null);
    setUnseen(0);
    stuck.current = true;
    // Messages sent or received before the history came are kept after it.
    transport
      .history(conversation.id)
      .then(
        (history) =>
          alive &&
          setMessages((list) => [
            ...history,
            ...(list ?? []).filter((m) => !history.some((h) => h.id === m.id)),
          ]),
      );
    const stop = transport.subscribe((event) => {
      if (event.conversationId !== conversation.id) return;
      const wasAtEnd = stuck.current;
      if (event.type === "typing")
        setTyping(event.typing ? event.author : null);
      if (event.type === "status")
        setMessages(
          (list) =>
            list?.map((m) =>
              m.id === event.id ? { ...m, status: event.status } : m,
            ) ?? list,
        );
      if (event.type === "message") {
        const m = event.message;
        setMessages((list) =>
          list && !list.some((x) => x.id === m.id) ? [...list, m] : list,
        );
        if (m.author !== me.id) {
          announce(
            t("incoming", { name: names.get(m.author) ?? "", text: m.text }),
          );
          if (!wasAtEnd) setUnseen((n) => n + 1);
        }
      }
    });
    return () => {
      alive = false;
      stop();
    };
  }, [conversation.id, transport]);

  const nearEnd = () => {
    const el = log.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };
  const toEndNow = () => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  };

  // Before the paint, after each change.
  useLayoutEffect(() => {
    if (stuck.current) toEndNow();
  }, [messages, typing]);

  // And whenever the content grows later (fonts, wrapping on a resize).
  useEffect(() => {
    const target = content.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => stuck.current && toEndNow());
    observer.observe(target);
    observer.observe(log.current!);
    return () => observer.disconnect();
  }, [messages === null]);

  const toEnd = () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    stuck.current = true;
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
    setUnseen(0);
  };

  const send = useCallback(
    (
      text: string,
      localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ) => {
      stuck.current = true;
      const draft: ChatMessage = {
        id: localId,
        author: me.id,
        text,
        at: new Date(),
        status: "sending",
      };
      setMessages((list) => [
        ...(list ?? []).filter((m) => m.id !== localId),
        draft,
      ]);
      // (A message sent before the history came: the history is put before it.)
      transport.send(conversation.id, text).then(
        (saved) =>
          setMessages(
            (list) => list?.map((m) => (m.id === localId ? saved : m)) ?? list,
          ),
        () =>
          setMessages(
            (list) =>
              list?.map((m) =>
                m.id === localId ? { ...m, status: "failed" } : m,
              ) ?? list,
          ),
      );
    },
    [conversation.id, transport, me.id],
  );

  const other = conversation.participants[0];
  const day = (d: Date) => {
    const today = new Date();
    if (sameDay(d, today)) return t("today");
    if (
      sameDay(
        d,
        new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      )
    )
      return t("yesterday");
    return date(d, { weekday: "long", day: "numeric", month: "long" });
  };
  const time = (d: Date) =>
    date(d, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const statusText = {
    sending: t("sending"),
    sent: t("sent"),
    read: t("seen"),
    failed: t("failed"),
  };

  return (
    <section class="sy-chat" aria-labelledby={`${id}-title`}>
      <header class="sy-chat__head">
        {onBack && (
          <IconButton
            class="sy-chat__back"
            icon="chevronStart"
            flip
            label={t("backToConversations")}
            onClick={onBack}
          />
        )}
        <span class="sy-chat__avatar" aria-hidden="true">
          {initials(conversation.title)}
        </span>
        <div class="sy-chat__who">
          <h2 class="sy-chat__title" id={`${id}-title`}>
            {conversation.title}
          </h2>
          {group ? (
            <p class="sy-chat__sub">
              {conversation.participants.map((p) => p.name).join(", ")}
            </p>
          ) : (
            other?.role && <p class="sy-chat__sub">{other.role}</p>
          )}
        </div>
      </header>

      <div class="sy-chat__body">
        <div
          class="sy-chat__log"
          ref={log}
          onScroll={() => {
            stuck.current = nearEnd();
            if (stuck.current && unseen > 0) setUnseen(0);
          }}
          role="log"
          aria-live="off"
          aria-label={t("messages")}
          tabIndex={0}
          aria-busy={messages === null || undefined}
        >
          <div ref={content}>
            {messages === null ? (
              <div class="sy-chat__loading" aria-hidden="true">
                {[60, 40, 70, 30].map((w, i) => (
                  <span
                    key={i}
                    class={`sy-chat__ghost${i % 2 ? " sy-chat__ghost--mine" : ""}`}
                  >
                    <Skeleton width={`${w}%`} height="2.5rem" shape="block" />
                  </span>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p class="sy-chat__empty">{t("noMessages")}</p>
            ) : (
              <ol class="sy-chat__messages">
                {messages.map((m, i) => {
                  const before = messages[i - 1];
                  const newDay = !before || !sameDay(before.at, m.at);
                  const mine = m.author === me.id;
                  const first = newDay || before.author !== m.author;
                  const name = mine ? t("you") : (names.get(m.author) ?? "");
                  return (
                    <Fragment key={m.id}>
                      {newDay && (
                        <li class="sy-chat__day">
                          <span>{day(m.at)}</span>
                        </li>
                      )}
                      <li
                        class={`sy-chat__message${mine ? " sy-chat__message--mine" : ""}${first ? " sy-chat__message--first" : ""}`}
                        data-status={m.status}
                      >
                        {/* Who wrote it: shown at the start of a group's run, always read. */}
                        {first && group && !mine ? (
                          <span class="sy-chat__author">{name}</span>
                        ) : (
                          <span class="sy-visually-hidden">{name}</span>
                        )}
                        <span class="sy-visually-hidden">{": "}</span>
                        <p class="sy-chat__text" dir="auto">
                          {m.text}
                        </p>
                        <span class="sy-chat__meta">
                          <time class="sy-num" dateTime={m.at.toISOString()}>
                            {time(m.at)}
                          </time>
                          {mine && m.status && (
                            <span
                              class={`sy-chat__status sy-chat__status--${m.status}`}
                            >
                              {m.status !== "failed" && (
                                <Icon
                                  name={
                                    m.status === "read"
                                      ? "checks"
                                      : m.status === "sent"
                                        ? "check"
                                        : "clock"
                                  }
                                  size={14}
                                />
                              )}
                              <span
                                class={
                                  m.status === "failed"
                                    ? undefined
                                    : "sy-visually-hidden"
                                }
                              >
                                {" " + statusText[m.status]}
                              </span>
                            </span>
                          )}
                        </span>
                        {m.status === "failed" && (
                          <Button
                            size="sm"
                            variant="danger-outline"
                            icon="refresh"
                            onClick={() => send(m.text, m.id)}
                          >
                            {t("retry")}
                          </Button>
                        )}
                      </li>
                    </Fragment>
                  );
                })}
              </ol>
            )}
            {typing && (
              <p class="sy-chat__typing">
                <span class="sy-chat__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                {t("typing", { name: names.get(typing) ?? "" })}
              </p>
            )}
          </div>
        </div>
        {unseen > 0 && (
          <Button
            class="sy-chat__unseen"
            size="sm"
            variant="primary"
            icon="chevronDown"
            onClick={toEnd}
          >
            {plural("newMessages", unseen)}
          </Button>
        )}
      </div>

      <Composer
        to={group ? conversation.title : (other?.name ?? conversation.title)}
        onSend={send}
      />
    </section>
  );
}

/**
 * The text field grows with the text (field-sizing: content, else it
 * scrolls). Enter sends, Shift+Enter starts a line; never while an input
 * method is composing (Chinese, Japanese: Enter picks the characters).
 */
function Composer({
  to,
  onSend,
}: {
  to: string;
  onSend: (text: string) => void;
}) {
  const id = useId();
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      class="sy-chat__composer"
      ref={form}
      onSubmit={(event) => {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem(
          "message",
        ) as HTMLTextAreaElement;
        const text = field.value.trim();
        if (!text) return field.focus();
        onSend(text);
        field.value = "";
        field.focus();
      }}
    >
      <label class="sy-visually-hidden" for={`${id}-text`}>
        {t("messageTo", { name: to })}
      </label>
      <textarea
        id={`${id}-text`}
        name="message"
        class="sy-chat__field"
        rows={1}
        dir="auto"
        autocomplete="off"
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          event.preventDefault();
          // Safari confirms a composition with keyCode 229 after isComposing is reset.
          if (event.isComposing || event.keyCode === 229) return;
          form.current?.requestSubmit();
        }}
      />
      <IconButton
        class="sy-chat__send"
        type="submit"
        icon="send"
        flip
        label={t("send")}
        variant="soft"
      />
    </form>
  );
}

type ListProps = {
  conversations: Conversation[];
  selected?: string;
  onSelect: (id: string) => void;
  me: Participant;
};

/** The conversations, the latest first: name, last words, time, unread count. */
export function ConversationList({
  conversations,
  selected,
  onSelect,
  me,
}: ListProps) {
  const { t, plural, date, number } = useI18n();
  const sorted = [...conversations].sort(
    (a, b) => (b.last?.at.getTime() ?? 0) - (a.last?.at.getTime() ?? 0),
  );
  const when = (d: Date) =>
    sameDay(d, new Date())
      ? date(d, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      : date(d, { day: "numeric", month: "short" });
  return (
    <nav class="sy-conversations" aria-label={t("conversations")}>
      <ul>
        {sorted.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              class="sy-conversations__item"
              aria-current={c.id === selected || undefined}
              onClick={() => onSelect(c.id)}
            >
              <span class="sy-chat__avatar" aria-hidden="true">
                {initials(c.title)}
              </span>
              <span class="sy-conversations__text">
                <span class="sy-conversations__name">{c.title}</span>
                {c.last && (
                  <>
                    <span class="sy-visually-hidden">{", "}</span>
                    <span class="sy-conversations__last" dir="auto">
                      {c.last.author === me.id ? `${t("you")} : ` : ""}
                      {c.last.text}
                    </span>
                  </>
                )}
              </span>
              <span class="sy-conversations__side">
                {c.last && (
                  <time class="sy-num" dateTime={c.last.at.toISOString()}>
                    <span class="sy-visually-hidden">{", "}</span>
                    {when(c.last.at)}
                  </time>
                )}
                {(c.unread ?? 0) > 0 && (
                  <span class="sy-conversations__unread">
                    <span aria-hidden="true">{number(c.unread!)}</span>
                    <span class="sy-visually-hidden">
                      {", " + plural("unread", c.unread!)}
                    </span>
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type MessengerProps = {
  conversations: Conversation[];
  me: Participant;
  transport: ChatTransport;
  /** The conversation open at first (wide frames open the latest). */
  initial?: string;
};

/**
 * Conversations and the open one. Wide: side by side. Narrow (below 44rem
 * of frame): the list, or the conversation with a way back. Unread counts
 * and last words follow the live events.
 */
export function Messenger({
  conversations: given,
  me,
  transport,
  initial,
}: MessengerProps) {
  const { t } = useI18n();
  const [conversations, setConversations] = useState(given);
  const [selected, setSelected] = useState<string | undefined>(initial);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(
    () =>
      transport.subscribe((event) => {
        if (event.type !== "message") return;
        setConversations((list) =>
          list.map((c) =>
            c.id !== event.conversationId
              ? c
              : {
                  ...c,
                  last: event.message,
                  unread:
                    event.conversationId === selectedRef.current ||
                    event.message.author === me.id
                      ? 0
                      : (c.unread ?? 0) + 1,
                },
          ),
        );
      }),
    [transport],
  );

  const open = conversations.find((c) => c.id === selected);
  const select = (id: string) => {
    setSelected(id);
    setConversations((list) =>
      list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  };
  // My own messages update the list too (the thread sends them).
  const wrapped: ChatTransport = useRef({
    ...transport,
    send: (conversationId: string, text: string) =>
      transport.send(conversationId, text).then((m) => {
        setConversations((list) =>
          list.map((c) => (c.id === conversationId ? { ...c, last: m } : c)),
        );
        return m;
      }),
  }).current;

  return (
    <div class="sy-messenger" data-open={open ? "" : undefined}>
      <div class="sy-messenger__list">
        <h2 class="sy-messenger__title">{t("conversations")}</h2>
        <ConversationList
          conversations={conversations}
          selected={selected}
          onSelect={select}
          me={me}
        />
      </div>
      <div class="sy-messenger__thread">
        {open ? (
          <ChatThread
            conversation={open}
            me={me}
            transport={wrapped}
            onBack={() => setSelected(undefined)}
            key={open.id}
          />
        ) : (
          <p class="sy-messenger__empty">
            <Icon name="chat" size={28} />
            {t("chooseConversation")}
          </p>
        )}
      </div>
    </div>
  );
}
