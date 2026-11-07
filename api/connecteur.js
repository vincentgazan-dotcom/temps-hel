// Connecteur Time-Team -> page de temps intermédiaires (version Vercel)
//
// La page appelle :
//   /api/connecteur?liste        -> liste des épreuves (onglets)
//   /api/connecteur?event=<id>   -> temps de l'épreuve, au format de la page
//
// Vercel garde chaque réponse 10 secondes en mémoire : Time-Team n'est
// interrogé qu'une fois toutes les 10 s, quel que soit le nombre de spectateurs.
//
// POUR CHANGER DE COURSE : modifier API_BASE et la liste EVENEMENTS ci-dessous.
// Les identifiants se lisent dans les adresses
// beta.regatta.time-team.nl/hel/<année>/events/<id>/finals

// Hel van het Noorden (Groningue). Réglé sur l'édition 2025 pour les essais.
const API_BASE = 'https://api.regatta.time-team.nl/api/1/hel/2025';

const EVENEMENTS = [
  '1efe25d2-fcb5-4858-a9ae-01666a2c66b0', // 001 M 2-
  '95299287-7920-437d-aa52-5d22aec466cc', // 002 LM 2-
  '61ab30f4-b0a1-4d94-9db6-40fadea60722', // 003 MM 2-
  '4b87e9ed-e75e-446e-a7ef-c4d0905d1974', // 004 V 1x
  '01c06330-4014-49ce-b335-df6571178a1d', // 005 LV 1x
  '2c9dab77-6338-4df3-88d2-0dbda7814ad1', // 006 V18 1x
  '75aa198f-5b39-47a0-b07e-961139e51195', // 007 VM 1x
  '7cb8e100-07b8-4ebd-87e4-0ab2b0414e0b', // 008 V 2-
  'efcb16fe-fbe0-45c9-a0c1-0f0504de12ed', // 010 M 1x
  '31aaf297-12fe-454e-b004-029409f16786', // 011 LM 1x
  '311ca4d6-045a-4405-9fb5-31c83489a82e', // 012 M18 1x
  'fb0204f9-2133-44ba-ac04-4212ef28872a', // 013 MM 1x
];

const CACHE_SECONDES = 10;
const CACHE_LISTE = 3600;

async function telecharger(url) {
  try {
    const rep = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'temps-intermediaires-hel' },
      signal: AbortSignal.timeout(8000),
    });
    if (!rep.ok) return null;
    const json = await rep.json();
    return json && typeof json === 'object' ? json : null;
  } catch (e) {
    return null;
  }
}

const premier = o => (o ? Object.values(o)[0] : undefined);

function transformer(src) {
  if (!src || !src.round_crew || !Object.keys(src.round_crew).length) return null;
  const ev = premier(src.event) || {};
  const race = premier(src.race) || {};
  let locs = (race.timing_layout && race.timing_layout.timing_layout_locations)
    || ((premier(src.round) || {}).timing_layout || {}).timing_layout_locations || [];
  locs = [...Object.values(locs)].sort((a, b) => b.distance - a.distance);
  const points = locs.filter(l => l.name !== 'start')
    .map(l => ({ id: l.id, label: l.name === 'finish' ? 'Arrivée' : l.name }));
  const arrivee = points.length ? points[points.length - 1].id : null;

  const equipages = Object.values(src.round_crew).map(c => {
    const temps = {};
    for (const t of Object.values(c.times || {})) {
      if (!t.total || !t.total.result) continue;
      temps[t.location_id] = { temps: t.total.result, rang: t.total.pos ?? null, ecart: t.total.plus ?? null };
    }
    const res = String(c.adjusted_result ?? '').trim();
    let etat;
    if (res !== '' && !/^[\d:.]+$/.test(res)) etat = res;
    else if (temps[arrivee]) etat = 'arrive';
    else if (Object.keys(temps).length) etat = 'course';
    else etat = 'attente';
    const entry = c.entry || {};
    return {
      dossard: String(c.bib ?? ''),
      equipage: entry.string || '',
      club: (entry.club && entry.club.code) || '',
      nage: entry.stroke_fullname || c.stroke_fullname || '',
      etat,
      temps,
    };
  });

  return {
    heure: Math.floor(Number(src.timestamp || Date.now()) / 1000),
    evenement: { id: ev.id || '', code: ev.code || '', nom: ev.name || '' },
    depart: race.start_datetime ?? null,
    points,
    equipages,
  };
}

async function construireListe() {
  return Promise.all(EVENEMENTS.map(async id => {
    const src = await telecharger(`${API_BASE}/event/${id}/final`);
    const ev = src ? premier(src.event) : null;
    return { id, code: (ev && ev.code) || '?', nom: (ev && ev.name) || '' };
  }));
}

module.exports = async (req, res) => {
  const q = req.query || {};
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  let donnees = null, duree = CACHE_SECONDES;
  if ('liste' in q) {
    donnees = await construireListe();
    duree = CACHE_LISTE;
  } else if (q.event && EVENEMENTS.includes(q.event)) {
    donnees = transformer(await telecharger(`${API_BASE}/event/${q.event}/final`));
  } else {
    res.statusCode = 400;
    return res.end(JSON.stringify({ erreur: 'Paramètre manquant ou épreuve inconnue.' }));
  }
  if (!donnees) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ erreur: 'Données Time-Team indisponibles pour le moment.' }));
  }
  // Cache partagé chez Vercel ; en cas de panne Time-Team, on garde la dernière réponse 1 h.
  res.setHeader('Cache-Control', `public, s-maxage=${duree}, stale-while-revalidate=${duree}, stale-if-error=3600`);
  res.end(JSON.stringify(donnees));
};

module.exports.transformer = transformer;
