# Cambridge B1 Preliminary — Reading (Entraînement)

Application **front-end uniquement** pour s'entraîner à l'épreuve de Reading du Cambridge B1 Preliminary (PET).

## Fonctionnalités
- 6 parties (Multiple Choice, Matching, Reading, Sentence Insertion, Multiple Choice Cloze, Open Cloze)
- Minuteur de 45 minutes (mise en condition réelle)
- Sélection aléatoire des questions depuis la base de données intégrée
- Interface mobile-first
- Correction automatique et écran de résultats détaillé
- Aucun back-end, aucune API, fonctionne hors ligne une fois chargé

## Base de données
Le contenu est dans `cambridge_b1_pet_tests_by_series.json` (6 séries, source de vérité).

## Lancer en local
```bash
# avec Python (déjà installé)
python3 -m http.server 5000
# puis ouvrir http://localhost:5000

# ou avec npx
npx serve .
```

## Déploiement GitHub Pages
1. Pousser sur la branche `main`
2. Settings → Pages → Source : `main` / `/ (root)`
