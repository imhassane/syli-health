/**
 * How a conversation reaches the server: history, sending, and the live
 * events (new messages, typing, read receipts). The real one will be a
 * Phoenix Channel; the stories use fakeTransport, which plays a believable
 * exchange with timers.
 */
export type Participant = { id: string; name: string; role?: string };

export type MessageStatus = "sending" | "sent" | "read" | "failed";

export type ChatMessage = {
  id: string;
  author: string;
  text: string;
  at: Date;
  status?: MessageStatus;
};

export type Conversation = {
  id: string;
  title: string;
  /** Everyone but me. */
  participants: Participant[];
  unread?: number;
  last?: ChatMessage;
};

export type ChatEvent =
  | { type: "message"; conversationId: string; message: ChatMessage }
  | { type: "typing"; conversationId: string; author: string; typing: boolean }
  | { type: "status"; conversationId: string; id: string; status: MessageStatus };

export type ChatTransport = {
  history: (conversationId: string) => Promise<ChatMessage[]>;
  /** Resolves with the message as the server keeps it (its id, "sent"). */
  send: (conversationId: string, text: string) => Promise<ChatMessage>;
  subscribe: (listener: (event: ChatEvent) => void) => () => void;
};

export type FakeConversation = {
  conversation: Conversation;
  history: ChatMessage[];
  /** Said in turn by `replier` after each of my messages. */
  replies?: string[];
  replier?: string;
};

/**
 * A transport played by timers: each message sent is "sent" after a moment,
 * "read" a little later, then the other side types and answers with the next
 * of its replies. `incoming` plays messages nobody asked for (unread counts).
 * A message holding "#échec" fails, to show the retry. `speed` scales every
 * delay (tests run at 0.01).
 */
export function fakeTransport({
  conversations,
  me,
  incoming = [],
  speed = 1,
}: {
  conversations: FakeConversation[];
  me: string;
  incoming?: { conversationId: string; author: string; text: string; after: number }[];
  speed?: number;
}): ChatTransport {
  const listeners = new Set<(event: ChatEvent) => void>();
  const emit = (event: ChatEvent) => listeners.forEach((listener) => listener(event));
  const replyIndex = new Map<string, number>();
  let seq = 0;
  const later = (ms: number, run: () => void) => setTimeout(run, ms * speed);
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    for (const m of incoming)
      later(m.after, () => emit({ type: "message", conversationId: m.conversationId, message: { id: `in-${seq++}`, author: m.author, text: m.text, at: new Date() } }));
  };
  return {
    history: (id) =>
      new Promise((resolve) => later(400, () => resolve(conversations.find((c) => c.conversation.id === id)?.history ?? []))),
    send: (conversationId, text) =>
      new Promise((resolve, reject) => {
        later(450, () => {
          if (text.includes("#échec")) return reject(new Error("network"));
          const message: ChatMessage = { id: `m-${seq++}`, author: me, text, at: new Date(), status: "sent" };
          resolve(message);
          const fake = conversations.find((c) => c.conversation.id === conversationId);
          later(900, () => emit({ type: "status", conversationId, id: message.id, status: "read" }));
          if (!fake?.replies?.length || !fake.replier) return;
          const n = replyIndex.get(conversationId) ?? 0;
          replyIndex.set(conversationId, n + 1);
          const reply = fake.replies[n % fake.replies.length];
          const author = fake.replier;
          later(1300, () => emit({ type: "typing", conversationId, author, typing: true }));
          later(1300 + Math.min(3000, 900 + reply.length * 25), () => {
            emit({ type: "typing", conversationId, author, typing: false });
            emit({ type: "message", conversationId, message: { id: `r-${seq++}`, author, text: reply, at: new Date() } });
          });
        });
      }),
    subscribe: (listener) => {
      listeners.add(listener);
      start();
      return () => listeners.delete(listener);
    },
  };
}
