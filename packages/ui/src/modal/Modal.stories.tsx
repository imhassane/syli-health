import { useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { Select, TextField } from "../field/Field.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { ConfirmDialog, Modal } from "./Modal.tsx";

export default { title: "Superpositions/Modal", component: Modal };

function FormExample({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <StoryFrame>
      <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>
        Réception grossiste
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle réception"
        description="Les quantités s’ajoutent au stock dès la validation."
        dismissible={false}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="primary" type="submit" form="reception">
              Valider la réception
            </Button>
          </>
        }
      >
        <form
          id="reception"
          style={{ display: "grid", gap: "16px" }}
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <Select label="Grossiste" name="supplier" required error="Choisissez le grossiste.">
            <option value="">Choisir…</option>
            <option>Laborex Guinée</option>
            <option>Pharmaguinée</option>
          </Select>
          <TextField label="Numéro de bon de livraison" name="slip" required error="Indiquez le numéro du bon." autoFocus />
          <TextField label="Nombre de colis" name="parcels" type="number" min={1} inputMode="numeric" />
        </form>
      </Modal>
    </StoryFrame>
  );
}

export const Form = { render: () => <FormExample initiallyOpen /> };
export const Closed = { render: () => <FormExample initiallyOpen={false} /> };

function ConfirmExample({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [done, setDone] = useState(false);
  return (
    <StoryFrame>
      <Button variant="danger-outline" onClick={() => setOpen(true)}>
        Supprimer le lot A2307
      </Button>
      {done && <p role="status">Lot supprimé.</p>}
      <ConfirmDialog
        open={open}
        tone="danger"
        title="Supprimer le lot A2307 ?"
        description="Les 22 boîtes d’artéméther-luméfantrine de ce lot sortiront du stock. Cette action est enregistrée dans le journal."
        confirmLabel="Supprimer le lot"
        cancelLabel="Garder le lot"
        onConfirm={() => {
          setOpen(false);
          setDone(true);
        }}
        onCancel={() => setOpen(false)}
      />
    </StoryFrame>
  );
}

export const Confirm = { render: () => <ConfirmExample initiallyOpen /> };
export const ConfirmClosed = { render: () => <ConfirmExample initiallyOpen={false} /> };
