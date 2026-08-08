export const ROLES = {
  vampire: {
    nom: "Vampire", camp: "vampires", emoji: "🦇",
    desc: "Se réveille chaque nuit avec les autres Vampires pour désigner d'un "
      + "commun accord une victime à vider de son sang.",
  },
  nosferatu: {
    nom: "Nosferatu", camp: "vampires", emoji: "🩸",
    desc: "Tu es un Vampire. Tant qu'aucun des tiens n'est mort, tu peux saigner "
      + "une seconde victime après le vote, seul dans ton coin.",
  },
  paysan: {
    nom: "Paysan", camp: "villageois", emoji: "🌾",
    desc: "Tu n'as aucun pouvoir. Ta seule arme est ta parole : observe, débats, "
      + "et vote pour éliminer les Vampires.",
  },
  medium: {
    nom: "Médium", camp: "villageois", emoji: "👁️",
    desc: "Chaque nuit, tu contemples en secret une carte au choix pour découvrir "
      + "l'identité d'un joueur.",
  },
  alchimiste: {
    nom: "Alchimiste", camp: "villageois", emoji: "⚗️",
    desc: "Tu possèdes deux potions à usage unique : une de vie (sauver la "
      + "victime des Vampires) et une de mort (tuer un joueur de ton choix).",
  },
  "chasseur-vampires": {
    nom: "Chasseur de Vampires", camp: "villageois", emoji: "🗡️",
    desc: "Le jour où tu meurs (vote ou attaque), tu désignes immédiatement un "
      + "joueur qui meurt avec toi.",
  },
  "lieur-sang": {
    nom: "Lieur de Sang", camp: "villageois", emoji: "🩸",
    desc: "La première nuit, tu désignes deux cœurs liés (toi y compris si tu "
      + "veux). S'ils sont de camps différents, ils forment un camp solo et "
      + "doivent éliminer tout le monde. Si l'un meurt, l'autre meurt de chagrin.",
  },
  "fillette-curieuse": {
    nom: "Fillette Curieuse", camp: "villageois", emoji: "👧",
    desc: "Tu peux espionner discrètement les Vampires pendant leur réveil, au "
      + "risque d'être repérée et vidée de ton sang à leur place.",
  },
  roublard: {
    nom: "Roublard", camp: "villageois", emoji: "🃏",
    desc: "La première nuit, tu peux échanger ta carte avec l'une des deux "
      + "cartes non distribuées en début de partie, et prendre ce nouveau rôle.",
  },
  doyen: {
    nom: "Doyen du Village", camp: "villageois", emoji: "🧓",
    desc: "Tu résistes à la première attaque des Vampires (tu perds juste une "
      + "vie). Si le village t'élimine par vote, il perd tous ses pouvoirs pour "
      + "le reste de la partie.",
  },
  suspecte: {
    nom: "Le Suspecté", camp: "villageois", emoji: "🐐",
    desc: "En cas d'égalité de votes le jour, c'est toi qui es éliminé à la "
      + "place du village.",
  },
  simplet: {
    nom: "Le Simplet", camp: "villageois", emoji: "🎭",
    desc: "Si le village vote pour t'éliminer, tu révèles ta carte et survis — "
      + "mais tu perds ton droit de vote pour le reste de la partie.",
  },
  veilleur: {
    nom: "Veilleur", camp: "villageois", emoji: "🛡️",
    desc: "Chaque nuit, tu proteges un joueur (toi inclus) des attaques des "
      + "Vampires. Tu ne peux pas protéger la même personne deux nuits de suite.",
  },
  "enfant-trouve": {
    nom: "Enfant Trouvé", camp: "maudits", emoji: "🐾",
    desc: "La première nuit, tu choisis un modèle parmi les autres joueurs. Si "
      + "ce modèle meurt, tu deviens Vampire toi-même.",
    special: "Camp changeant : victoire automatique non fiable, à vérifier par le MJ.",
  },
  "menestrel-envouteur": {
    nom: "Ménestrel Envoûteur", camp: "maudits", emoji: "🎵",
    desc: "Chaque nuit, tu charmes deux joueurs. Tu gagnes seul si, un jour, "
      + "tous les survivants sont charmés.",
    special: "Victoire solo : à déclarer manuellement par le MJ.",
  },
};

export function hasSpecialRoles(rolePool, rolesMap = ROLES) {
  return rolePool.some((id) => Boolean(rolesMap[id]?.special));
}

export function suggestRoles(n) {
  if (n < 4) return [];
  const nbVampires = Math.max(1, Math.round(n / 3));
  let picks = Array(nbVampires).fill("vampire");
  const extras = [];
  if (n >= 6) extras.push("medium");
  if (n >= 7) extras.push("alchimiste");
  if (n >= 8) extras.push("chasseur-vampires");
  if (n >= 9) extras.push("lieur-sang");
  if (n >= 11) extras.push("fillette-curieuse");
  if (n >= 13) extras.push("roublard");
  if (n >= 15) extras.push("veilleur");
  picks = picks.concat(extras);
  while (picks.length < n) picks.push("paysan");
  return picks.slice(0, n);
}
