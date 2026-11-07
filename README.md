# Temps intermédiaires · Hel van het Noorden

Page de temps intermédiaires en direct (source Time-Team), hébergée sur Vercel.

- `index.html` : la page.
- `api/connecteur.js` : va chercher les temps chez Time-Team (toutes les 10 s au plus).
  Pour changer de course : modifier `API_BASE` et `EVENEMENTS` en haut du fichier.
