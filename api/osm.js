// Aide à la préparation de la carte : lit OpenStreetMap (Overpass) depuis Vercel.
//   /api/osm?voie=Eemskanaal&bbox=53.20,6.55,53.35,6.95
// Renvoie le tracé de la voie d'eau (lignes) et les bornes kilométriques trouvées.
module.exports = async (req, res) => {
  const q = req.query || {};
  const voie = String(q.voie || 'Eemskanaal').replace(/["\\]/g, '');
  const bbox = String(q.bbox || '53.20,6.55,53.35,6.95').replace(/[^\d.,-]/g, '');
  const requete = `[out:json][timeout:25];
(way["waterway"]["name"="${voie}"](${bbox});
 node["waterway"="milestone"](${bbox});
 node["seamark:type"="distance_mark"](${bbox}););
out geom;`;
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', body: 'data=' + encodeURIComponent(requete),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'temps-hel (carte de course)' },
      signal: AbortSignal.timeout(25000),
    });
    const j = await r.json();
    const lignes = j.elements.filter(e => e.type === 'way').map(w => ({ id: w.id, pts: w.geometry.map(g => [+g.lat.toFixed(5), +g.lon.toFixed(5)]) }));
    const bornes = j.elements.filter(e => e.type === 'node').map(n => ({ lat: n.lat, lon: n.lon, tags: n.tags }));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    res.end(JSON.stringify({ voie, bornes, lignes }));
  } catch (e) {
    res.statusCode = 502;
    res.end(JSON.stringify({ erreur: String(e) }));
  }
};
