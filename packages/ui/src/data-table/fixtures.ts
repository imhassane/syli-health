/** Fictitious data for the catalog and the tests. */
export type StockItem = {
  id: string;
  dci: string;
  brand: string;
  qty: number;
  lot: string;
  expires: string;
  price: number;
  status: "out" | "low" | "expiring" | "ok";
};

export const stock: StockItem[] = [
  ["Amoxicilline 500 mg, gélule", "Clamoxyl", 0, "—", "", 18500, "out"],
  ["Insuline glargine 100 UI/ml, stylo", "Lantus", 3, "L8841", "2027-06", 145000, "low"],
  ["Artéméther-luméfantrine, comprimé", "Coartem", 22, "A2307", "2026-12", 32000, "expiring"],
  ["Paracétamol 1 g, comprimé", "Doliprane", 184, "P5521", "2028-11", 12500, "ok"],
  ["Metformine 850 mg, comprimé", "Glucophage", 76, "M3310", "2027-09", 21000, "ok"],
  ["Salbutamol 100 µg, inhalateur", "Ventoline", 9, "S0457", "2027-02", 48000, "low"],
  ["Oméprazole 20 mg, gélule", "Mopral", 58, "O2219", "2028-05", 26000, "ok"],
  ["Fer + acide folique, comprimé", "Tardyféron B9", 41, "F7702", "2027-01", 38000, "ok"],
  ["Amlodipine 5 mg, comprimé", "Amlor", 64, "A1180", "2028-02", 24000, "ok"],
  ["Ciprofloxacine 500 mg, comprimé", "Ciflox", 17, "C2408", "2027-08", 45000, "ok"],
  ["Glibenclamide 5 mg, comprimé", "Daonil", 33, "G1192", "2027-03", 28000, "ok"],
  ["Prednisolone 20 mg, comprimé", "Solupred", 6, "P0921", "2026-12", 19500, "expiring"],
  ["Losartan 50 mg, comprimé", "Cozaar", 27, "L3307", "2028-07", 31000, "ok"],
  ["Ibuprofène 400 mg, comprimé", "Advil", 4, "I6620", "2027-10", 9500, "low"],
].map(([dci, brand, qty, lot, expires, price, status], i) => ({
  id: `p${i + 1}`,
  dci: dci as string,
  brand: brand as string,
  qty: qty as number,
  lot: lot as string,
  expires: expires as string,
  price: price as number,
  status: status as StockItem["status"],
}));

export type Reservation = {
  id: string;
  patient: string;
  age: number;
  items: string;
  payer: string;
  amount: number;
  status: "check" | "prepare" | "ready" | "done";
};

const names = ["Fatoumata Camara", "Mamadou Bah", "Ibrahima Sow", "Aïssatou Diallo", "Kadiatou Barry", "Ousmane Keïta", "Alpha Condé", "Mariam Touré", "Sékou Kouyaté", "Hawa Soumah", "Thierno Baldé", "Néné Sylla"];
const payers = ["Orange Money", "Wave · diaspora", "MTN MoMo", "Carte bancaire", "Espèces"];
const orders = ["Amlodipine 5 mg, metformine 850 mg", "Salbutamol 100 µg, prednisolone 20 mg", "Ciprofloxacine 500 mg, glibenclamide 5 mg", "Fer + acide folique", "Artéméther-luméfantrine, paracétamol sirop", "Oméprazole 20 mg", "Losartan 50 mg"];
const statuses: Reservation["status"][] = ["prepare", "prepare", "check", "ready", "prepare", "done", "ready"];

export const reservations: Reservation[] = Array.from({ length: 23 }, (_, i) => ({
  id: `R-2411-${String(180 + i).padStart(4, "0")}`,
  patient: names[i % names.length],
  age: 8 + ((i * 7) % 63),
  items: orders[i % orders.length],
  payer: payers[i % payers.length],
  amount: 38000 + ((i * 13700) % 160000),
  status: statuses[i % statuses.length],
}));

export const gnf = (n: number) => `${n.toLocaleString("fr").replace(/ /g, " ")} GNF`;
