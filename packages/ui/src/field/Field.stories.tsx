import { StoryFrame } from "../StoryFrame.tsx";
import { Checkbox, SearchField, Select, TextField } from "./Field.tsx";

export default { title: "Formulaires/Champs", component: TextField, args: { label: "Nom du patient" } };

const stack = { display: "grid", gap: "18px" } as const;

export const Text = {
  render: () => (
    <StoryFrame width="26rem">
      <form style={stack} onSubmit={(e) => e.preventDefault()} noValidate={false}>
        <TextField label="Nom du patient" name="name" required autoComplete="name" error="Indiquez le nom du patient." />
        <TextField label="Téléphone" name="phone" type="tel" inputMode="tel" autoComplete="tel" hint="Pour prévenir quand la commande est prête." optional />
        <TextField label="Poids (kg)" name="weight" type="number" min={1} max={300} inputMode="decimal" error="Entre 1 et 300 kg." />
      </form>
    </StoryFrame>
  ),
};

export const ServerError = {
  render: () => (
    <StoryFrame width="26rem">
      <TextField label="Code de retrait" name="code" value="K7-4Q9" invalid error="Ce code ne correspond à aucune réservation." />
    </StoryFrame>
  ),
};

export const SelectField = {
  render: () => (
    <StoryFrame width="26rem">
      <Select label="Moyen de paiement" name="payment" required error="Choisissez un moyen de paiement.">
        <option value="">Choisir…</option>
        <option>Espèces</option>
        <option>Orange Money</option>
        <option>MTN MoMo</option>
        <option>Wave</option>
      </Select>
    </StoryFrame>
  ),
};

export const Search = {
  render: () => (
    <StoryFrame width="34rem">
      <div style={stack}>
        <SearchField label="Rechercher un médicament" placeholder="DCI, nom commercial, code…" />
        <SearchField label="Scanner ou rechercher un médicament" placeholder="Scannez un code-barres ou tapez un médicament…" icon="scan" shortcut="F2" />
      </div>
    </StoryFrame>
  ),
};

export const Checks = {
  render: () => (
    <StoryFrame>
      <div style={stack}>
        <Checkbox label="Conseil donné au patient" />
        <Checkbox label="Prévenir par SMS quand c’est prêt" switch defaultChecked />
      </div>
    </StoryFrame>
  ),
};
