import { BlobField } from "../blob/Blob.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { Logo, type Product } from "./Logo.tsx";

export default { title: "Fondations/Logo", component: Logo };

const products: Product[] = ["pharmacie", "clinique", "labo", "patient"];
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "40px" } as const;

export const Products = {
  render: () => (
    <StoryFrame>
      <div style={grid}>
        {products.map((p) => (
          <Logo product={p} key={p} />
        ))}
      </div>
    </StoryFrame>
  ),
};

export const Suite = {
  render: () => (
    <StoryFrame>
      <div style={{ position: "relative", display: "grid", placeItems: "center", minBlockSize: "24rem", borderRadius: "28px", background: "var(--sy-primary-soft)", overflow: "hidden" }}>
        <BlobField />
        <div style={{ position: "relative" }}>
          <Logo product="health" size="7rem" layout="stack" tagline="Parcours médicaux" />
        </div>
      </div>
    </StoryFrame>
  ),
};

export const Marks = {
  render: () => (
    <StoryFrame>
      <div style={{ display: "flex", gap: "24px", alignItems: "end" }}>
        {(["health", ...products] as Product[]).map((p) => (
          <Logo product={p} markOnly size="3rem" key={p} />
        ))}
        <Logo product="pharmacie" markOnly size="1.5rem" />
      </div>
    </StoryFrame>
  ),
};
