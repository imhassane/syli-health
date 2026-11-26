import { StoryFrame } from "../StoryFrame.tsx";
import { Button, IconButton } from "./Button.tsx";

export default { title: "Actions/Button", component: Button, args: { children: "Nouvelle vente" } };

const row = { display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" } as const;

export const Variants = {
  render: () => (
    <StoryFrame>
      <div style={row}>
        <Button variant="primary" icon="plus">Nouvelle vente</Button>
        <Button variant="soft" icon="scan">Scanner une ordonnance</Button>
        <Button variant="outline">Inventaire</Button>
        <Button variant="ghost">Tout voir</Button>
        <Button variant="danger-outline">Annuler la vente</Button>
        <Button variant="danger">Supprimer le lot</Button>
      </div>
    </StoryFrame>
  ),
};

export const Sizes = {
  render: () => (
    <StoryFrame>
      <div style={row}>
        <Button variant="primary">Encaisser</Button>
        <Button variant="primary" size="sm">Encaisser</Button>
        <Button variant="soft" size="sm" icon="refresh">Réessayer</Button>
      </div>
    </StoryFrame>
  ),
};

export const Loading = {
  render: () => (
    <StoryFrame>
      <div style={row}>
        <Button variant="primary" loading>Encaissement…</Button>
        <Button variant="soft" loading>Synchronisation…</Button>
      </div>
    </StoryFrame>
  ),
};

export const Block = {
  render: () => (
    <StoryFrame width="22rem">
      <Button variant="primary" block>Encaisser 29 400 GNF</Button>
    </StoryFrame>
  ),
};

export const IconButtons = {
  render: () => (
    <StoryFrame>
      <div style={row}>
        <IconButton icon="close" label="Fermer" />
        <IconButton icon="refresh" label="Actualiser" variant="soft" />
        <IconButton icon="chevronEnd" label="Page suivante" variant="soft" flip />
      </div>
    </StoryFrame>
  ),
};
