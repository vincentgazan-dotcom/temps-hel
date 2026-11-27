// Connecteur Time-Team -> page Head of Nantes (version Vercel, même calcul que connecteur.php)
//
// La page appelle :
//   /api/hon?liste        -> liste des épreuves (onglets)
//   /api/hon?event=<id>   -> temps de l'épreuve, au format de la page
//
// Vercel garde chaque réponse 10 secondes en mémoire : Time-Team n'est
// interrogé qu'une fois toutes les 10 s, quel que soit le nombre de spectateurs.
//
// POUR CHANGER DE COURSE : modifier API_BASE et la liste EVENEMENTS ci-dessous.
// Les identifiants se lisent dans les adresses des épreuves sur
// ffaviron.regatta.time-team.fr/<code>/<année> (…/events/<id>/finals).

// Head of Nantes 2027 (réglé pour l'instant sur les championnats nationaux longue distance 2026, pour les essais).
const API_BASE = 'https://api.ffaviron.regatta.time-team.fr/api/1/cnld/2026';

// Épreuves affichées, dans l'ordre des onglets. Code et nom sont lus chez Time-Team.
const EVENEMENTS = [
  'a277b315-bc70-4185-a0a9-b31dd3a195bb', // H 2x U19
  '456caaf4-24b4-41cc-bc89-9bf0a5d1a8e3', // H 2x Senior
  '9320d78c-d19d-4d80-95d5-ae984f9d1235', // F 2x Junior
  '5ed44d12-df22-463d-9356-e0702c02f5e9', // F 2x Senior
  '9864bfc1-c1ce-4902-bc4a-22ee8cb6d8e8', // H 4x Senior
  '0c2b271c-940a-4f0b-9d94-9db687e1eafa', // F 4x Senior
  'c340b228-cef4-436c-ba3d-89d08c3e07c4', // H 8+ Senior
  '9ac009aa-9601-4b72-b34d-5d735b936e11', // F 8+ Senior
];

const CACHE_SECONDES = 10;
const CACHE_LISTE = 3600;

async function telecharger(url) {
  try {
    const rep = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'temps-intermediaires-hon' },
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

// "24:42.5", "1:02:03,4" -> secondes
function enSecondes(txt) {
  const m = /^(?:(\d+):)?(\d+):(\d+(?:[.,]\d+)?)$/.exec(String(txt ?? '').trim());
  return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + parseFloat(m[3].replace(',', '.')) : null;
}
function ecartTexte(s) {
  s = Math.round(s * 10) / 10;
  const m = Math.floor(s / 60), r = (s - m * 60).toFixed(1);
  return m ? `${m}:${r.padStart(4, '0')}` : r;
}

function transformer(src) {
  if (!src || !src.round_crew || !Object.keys(src.round_crew).length) return null;
  const ev = premier(src.event) || {};
  const race = premier(src.race) || {};
  let locs = (race.timing_layout && race.timing_layout.timing_layout_locations)
    || ((premier(src.round) || {}).timing_layout || {}).timing_layout_locations || [];
  // Du départ vers l'arrivée. Selon les régates, « distance » est la distance restante
  // (départ = 6000, arrivée = 0) ou la distance parcourue (départ = 0, arrivée = 6000).
  locs = [...Object.values(locs)];
  const dep = locs.find(l => l.name === 'start'), fin = locs.find(l => l.name === 'finish');
  const restante = dep && fin ? dep.distance > fin.distance : true;
  locs.sort((a, b) => {
    if (a.name === 'start' || b.name === 'finish') return -1;
    if (b.name === 'start' || a.name === 'finish') return 1;
    return restante ? b.distance - a.distance : a.distance - b.distance;
  });
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
      ordre: Number(c.sort_order ?? c.bib) || null,   // ordre de départ
      equipage: entry.string || '',
      club: (entry.club && entry.club.code) || '',
      nage: entry.stroke_fullname || c.stroke_fullname || '',
      etat,
      temps,
    };
  });

  // Temps final officiel (avec pénalités éventuelles) à la place du temps brut d'arrivée.
  Object.values(src.round_crew).forEach((c, i) => {
    const res = String(c.adjusted_result ?? '').trim(), e = equipages[i];
    if (arrivee && e.temps[arrivee] && /^[\d:.,]+$/.test(res) && enSecondes(res) != null) e.temps[arrivee].temps = res;
  });
  // Rangs et écarts recalculés dans la catégorie, au temps (Time-Team les donne parfois
  // sur toute la vague de départ, toutes catégories mélangées).
  for (const p of points) {
    const passes = equipages
      .filter(e => e.temps[p.id] && enSecondes(e.temps[p.id].temps) != null && (p.id !== arrivee || e.etat === 'arrive'))
      .sort((a, b) => enSecondes(a.temps[p.id].temps) - enSecondes(b.temps[p.id].temps));
    const tete = passes.length ? enSecondes(passes[0].temps[p.id].temps) : 0;
    let precedent = null, rang = 0;
    passes.forEach((e, i) => {
      const s = enSecondes(e.temps[p.id].temps);
      if (s !== precedent) rang = i + 1;
      precedent = s;
      e.temps[p.id].rang = rang;
      e.temps[p.id].ecart = rang === 1 ? null : '+' + ecartTexte(s - tete);
    });
    equipages.forEach(e => { if (e.temps[p.id] && !passes.includes(e)) { e.temps[p.id].rang = null; e.temps[p.id].ecart = null; } });
  }

  return {
    heure: Math.floor(Number(src.timestamp || Date.now()) / 1000),
    evenement: { id: ev.id || '', code: ev.code || '', nom: ev.name || '' },
    depart: race.start_datetime ?? null,
    points,
    equipages,
  };
}

// Liste des onglets : code et nom de chaque épreuve, lus chez Time-Team (gardés 1 h).
async function construireListe() {
  const liste = await Promise.all(EVENEMENTS.map(async id => {
    const src = await telecharger(`${API_BASE}/event/${id}/final`);
    const ev = (src && premier(src.event)) || {};
    return { id, code: ev.code || '?', nom: ev.name || '' };
  }));
  return liste.some(e => e.code !== '?') ? liste : null;
}

const IDS = EVENEMENTS;

module.exports = async (req, res) => {
  const q = req.query || {};
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  let donnees = null, duree = CACHE_SECONDES;
  if ('liste' in q) {
    donnees = await construireListe();
    duree = CACHE_LISTE;
  } else if (q.event && IDS.includes(q.event)) {
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
