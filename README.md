# Le Village Maudit

Application de distribution de cartes pour une partie de loup-garou façon
"Village Maudit" (thème vampires folkloriques). Un Meneur de Jeu crée une
salle et choisit les cartes (guide d'équilibrage intégré), les joueurs
rejoignent avec un code (un mot, ex. "LOUP"), le MJ lance la partie, et chaque
joueur voit sa carte sur son téléphone avec un bouton "Je suis mort". Les
victoires sont calculées automatiquement.

Deux presets de rôles sont disponibles au setup : "Ma version" (thème
vampires) et "Loup-Garou classique" (rôles du Loup-Garou de Thiercelieux).
Le MJ peut aussi créer ses propres rôles, et exporter/importer ses rôles
personnalisés au format JSON (`frontend/src/presets.js` pour ajouter un
preset directement dans le code).

## Stack

- **Frontend uniquement** : React + Vite. Site 100% statique, aucun
  backend à héberger.
- **Communication temps réel** : WebRTC peer-to-peer via
  [PeerJS](https://peerjs.com/) (`frontend/src/peer.js`). Le navigateur
  du Meneur de Jeu fait office de "serveur" : il garde l'état de la
  salle en mémoire (`frontend/src/useHostRoom.js`) et les autres
  joueurs s'y connectent directement, sans passer par un serveur à toi.
  Seul le service de signalisation public gratuit de PeerJS est utilisé
  pour l'établissement initial des connexions.

## Développement local

```bash
cd frontend
npm install
npm run dev
```

Ouvre `http://localhost:5173`.

## Build

```bash
cd frontend
npm run build
```

Le résultat statique (`frontend/dist`) peut être servi par n'importe
quel hébergeur de fichiers statiques.

## Déploiement — GitHub Pages + sous-domaine custom

Le repo contient un workflow GitHub Actions
(`.github/workflows/deploy.yml`) qui build et publie automatiquement
`frontend/dist` sur GitHub Pages à chaque push.

Étapes une fois côté GitHub / DNS (pas automatisables depuis ce repo) :

1. Dans les **Settings → Pages** du repo, choisis la source
   **GitHub Actions**.
2. Chez le registrar/DNS de `ggestin.com`, ajoute un enregistrement
   **CNAME** : `villagemaudit` → `<ton-user-github>.github.io`.
3. Une fois le DNS propagé, dans **Settings → Pages**, renseigne le
   domaine custom `villagemaudit.ggestin.com` (le fichier
   `frontend/public/CNAME` est déjà en place et sera republié à chaque
   déploiement) puis coche **Enforce HTTPS** une fois le certificat
   généré par GitHub.

## Limites connues

- Le Meneur de Jeu doit garder son onglet ouvert pendant toute la
  partie : c'est son navigateur qui héberge l'état de la salle. S'il
  ferme l'onglet, la salle disparaît.
- Pas de persistance : un rechargement de page côté MJ réinitialise la
  salle (aucune sauvegarde côté serveur, il n'y en a pas).
- Reconnexion automatique côté joueur (même pseudo) en cas de coupure
  réseau en cours de partie ; en cas de rechargement complet de page,
  il faut resaisir le même pseudo + code pour retrouver sa carte.
- La connexion P2P dépend du NAT/pare-feu de chacun : ça fonctionne en
  wifi/4G classique, mais peut échouer sur certains réseaux
  d'entreprise très restrictifs (pas de serveur TURN configuré).
- Les rôles à victoire "solo" (Lieur de Sang si camps opposés, Enfant
  Trouvé, Ménestrel Envoûteur) ne sont pas détectés automatiquement — le
  MJ dispose de boutons de déclaration manuelle de victoire.
