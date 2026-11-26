import { useEffect } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { resetToasts, toast } from "./toast-store.ts";
import { Toaster } from "./Toaster.tsx";

export default { title: "Superpositions/Toast", component: Toaster };

const row = { display: "flex", flexWrap: "wrap", gap: "12px" } as const;

function Playground({ preset }: { preset?: () => void }) {
  useEffect(() => {
    resetToasts();
    preset?.();
    return resetToasts;
  }, []);
  return (
    <StoryFrame>
      <div style={row}>
        <Button variant="primary" onClick={() => toast.success("Vente encaissée", { detail: "29 400 GNF · Orange Money" })}>
          Encaisser
        </Button>
        <Button
          onClick={() =>
            toast.info("Réservation marquée comme prête", {
              detail: "Fatoumata Camara · code K7-4Q2",
              action: { label: "Annuler", onClick: () => toast.info("Réservation remise à préparer") },
            })
          }
        >
          Marquer comme prête
        </Button>
        <Button onClick={() => toast.warning("Hors ligne", { detail: "3 ventes en attente d’envoi. Elles partiront au retour du réseau." })}>Couper le réseau</Button>
        <Button
          onClick={() => {
            const id = toast.loading("Synchronisation…", { detail: "Envoi de 3 ventes" });
            setTimeout(() => toast.success("Synchronisé", { id, detail: "3 ventes envoyées" }), 1500);
          }}
        >
          Synchroniser
        </Button>
        <Button variant="danger-outline" onClick={() => toast.error("Paiement refusé", { detail: "Orange Money : solde insuffisant. Proposez un autre moyen." })}>
          Simuler une erreur
        </Button>
      </div>
      <Toaster />
    </StoryFrame>
  );
}

export const Playground_ = { name: "Bac à sable", render: () => <Playground /> };

export const Stacked = {
  render: () => (
    <Playground
      preset={() => {
        toast.success("Vente encaissée", { detail: "29 400 GNF · Orange Money", duration: 0 });
        toast.warning("Hors ligne", { detail: "3 ventes en attente d’envoi.", duration: 0 });
        toast.info("Réservation marquée comme prête", { detail: "Fatoumata Camara", action: { label: "Annuler", onClick: () => {} }, duration: 0 });
      }}
    />
  ),
};

export const PaymentError = {
  name: "Erreur",
  render: () => <Playground preset={() => toast.error("Paiement refusé", { detail: "Orange Money : solde insuffisant." })} />,
};
