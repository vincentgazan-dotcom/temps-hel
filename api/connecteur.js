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

// Hel van het Noorden (Groningue), 22 novembre 2026.
const API_BASE = 'https://api.beta.regatta.time-team.nl/api/1/hel/2026';

// [identifiant, code, nom] dans l'ordre des onglets.
const EVENEMENTS = [
  ['c41eebb3-4817-4e2d-bef4-92abc55e1b63', 'M 2-', 'Mannen twee-zonder'], // 001 · 9 inscrits
  ['f8b0f034-cceb-4fac-84d2-d34c9ffe5b35', 'MSB 2-', 'Mannen senioren b twee-zonder'], // 002 · 5 inscrits
  // ['d7170e79-4f08-47c3-9e1e-34a9b0f2cde1', 'LM 2-', 'Lichte mannen twee-zonder'], // 003 · 0 inscrits (vide, décommenter si besoin)
  ['7dfc43bb-24f7-4ef3-b27d-35b8818364e0', 'LMSB 2-', 'Lichte mannen senioren b twee-zonder'], // 004 · 2 inscrits
  ['12b09d4e-b3ed-41f4-bd82-bfcf5af25f60', 'MM 2-', 'Mannen masters twee-zonder'], // 005 · 4 inscrits
  ['a4a5acd4-c28f-41f5-92f6-6adf97c854b0', 'MMD 2-', 'Mannen masters d twee-zonder'], // 006 · 1 inscrits
  ['ac8abb3c-79fe-4d70-846c-bd2a185da3a9', 'V 1x', 'Vrouwen skiff'], // 007 · 9 inscrits
  ['afb28cc0-ab5d-4064-a213-72ef98a94783', 'VSB 1x', 'Vrouwen senioren b skiff'], // 008 · 4 inscrits
  ['febecfea-d8ba-4259-9431-71ae43cbc6df', 'LV 1x', 'Lichte vrouwen skiff'], // 009 · 4 inscrits
  ['938cdf13-9ece-4e84-a334-6fd81f257941', 'LVSB 1x', 'Lichte vrouwen senioren b skiff'], // 010 · 7 inscrits
  ['d6e25e5c-2088-4aa5-9358-a2946bffeb42', 'V18 1x', 'Vrouwen achttien skiff'], // 011 · 2 inscrits
  // ['8d5df7a4-48dd-4dbc-9c07-e330608df697', 'VM 1x', 'Vrouwen masters skiff'], // 012 · 0 inscrits (vide, décommenter si besoin)
  // ['25d477df-fb4d-439a-b3ca-5f1344d646a8', 'VMD 1x', 'Vrouwen masters d skiff'], // 013 · 0 inscrits (vide, décommenter si besoin)
  ['dcd56d48-0b36-4f9b-b6d1-dcf577290daa', 'M 1x', 'Mannen skiff'], // 014 · 18 inscrits
  ['b854da97-a86f-4037-a02a-c2e3471be771', 'MSB 1x', 'Mannen senioren b skiff'], // 015 · 23 inscrits
  ['5586a468-5950-4e34-b9bc-7bfc5da507ce', 'LM 1x', 'Lichte mannen skiff'], // 016 · 6 inscrits
  ['5432b687-5ec8-4886-9d27-802e63eb9fe5', 'LMSB 1x', 'Lichte mannen senioren b skiff'], // 017 · 7 inscrits
  // ['0a1f3f11-f6e8-40e3-9ad2-ffd4334cbbd0', 'M18 1x', 'Mannen achttien skiff'], // 018 · 0 inscrits (vide, décommenter si besoin)
  ['54a4ce3a-22b0-4275-829c-079b70042d5e', 'V 2-', 'Vrouwen twee-zonder'], // 019 · 4 inscrits
  ['d667808b-86a2-415b-a54e-68252dd3e288', 'VSB 2-', 'Vrouwen senioren b twee-zonder'], // 020 · 9 inscrits
  // ['1aefb5ae-591a-41ed-a5ac-3b5b1793cdcd', 'VM 2-', 'Vrouwen masters twee-zonder'], // 021 · 0 inscrits (vide, décommenter si besoin)
  // ['f87e7ca5-ad84-4fbc-81a6-7bd624c159ee', 'VMD 2-', 'Vrouwen masters d twee-zonder'], // 022 · 0 inscrits (vide, décommenter si besoin)
  ['cf190b70-9523-466d-a1e9-56ef110e81cf', 'MMA 1x', 'Mannen masters a skiff'], // 023 · 2 inscrits
  // ['19e758c0-fb33-4596-861d-c90d269120a8', 'MMB 1x', 'Mannen masters b skiff'], // 024 · 0 inscrits (vide, décommenter si besoin)
  // ['1c2f9963-abf9-488b-a28f-c8f18fbdb10d', 'MMC 1x', 'Mannen masters c skiff'], // 025 · 0 inscrits (vide, décommenter si besoin)
  // ['fa46f4fb-2797-4189-88b6-c4a6a982580a', 'MMD 1x', 'Mannen masters d skiff'], // 026 · 0 inscrits (vide, décommenter si besoin)
  ['d241149d-733e-48f5-8fe8-2a487757fb4e', 'MME 1x', 'Mannen masters e skiff'], // 027 · 7 inscrits
  ['ef0c3f92-016b-4e81-b73e-ecce1c67f716', 'MMF 1x', 'Mannen masters f skiff'], // 028 · 3 inscrits
  ['52749c4c-5f1b-4699-a288-deda364d1cd2', 'M18 2x', 'Mannen achttien dubbeltwee'], // 029 · 15 inscrits
  ['f27e1054-1853-4db6-8798-0b6a01e5b78a', 'V18 2x', 'Vrouwen achttien dubbeltwee'], // 030 · 16 inscrits
  ['14f25c7a-b771-4b5a-9055-68b26d567198', 'M18 2-', 'Mannen achttien twee-zonder'], // 031 · 4 inscrits
  ['5ec0d207-27ad-4e20-bf2f-f5e2fa0fd782', 'V18 2-', 'Vrouwen achttien twee-zonder'], // 032 · 2 inscrits
];

// Traduction en français des codes néerlandais de Time-Team.
// « MSB 1x » -> { code: "SH1x B", nom: "Skiff Senior B Homme" } ; « MMA 1x » -> « MH1x A » (Master A) ;
// « M18 2x » -> « U19H2x » (Junior 18) ; préfixe L = poids léger (PL).
const BATEAUX = { '1X': ['1x', 'Skiff'], '2X': ['2x', 'Deux de couple'], '4X': ['4x', 'Quatre de couple'],
  '2-': ['2-', 'Deux sans barreur'], '4-': ['4-', 'Quatre sans barreur'], '4+': ['4+', 'Quatre barré'], '8+': ['8+', 'Huit barré'] };
function traduire(codeNL, nomNL) {
  const m = String(codeNL || '').toUpperCase().trim().match(/^(L)?([MVHD])(SA|SB|S|M[A-F]?|1[5-8]|23)?\s*(1X|2X|4X|2-|4-|4\+|8\+)$/);
  if (!m) return { code: codeNL || '', nom: nomNL || '' };
  const [, leger, g, cat = '', b] = m;
  const homme = /[MH]/.test(g), sx = homme ? 'H' : 'F', sexe = homme ? 'Homme' : 'Femme';
  const [bc, bn] = BATEAUX[b];
  let code, age;
  if (/^1[78]$/.test(cat)) { code = `U19${sx}${bc}`; age = 'Junior 18'; }
  else if (/^1[56]$/.test(cat)) { code = `U17${sx}${bc}`; age = 'Junior 16'; }
  else if (cat === '23') { code = `U23${sx}${bc}`; age = 'U23'; }
  else if (cat[0] === 'M') { const l = cat.slice(1); code = `M${sx}${bc}${l ? ' ' + l : ''}`; age = 'Master' + (l ? ' ' + l : ''); }
  else { const l = cat === 'SB' ? 'B' : cat === 'SA' ? 'A' : ''; code = `S${sx}${bc}${l ? ' ' + l : ''}`; age = 'Senior' + (l ? ' ' + l : ''); }
  if (leger) code += ' PL';
  return { code, nom: `${bn} ${age} ${sexe}${leger ? ' poids léger' : ''}` };
}

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

  const officiel = EVENEMENTS.find(x => x[0] === ev.id);
  return {
    heure: Math.floor(Number(src.timestamp || Date.now()) / 1000),
    evenement: { id: ev.id || '', ...traduire(officiel ? officiel[1] : ev.code, officiel ? officiel[2] : ev.name) },
    depart: race.start_datetime ?? null,
    points,
    equipages,
  };
}

// La liste des onglets vient directement de EVENEMENTS : instantané, sans appel à Time-Team.
async function construireListe() {
  return EVENEMENTS.map(([id, code, nom]) => ({ id, ...traduire(code, nom) }));
}

const IDS = EVENEMENTS.map(e => e[0]);

module.exports = async (req, res) => {
  const q = req.query || {};
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  let donnees = null, duree = CACHE_SECONDES;
  if (q.brut && IDS.includes(q.brut)) {   // aide au réglage : un équipage brut de Time-Team
    const src = await telecharger(`${API_BASE}/event/${q.brut}/final`);
    const crews = src && src.round_crew ? Object.values(src.round_crew) : [];
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ cles: src ? Object.keys(src) : null, race: src && premier(src.race), round: src && premier(src.round), crew: crews.find(c => c.times && Object.keys(c.times).length) || crews[0] || null }, null, 1));
  }
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
