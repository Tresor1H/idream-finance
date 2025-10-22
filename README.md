# iDream — Tableau de bord financier (PWA)

## Présentation
Application web progressive (PWA) de suivi financier destinée à la comptable d'iDream. Vanilla JS + Chart.js. Données persistées en `localStorage`. Mode hors-ligne basique via Service Worker.

## Structure
idream-finance/
├── index.html
├── style.css
├── script.js
├── manifest.json
├── sw.js
└── icons/

markdown
Copier le code

## Installation locale
1. Copier les fichiers dans un dossier `idream-finance`.
2. Placer les icônes `icon-192.png` et `icon-512.png` dans `icons/`.
3. Ouvrir `index.html` dans un navigateur moderne (Chrome/Edge/Firefox). Pour PWA & SW il faut servir via HTTP(S) (ex: `npx http-server` ou GitHub Pages).

## Déploiement sur GitHub Pages
1. Créer un repo GitHub, pousser le dossier.
2. Dans les Settings du repo → Pages → Source : `main` branch `/ (root)`.
3. Attendre la génération ; l'app sera disponible sur `https://<user>.github.io/<repo>/`.

## Générer l'APK (options)
Deux approches :
### (A) PWABuilder
- Aller sur https://www.pwabuilder.com, fournir l'URL GitHub Pages, suivre les étapes pour générer des paquets Android.
### (B) Capacitor (option dev)
- Installer Capacitor : `npm init` + `npm i @capacitor/core @capacitor/cli`
- Copier les fichiers dans un projet web, puis `npx cap init`, `npx cap add android`, ouvrir Android Studio et construire l'APK.

> Note : PWABuilder est la voie la plus simple pour transformer la PWA en APK sans code natif.

## Fonctionnalités clés
- Ajout / suppression de transactions (revenus & dépenses)
- Gestion CRUD catégories (couleurs)
- Dashboard: cartes métriques, graphiques Chart.js (évolution, camembert)
- Filtre & recherche
- PWA: manifest, service worker, install prompt
- Export simulé (télécharge JSON). Pour PDF réel, intégrer `jsPDF` ou exporter côté serveur.

## Limitations connues & recommandations
- Sauvegarde locale uniquement (localStorage). Pour sécuriser et partager, migrer vers backend (ex: Firebase, REST API).
- Export PDF : simulé. Si besoin d'un PDF fiable, je peux ajouter `jsPDF` pour générer un PDF côté client.
- Tests mobiles : tester via GitHub Pages + Chrome devtools (device emulation) avant packaging.

## Maintenance
- Code commenté dans `script.js`.
- Pour ajout d'une authentification, prévoir backend.
- Si tu veux, j'ajoute le support d'import CSV/Excel, ou export PDF réel.

## Contact
