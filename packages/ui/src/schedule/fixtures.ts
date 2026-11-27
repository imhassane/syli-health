import type { ScheduleEvent } from "./week.ts";

/** A believable week at a pharmacy with a consultation room (stories, tests). */
export function pharmacyWeek(monday: Date): ScheduleEvent[] {
  const at = (day: number, h: number, m = 0) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day, h, m);
  const e = (id: string, day: number, from: [number, number], to: [number, number], title: string, detail: string, tone: ScheduleEvent["tone"]) => ({
    id,
    start: at(day, ...from),
    end: at(day, ...to),
    title,
    detail,
    tone,
  });
  return [
    e("a1", 0, [8, 0], [9, 0], "Réception grossiste", "Laborex Guinée", "neutral"),
    e("a2", 0, [9, 30], [10, 0], "Vaccination", "Kadiatou Barry", "success"),
    e("a3", 0, [9, 30], [10, 30], "Bilan de médication", "Ibrahima Sow", "violet"),
    e("a4", 0, [14, 0], [14, 30], "Test de glycémie", "Mamadou Diallo", "info"),
    e("b1", 1, [8, 30], [9, 0], "Vaccination", "Aïssatou Camara", "success"),
    e("b2", 1, [11, 0], [12, 30], "Inventaire", "Rayon antipaludiques", "warning"),
    e("b3", 1, [16, 0], [16, 15], "Retrait commande", "Fatoumata Bah", "info"),
    e("c1", 2, [10, 0], [10, 30], "Entretien pharmaceutique", "Oumar Condé", "violet"),
    e("c2", 2, [10, 15], [11, 0], "Vaccination", "Mariama Sylla", "success"),
    e("c3", 2, [10, 30], [11, 30], "Visite délégué", "Sanofi", "neutral"),
    e("d1", 3, [8, 0], [19, 0], "Garde", "Dr Aminata Touré", "danger"),
    e("d2", 3, [15, 0], [15, 30], "Test de glycémie", "Sékou Keïta", "info"),
    e("e1", 4, [9, 0], [10, 0], "Réception grossiste", "Pharmaguinée", "neutral"),
    e("e2", 4, [17, 30], [18, 0], "Vaccination", "Alpha Bangoura", "success"),
  ];
}
