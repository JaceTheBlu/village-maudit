#!/usr/bin/env bash
set -e

echo "→ Installation & build du frontend"
cd frontend
npm install
npm run build
cd ..

echo "→ Copie du build dans backend/app/static"
rm -rf backend/app/static
cp -r frontend/dist backend/app/static

echo "→ Installation des dépendances backend"
pip install -r backend/requirements.txt

echo "Build terminé."
