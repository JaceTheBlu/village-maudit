import { ROLES, suggestRoles, CAMP_LABELS_DEFAULT } from "./roles";

const LOUP_GAROU_CAMP_LABELS = {
  vampires: "🐺 Loups-Garous",
  villageois: "🌾 Villageois",
  maudits: "🎭 Solitaires",
};

const LOUP_GAROU_ROLES = {
  "loup-garou": {
    nom: "Loup-Garou", camp: "vampires", emoji: "🐺",
    desc: "Chaque nuit, réveille-toi avec les autres Loups-Garous pour désigner "
      + "d'un commun accord un villageois à dévorer.",
  },
  "grand-mechant-loup": {
    nom: "Grand Méchant Loup", camp: "vampires", emoji: "🌕",
    desc: "Tu es un Loup-Garou. Tant qu'aucun des tiens n'est mort, tu peux "
      + "dévorer une seconde victime après le vote des loups, seul dans ton coin.",
  },
  villageois: {
    nom: "Villageois", camp: "villageois", emoji: "🌾",
    desc: "Tu n'as aucun pouvoir. Ta seule arme est ta parole : observe, débats, "
      + "et vote pour démasquer les Loups-Garous.",
  },
  voyante: {
    nom: "Voyante", camp: "villageois", emoji: "🔮",
    desc: "Chaque nuit, tu contemples en secret une carte au choix pour "
      + "découvrir l'identité d'un joueur.",
  },
  sorciere: {
    nom: "Sorcière", camp: "villageois", emoji: "🧪",
    desc: "Tu possèdes deux potions à usage unique : une de vie (sauver la "
      + "victime des Loups-Garous) et une de mort (tuer un joueur de ton choix).",
  },
  chasseur: {
    nom: "Chasseur", camp: "villageois", emoji: "🏹",
    desc: "Le jour où tu meurs (vote ou attaque), tu désignes immédiatement un "
      + "joueur qui meurt avec toi.",
  },
  cupidon: {
    nom: "Cupidon", camp: "villageois", emoji: "💘",
    desc: "La première nuit, tu désignes deux amoureux (toi y compris si tu "
      + "veux). S'ils sont de camps différents, ils forment un camp solo et "
      + "doivent éliminer tout le monde. Si l'un meurt, l'autre meurt de chagrin.",
  },
  "petite-fille": {
    nom: "Petite Fille", camp: "villageois", emoji: "👧",
    desc: "Tu peux espionner discrètement les Loups-Garous pendant leur réveil, "
      + "au risque d'être repérée et dévorée à leur place.",
  },
  voleur: {
    nom: "Voleur", camp: "villageois", emoji: "🃏",
    desc: "La première nuit, tu peux échanger ta carte avec l'une des deux "
      + "cartes non distribuées en début de partie, et prendre ce nouveau rôle.",
  },
  ancien: {
    nom: "Ancien", camp: "villageois", emoji: "🧓",
    desc: "Tu résistes à la première attaque des Loups-Garous (tu perds juste "
      + "une vie). Si le village t'élimine par vote, il perd tous ses pouvoirs "
      + "pour le reste de la partie.",
  },
  "bouc-emissaire": {
    nom: "Bouc Émissaire", camp: "villageois", emoji: "🐐",
    desc: "En cas d'égalité de votes le jour, c'est toi qui es éliminé à la "
      + "place du village.",
  },
  "idiot-village": {
    nom: "Idiot du Village", camp: "villageois", emoji: "🎭",
    desc: "Si le village vote pour t'éliminer, tu révèles ta carte et survis "
      + "— mais tu perds ton droit de vote pour le reste de la partie.",
  },
  salvateur: {
    nom: "Salvateur", camp: "villageois", emoji: "🛡️",
    desc: "Chaque nuit, tu proteges un joueur (toi inclus) des attaques des "
      + "Loups-Garous. Tu ne peux pas protéger la même personne deux nuits de suite.",
  },
  "enfant-sauvage": {
    nom: "Enfant Sauvage", camp: "maudits", emoji: "🐾",
    desc: "La première nuit, tu choisis un modèle parmi les autres joueurs. Si "
      + "ce modèle meurt, tu deviens Loup-Garou toi-même.",
    special: "Camp changeant : victoire automatique non fiable, à vérifier par le MJ.",
  },
  "joueur-de-flute": {
    nom: "Joueur de Flûte", camp: "maudits", emoji: "🎵",
    desc: "Chaque nuit, tu charmes deux joueurs. Tu gagnes seul si, un jour, "
      + "tous les survivants sont charmés.",
    special: "Victoire solo : à déclarer manuellement par le MJ.",
  },
};

function makeSuggester({ evilId, baseId, extras }) {
  return function suggest(n) {
    if (n < 4) return [];
    const nbEvil = Math.max(1, Math.round(n / 3));
    const picks = Array(nbEvil).fill(evilId);
    for (const { min, id } of extras) {
      if (n >= min) picks.push(id);
    }
    while (picks.length < n) picks.push(baseId);
    return picks.slice(0, n);
  };
}

const suggestLoupGarou = makeSuggester({
  evilId: "loup-garou",
  baseId: "villageois",
  extras: [
    { min: 6, id: "voyante" },
    { min: 7, id: "sorciere" },
    { min: 8, id: "chasseur" },
    { min: 9, id: "cupidon" },
    { min: 11, id: "petite-fille" },
    { min: 13, id: "voleur" },
    { min: 15, id: "salvateur" },
  ],
});

export const PRESETS = [
  {
    id: "village-maudit",
    nom: "Ma version",
    description: "Le Village Maudit — thème vampires folkloriques.",
    campLabels: CAMP_LABELS_DEFAULT,
    roles: ROLES,
    suggest: suggestRoles,
  },
  {
    id: "loup-garou",
    nom: "Loup-Garou classique",
    description: "Les rôles du Loup-Garou de Thiercelieux.",
    campLabels: LOUP_GAROU_CAMP_LABELS,
    roles: LOUP_GAROU_ROLES,
    suggest: suggestLoupGarou,
  },
];
