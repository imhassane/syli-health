import { StoryFrame } from "../StoryFrame.tsx";
import { Blob, BlobField } from "./Blob.tsx";

export default { title: "Fondations/Blob", component: Blob };

export const Shapes = {
  render: () => (
    <StoryFrame>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "32px", alignItems: "center" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <Blob shape={i + 1} size="100%" key={i} />
        ))}
      </div>
    </StoryFrame>
  ),
};

/** Behind a page: two in opposite corners, faint, under a veil of the page's colour. */
export const Field = {
  render: () => (
    <div style={{ position: "relative", minBlockSize: "100dvh", background: "var(--sy-bg)" }}>
      <BlobField />
      <main style={{ position: "relative", padding: "32px", maxInlineSize: "40rem" }}>
        <h1 style={{ margin: 0 }}>Bonjour, pharmacie du Niger</h1>
        <p>Le texte reste au-dessus des blobs, qui ne passent jamais derrière une phrase à lire sans voile.</p>
      </main>
    </div>
  ),
};

export const Scatter = {
  render: () => (
    <div style={{ position: "relative", minBlockSize: "100dvh", background: "var(--sy-bg)" }}>
      <BlobField layout="scatter" />
      <main style={{ position: "relative", padding: "32px" }}>
        <h1 style={{ margin: 0 }}>Connexion</h1>
      </main>
    </div>
  ),
};
