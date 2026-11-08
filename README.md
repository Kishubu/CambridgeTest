# CambridgeTest — B1 Preliminary Reading (front-only)

Entraînement à l'épreuve de **Reading du Cambridge B1 Preliminary** : 6 parties, 32 questions, minuteur de 45 minutes, base de données intégrée. Aucun back-end.

## Structure
```
index.html           # SPA mobile-first (une seule page)
css/style.css        # Responsive (UX inspirée Inspera)
js/app.js            # Orchestrateur (états, minuteur, écrans)
js/db.js             # Chargement de la BDD intégrée
js/timer.js          # Minuteur 45 min
js/ui.js             # Rendu des 6 types de questions + score
db/questions.json    # BDD intégrée générée une fois (JSON)
scripts/parse-exam.js # Génération du JSON depuis le .txt (une seule passe)
Cambridge B1 Exam.txt # Fichier source des questions
```

## Lancer en local
```bash
python3 -m http.server 5000
# ou
npx serve .
```
Puis ouvrir http://localhost:5000

## Déploiement GitHub Pages
1. Dans le repo GitHub : **Settings → Pages**
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`
3. Le site est alors accessible sur `https://<utilisateur>.github.io/CambridgeTest/`

## Générer à nouveau la BDD (optionnel)
```bash
node scripts/parse-exam.js
```
