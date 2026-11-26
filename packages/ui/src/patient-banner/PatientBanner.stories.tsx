import { StoryFrame } from "../StoryFrame.tsx";
import { PatientBanner, type PatientBannerProps } from "./PatientBanner.tsx";

const args: PatientBannerProps = {
  name: "Ibrahima Sow",
  sex: "M",
  birthDate: "1964-03-14",
  recordId: "SH-000482",
  weightKg: 78,
  allergies: ["pénicillines"],
  conditions: ["Diabète de type 2"],
  today: new Date("2026-11-25T12:00:00"),
};

export default { title: "Métier/PatientBanner", component: PatientBanner, args };

export const WithAllergy = { render: (a: PatientBannerProps) => <StoryFrame><PatientBanner {...a} /></StoryFrame> };
export const Child = {
  render: () => (
    <StoryFrame>
      <PatientBanner name="Kadiatou Barry" sex="F" birthDate="2018-07-02" recordId="SH-001207" weightKg={24} today={new Date("2026-11-25T12:00:00")} />
    </StoryFrame>
  ),
};
