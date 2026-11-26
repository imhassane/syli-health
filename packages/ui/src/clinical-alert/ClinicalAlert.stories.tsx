import { useState } from "preact/hooks";
import { Button } from "../button/Button.tsx";
import { StoryFrame } from "../StoryFrame.tsx";
import { ClinicalAlert } from "./ClinicalAlert.tsx";

export default { title: "Métier/ClinicalAlert", component: ClinicalAlert };

function Interaction() {
  const [advised, setAdvised] = useState(false);
  return (
    <StoryFrame width="56rem">
      <ClinicalAlert
        severity="caution"
        title="ciprofloxacine + glibenclamide"
        reason="Les fluoroquinolones peuvent provoquer une hypoglycémie chez les patients traités par sulfamide hypoglycémiant."
        action="prévenir le patient et renforcer l’autosurveillance de la glycémie pendant le traitement."
        acknowledge={{ label: "Conseil donné au patient", checked: advised, onChange: setAdvised }}
      >
        <Button size="sm">Demander un avis au prescripteur</Button>
      </ClinicalAlert>
    </StoryFrame>
  );
}

export const Caution = { render: () => <Interaction /> };

export const Information = {
  render: () => (
    <StoryFrame width="56rem">
      <ClinicalAlert
        severity="information"
        title="paracétamol + automédication"
        reason="Le patient achète aussi un antalgique contenant du paracétamol."
        action="vérifier la dose totale par jour (4 g au maximum chez l’adulte)."
      />
    </StoryFrame>
  ),
};
