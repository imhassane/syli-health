import { StoryFrame } from "../StoryFrame.tsx";
import { StatusPill } from "./StatusPill.tsx";

export default { title: "Données/StatusPill", component: StatusPill, args: { children: "Prête" } };

export const Tones = {
  render: () => (
    <StoryFrame>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <StatusPill tone="warning">À préparer</StatusPill>
        <StatusPill tone="success">Prête</StatusPill>
        <StatusPill tone="info" icon="check">Retirée</StatusPill>
        <StatusPill tone="danger">Ordonnance à vérifier</StatusPill>
        <StatusPill tone="violet">Péremption proche</StatusPill>
        <StatusPill tone="neutral" icon={false}>Indisponible</StatusPill>
      </div>
    </StoryFrame>
  ),
};
