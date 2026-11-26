import { StoryFrame } from "../StoryFrame.tsx";
import { StatCard, StatGrid, type StatCardProps } from "./StatCard.tsx";

export default { title: "Données/StatCard", component: StatCard, args: { label: "Ventes du jour", value: "4,87 M GNF", icon: "money" } };

export const Dashboard = {
  render: () => (
    <StoryFrame>
      <StatGrid label="Chiffres du jour">
        <StatCard icon="money" label="Ventes du jour" value="4,87 M GNF" note="↑ 12 % sur 7 jours" tone="info" />
        <StatCard icon="rx" label="Ordonnances" value="63" note="41 avec assurance" tone="success" />
        <StatCard icon="bag" label="Réservations" value="5" note="à préparer avant 18 h" tone="violet" />
        <StatCard icon="pill" label="Rupture" value="1" note="Amoxicilline 500 mg" tone="warning" />
      </StatGrid>
    </StoryFrame>
  ),
};

export const Single = { render: (args: StatCardProps) => <StoryFrame width="20rem"><StatCard {...args} /></StoryFrame> };

export const Loading = {
  render: () => (
    <StoryFrame>
      <StatGrid label="Chiffres du jour">
        <StatCard icon="money" label="Ventes du jour" value="" tone="info" loading />
        <StatCard icon="rx" label="Ordonnances" value="" tone="success" loading />
        <StatCard icon="bag" label="Réservations" value="" tone="violet" loading />
        <StatCard icon="pill" label="Rupture" value="" tone="warning" loading />
      </StatGrid>
    </StoryFrame>
  ),
};
