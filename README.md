# Temps intermédiaires · Hel van het Noorden

Page de temps intermédiaires en direct (source Time-Team), hébergée sur Vercel.

- `index.html` : la page.
- `api/connecteur.js` : va chercher les temps chez Time-Team (toutes les 10 s au plus).
  Pour changer de course : modifier `API_BASE` et `EVENEMENTS` en haut du fichier.

## Head of Nantes (`/hon/`)

- `hon/index.html` : la page des temps (adresse : `/hon/`).
- `hon/course.html` : la course virtuelle avec la carte du parcours.
- `api/hon.js` : va chercher les temps chez Time-Team (FFAviron).
  Pour changer de course : modifier `API_BASE` et `EVENEMENTS` en haut du fichier.
