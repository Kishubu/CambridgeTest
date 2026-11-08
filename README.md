# CambridgeTest

Site **front-only** avec une **mini BDD intégrée** côté navigateur.

## Stack (aucun back-end)
- HTML5 / CSS3 / JavaScript vanilla
- [sql.js](https://github.com/sql-js/sql.js) : SQLite compilé en WebAssembly, tourne entièrement dans le navigateur
- `localStorage` : persistance de la base (export/import du fichier SQLite)

## Structure
```
index.html          # point d'entrée
css/style.css       # styles
js/app.js           # logique + mini BDD
package.json        # scripts (serveur de dev statique)
```

## Lancer en local
```bash
# installer un serveur statique (une seule fois)
npm install -g serve   # ou utiliser npx

# lancer le site
npm start
# ou
npx serve .
```
Puis ouvrir http://localhost:5000

## Fonctionnalités de la démo
- Gestion de tâches (CRUD) stockées dans la base SQLite embarquée
- Persistance automatique dans `localStorage` (la base survit au rechargement)
- Export/import de la base (fichier `.db`)

## Lier à un dépôt GitHub
```bash
git remote add origin https://github.com/<utilisateur>/<repo>.git
git branch -M main
git push -u origin main
```
Crée d'abord le dépôt vide sur GitHub (sans cocher "Add a README" pour éviter les conflits).
