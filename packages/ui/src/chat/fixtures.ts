import { fakeTransport, type Conversation, type FakeConversation, type Participant } from "./transport.ts";

export const me: Participant = { id: "me", name: "Mariama Diallo", role: "Pharmacienne" };
const touré: Participant = { id: "toure", name: "Dr Aminata Touré", role: "Médecin généraliste, clinique Ignace Deen" };
const laborex: Participant = { id: "laborex", name: "Laborex Guinée", role: "Grossiste" };
const ousmane: Participant = { id: "ousmane", name: "Ousmane Bah", role: "Préparateur" };
const fanta: Participant = { id: "fanta", name: "Fanta Camara", role: "Caissière" };

/** Minutes ago, today; or a day before. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const conversations: FakeConversation[] = [
  {
    conversation: { id: "toure", title: touré.name, participants: [touré] },
    replier: "toure",
    history: [
      { id: "h1", author: "toure", text: "Bonjour, avez-vous de l’artéméther-luméfantrine en stock pour un enfant de 24 kg ?", at: ago(60 * 26) },
      { id: "h2", author: "me", text: "Bonjour docteur, oui : 22 boîtes de comprimés dispersibles.", at: ago(60 * 25.8), status: "read" },
      { id: "h3", author: "toure", text: "Parfait, je vous envoie l’ordonnance de Kadiatou Barry.", at: ago(60 * 25.5) },
      { id: "h4", author: "me", text: "L’amoxicilline 500 mg est en rupture jusqu’à jeudi. Je peux proposer la forme 1 g sécable ?", at: ago(14), status: "read" },
      { id: "h5", author: "toure", text: "Oui, 1 g matin et soir pendant 7 jours. Merci de prévenir le patient.", at: ago(12) },
    ],
    replies: ["Entendu, merci.", "Je regarde et je vous rappelle dans la matinée.", "C’est noté pour la prochaine ordonnance."],
  },
  {
    conversation: { id: "laborex", title: laborex.name, participants: [laborex] },
    replier: "laborex",
    history: [
      { id: "l1", author: "laborex", text: "Votre commande n° BL-2291 part ce matin, livraison avant 11 h.", at: ago(95) },
      { id: "l2", author: "me", text: "Merci. Pensez à ajouter 10 boîtes de salbutamol.", at: ago(90), status: "read" },
    ],
    replies: ["Bien reçu, ajouté à la commande.", "Le salbutamol sera livré vendredi."],
  },
  {
    conversation: { id: "team", title: "Équipe pharmacie", participants: [ousmane, fanta] },
    replier: "ousmane",
    history: [
      { id: "t1", author: "fanta", text: "La caisse est ouverte, fond de caisse 500 000 GNF.", at: ago(180) },
      { id: "t2", author: "ousmane", text: "Je fais l’inventaire des antipaludiques après la réception.", at: ago(170) },
    ],
    replies: ["D’accord, je m’en occupe.", "C’est fait 👍"],
  },
];

export const demoConversations: Conversation[] = conversations.map((c) => ({
  ...c.conversation,
  last: c.history[c.history.length - 1],
  unread: c.conversation.id === "team" ? 2 : 0,
}));

/** The simulated server: replies after each message, and two messages coming on their own. */
export const demoTransport = (speed = 1) =>
  fakeTransport({
    conversations,
    me: me.id,
    speed,
    incoming: [
      { conversationId: "laborex", author: "laborex", text: "Le camion est parti, arrivée prévue à 10 h 40.", after: 6000 },
      { conversationId: "team", author: "fanta", text: "Une cliente demande si la réservation de Mme Sylla est prête.", after: 11000 },
    ],
  });
