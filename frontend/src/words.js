// Mots utilisés pour générer les codes de salle — thème Village Maudit.
// Tout en majuscules, sans accents (identifiants PeerJS).
export const CODE_WORDS = [
  "LOUP", "LOUVE", "MEUTE", "CROC", "GRIFFE", "MORSURE", "SANG", "VEINE",
  "VAMPIRE", "NOSFERATU", "GOULE", "STRIGE", "SPECTRE", "FANTOME", "OMBRE",
  "TENEBRES", "OBSCUR", "NUIT", "MINUIT", "LUNE", "ECLIPSE", "BRUME",
  "GIVRE", "GEL", "FROID", "HIVER", "ORAGE", "TONNERRE", "FOUDRE",
  "CORBEAU", "HIBOU", "CHOUETTE", "ARAIGNEE", "SERPENT",
  "CRYPTE", "TOMBE", "CERCUEIL", "LINCEUL", "CIMETIERE", "EPITAPHE",
  "GIBET", "POTENCE", "BUCHER", "PENDU", "GLAS", "VEILLE", "CENDRE",
  "GRIMOIRE", "SORCIER", "SORCIERE", "MALEFICE", "RITUEL", "AUTEL",
  "PACTE", "SERMENT", "TRAHISON", "COMPLOT", "SUSPECT", "ACCUSE",
  "VILLAGE", "CHATEAU", "DONJON", "MANOIR", "RUINE", "FORET", "MARAIS",
  "RAVIN", "SENTIER", "CLOCHER", "PUITS", "TAVERNE", "CHAUMIERE",
  "LANTERNE", "BOUGIE", "CHANDELLE", "MASQUE", "CAPE", "LAME", "POIGNARD",
  "GLAIVE", "POISON", "VENIN", "MAUDIT", "DAMNE", "HANTISE", "TERREUR",
  "EFFROI", "SILENCE", "HURLEMENT", "MURMURE", "SECRET", "MYSTERE",
  "PRESAGE", "AUGURE", "DESTIN", "AME", "RELIQUE", "TALISMAN", "AMULETTE",
];

export function randomCodeWord() {
  return CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
}
