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
  "villageois-simple": {
    nom: "Villageois", camp: "villageois", emoji: "🌾",
    desc: "Tu n'as aucun pouvoir. Ta seule arme est ta parole : observe, débats, "
      + "et vote pour démasquer les Loups-Garous.",
  },
  voyante: {
    nom: "Voyante", camp: "villageois", emoji: "🔮",
    desc: "Chaque nuit, tu découvres en secret l'identité d'un joueur de ton choix.",
  },
  sorciere: {
    nom: "Sorcière", camp: "villageois", emoji: "🧪",
    desc: "Tu possèdes deux potions à usage unique : une de vie (sauver la "
      + "victime des Loups-Garous) et une de mort (tuer un joueur de ton choix).",
  },
  chasseur: {
    nom: "Chasseur", camp: "villageois", emoji: "🏹",
    desc: "Le jour où tu meurs (vote ou attaque), tu abats immédiatement un "
      + "autre joueur de ton choix.",
  },
  cupidon: {
    nom: "Cupidon", camp: "villageois", emoji: "💘",
    desc: "La première nuit, tu désignes deux amoureux (toi y compris si tu "
      + "veux). S'ils sont de camps différents, ils forment un camp solo et "
      + "doivent éliminer tout le monde. Si l'un meurt, l'autre meurt de chagrin.",
    special: "Duo solo : victoire non détectée automatiquement, à déclarer manuellement par le MJ.",
  },
  "petite-fille": {
    nom: "Petite Fille", camp: "villageois", emoji: "👧",
    desc: "Tu peux espionner discrètement les Loups-Garous pendant leur réveil, "
      + "au risque d'être repérée et dévorée à leur place.",
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
  voleur: {
    nom: "Voleur", camp: "villageois", emoji: "🃏",
    desc: "La première nuit, tu peux échanger ta carte avec l'une des deux "
      + "cartes non distribuées en début de partie, et prendre ce nouveau rôle.",
  },
  capitaine: {
    nom: "Capitaine", camp: "villageois", emoji: "🎖️",
    desc: "Élu par le village en début de partie, ton vote compte double lors "
      + "des votes de jour.",
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
  baseId: "villageois-simple",
  extras: [
    { min: 6, id: "voyante" },
    { min: 7, id: "sorciere" },
    { min: 8, id: "chasseur" },
    { min: 9, id: "cupidon" },
    { min: 11, id: "petite-fille" },
    { min: 13, id: "voleur" },
    { min: 15, id: "ancien" },
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
