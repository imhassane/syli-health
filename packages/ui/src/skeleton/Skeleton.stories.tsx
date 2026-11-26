import { StoryFrame } from "../StoryFrame.tsx";
import { Skeleton } from "./Skeleton.tsx";

export default { title: "Fondations/Skeleton", component: Skeleton };

const card = { display: "grid", gap: "12px", gridTemplateColumns: "auto 1fr", alignItems: "center", maxInlineSize: "28rem" } as const;

/** A patient card while it loads: the shape of what is coming. */
export const Shapes = {
  render: () => (
    <StoryFrame>
      <div style={card} role="status" aria-busy="true" aria-label="Chargement du patient">
        <Skeleton shape="circle" />
        <div style={{ display: "grid", gap: "8px" }}>
          <Skeleton width="60%" height="1.125rem" />
          <Skeleton width="85%" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Skeleton shape="block" />
        </div>
      </div>
    </StoryFrame>
  ),
};
