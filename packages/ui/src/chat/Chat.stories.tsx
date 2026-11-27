import { StoryFrame } from "../StoryFrame.tsx";
import { ChatThread, Messenger } from "./Chat.tsx";
import { demoConversations, demoTransport, me } from "./fixtures.ts";
import { fakeTransport } from "./transport.ts";

export default { title: "Messagerie/Messenger", component: Messenger };

/**
 * Live, simulated: write to Dr Touré and she types, then answers; Laborex and
 * the team write on their own after a few seconds (unread counts). A message
 * holding "#échec" fails, to show the retry.
 */
export const Live = {
  render: () => (
    <StoryFrame>
      <Messenger conversations={demoConversations} me={me} transport={demoTransport()} initial="toure" />
    </StoryFrame>
  ),
};

export const OnAPhone = {
  render: () => (
    <StoryFrame width="24rem">
      <Messenger conversations={demoConversations} me={me} transport={demoTransport()} />
    </StoryFrame>
  ),
};

export const EmptyConversation = {
  render: () => (
    <StoryFrame width="40rem">
      <div style={{ blockSize: "28rem" }}>
        <ChatThread
          conversation={{ id: "new", title: "Dr Alpha Bangoura", participants: [{ id: "alpha", name: "Dr Alpha Bangoura", role: "Pédiatre" }] }}
          me={me}
          transport={fakeTransport({ conversations: [], me: me.id })}
        />
      </div>
    </StoryFrame>
  ),
};
