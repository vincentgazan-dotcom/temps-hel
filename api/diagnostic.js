// Page de diagnostic : /api/diagnostic
// Cherche l'adresse du flux Time-Team depuis Vercel et affiche le résultat en texte.

const ID = '1efe25d2-fcb5-4858-a9ae-01666a2c66b0'; // 001 M 2- (2025)
const CANDIDATS = [
  `https://api.regatta.time-team.nl/api/2/hel/2025/event/${ID}/final`,
  `https://api.regatta.time-team.nl/api/v1/hel/2025/event/${ID}/final`,
  `https://api.regatta.time-team.nl/1/hel/2025/event/${ID}/final`,
  `https://api.regatta.time-team.nl/api/1/regatta/hel/2025/event/${ID}/final`,
  `https://api.regatta.time-team.nl/`,
  `https://api.regatta.time-team.nl/api/1/`,
  `https://api.regatta.time-team.nl/api/1/hel/2025/event/${ID}/final`,
  `https://api.regatta.time-team.nl/api/1/hel/2025/event/${ID}`,
  `https://api.regatta.time-team.nl/api/1/hel/2025`,
  `https://beta.regatta.time-team.nl/api/1/hel/2025/event/${ID}/final`,
];

async function essayer(url, accept = 'application/json') {
  try {
    const r = await fetch(url, { headers: { Accept: accept, 'User-Agent': 'Mozilla/5.0 temps-hel' }, signal: AbortSignal.timeout(8000) });
    const t = await r.text();
    return { code: r.status, texte: t };
  } catch (e) {
    return { code: 'ERREUR ' + e.message, texte: '' };
  }
}

module.exports = async (req, res) => {
  const lignes = [];
  for (const u of CANDIDATS) {
    const r = await essayer(u);
    lignes.push(`${r.code}  ${u}\n      ${r.texte.slice(0, 150).replace(/\s+/g, ' ')}`);
  }

  // Recherche des adresses "api" dans le code de la page beta de Time-Team.
  const page = await essayer(`https://beta.regatta.time-team.nl/hel/2025/events/${ID}/finals`, 'text/html');
  lignes.push(`\nPage beta : ${page.code}`);
  const trouves = new Set();
  const chercher = t => (t.match(/https?:\/\/[a-z0-9.\-]*time-team[a-z0-9.\-]*[^"'`\s)]*/gi) || []).forEach(x => trouves.add(x.slice(0, 120)));
  chercher(page.texte);
  const scripts = [...new Set([...page.texte.matchAll(/["'(]([^"'()\s]*\/_next\/[^"'()\s]+?\.js)/g)].map(m => new URL(m[1].replace(/\\\//g, '/'), 'https://beta.regatta.time-team.nl').href))];
  const nd = page.texte.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]{0,1500})/);
  if (nd) lignes.push('NEXT_DATA : ' + nd[1].replace(/\s+/g, ' ').slice(0, 1500));
  (page.texte.match(/.{0,80}(api\.|\/api\/|NEXT_PUBLIC)[^\n]{0,80}/g) || []).slice(0, 10).forEach(a => trouves.add('PAGE … ' + a));
  for (const s of scripts.slice(0, 60)) {
    const r = await essayer(s, '*/*');
    chercher(r.texte);
    const api = r.texte.match(/.{0,80}(api\.regatta|api\.ffaviron|\/api\/\d|NEXT_PUBLIC_[A-Z_]+|\/final\b|baseURL).{0,80}/g);
    if (api) api.slice(0, 6).forEach(a => trouves.add(s.split('/').pop() + ' … ' + a));
  }
  lignes.push(`Scripts lus : ${scripts.length}`);
  lignes.push(...[...trouves].filter(x => !/club_blade|media\/regatta/.test(x)).slice(0, 80));

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(lignes.join('\n'));
};
