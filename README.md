# Le Village Maudit

Application de distribution de cartes pour une partie de loup-garou façon
"Village Maudit" (thème vampires folkloriques). Un Meneur de Jeu crée une
salle et choisit les cartes (guide d'équilibrage intégré), les joueurs
rejoignent avec un code à 5 caractères, le MJ lance la partie, et chaque
joueur voit sa carte sur son téléphone avec un bouton "Je suis mort". Les
victoires Vampires / Village sont calculées automatiquement.

## Stack

- **Backend** : FastAPI + WebSocket (état des salles en mémoire, pas de
  base de données — suffisant pour des parties entre amis).
- **Frontend** : React + Vite, servi par le backend lui-même (un seul
  service, un seul déploiement).
- Pas de Docker : déploiement en process Python nu.

## Développement local

Terminal 1 — backend :
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Terminal 2 — frontend :
```bash
cd frontend
npm install
npm run dev
```

Ouvre `http://localhost:5173`. Le frontend proxy `/api` et `/ws` vers le
backend sur `:8000` (voir `vite.config.js`).

## Build de prod (un seul service)

```bash
bash build.sh
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Le frontend buildé est copié dans `backend/app/static` et servi directement
par FastAPI — une seule app, un seul port, un seul domaine.

## Déploiement public (sans Docker)

Le repo contient un `render.yaml` prêt à l'emploi pour
[Render](https://render.com) :

1. Connecte ce repo GitHub à Render (New → Blueprint, il détecte
   `render.yaml` automatiquement).
2. Render exécute `bash build.sh` puis lance `uvicorn`.
3. Une fois déployé, ajoute un enregistrement **CNAME** chez ton
   registrar pointant `sous-domaine.tondomaine.com` vers l'URL fournie
   par Render, puis configure le domaine custom dans les settings Render
   (HTTPS géré automatiquement).

Railway ou Fly.io fonctionnent aussi de façon similaire (build Python
natif, pas besoin de Dockerfile) si tu préfères une autre plateforme.

## Limites connues

- Pas de persistance : si le process backend redémarre, les salles en
  cours sont perdues.
- Pas de reconnexion automatique côté joueur après un rechargement de
  page : il faut ressaisir le même pseudo + code pour retrouver sa carte.
- Les rôles à victoire "solo" (Lieur de Sang si camps opposés, Enfant
  Trouvé, Ménestrel Envoûteur) ne sont pas détectés automatiquement — le
  MJ dispose de boutons de déclaration manuelle de victoire.
