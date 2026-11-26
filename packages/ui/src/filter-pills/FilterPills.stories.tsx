import { useState } from "preact/hooks";
import { StoryFrame } from "../StoryFrame.tsx";
import { FilterPills } from "./FilterPills.tsx";

export default { title: "Formulaires/FilterPills", component: FilterPills };

function Example() {
  const [value, setValue] = useState("all");
  return (
    <StoryFrame>
      <FilterPills
        label="Filtrer le stock"
        value={value}
        onChange={setValue}
        options={[
          { value: "all", label: "Tous", count: 1248 },
          { value: "low", label: "Stocks faibles", count: 7 },
          { value: "out", label: "Ruptures", count: 1 },
          { value: "expiring", label: "Péremptions", count: 12 },
        ]}
      />
    </StoryFrame>
  );
}

export const Stock = { render: () => <Example /> };
