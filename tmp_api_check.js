const http = require('http');
function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 8080, path, timeout: 5000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}
(async () => {
  try {
    const ventes = await fetch('/api/produits/ventes');
    console.log('ventes:', ventes.status, Array.isArray(ventes.body) ? ventes.body.length : typeof ventes.body);
    const factures = await fetch('/api/produits/factures');
    console.log('factures:', factures.status, Array.isArray(factures.body) ? factures.body.length : typeof factures.body);
    if (Array.isArray(factures.body)) console.log('facture ids:', factures.body.slice(0, 20).map(f => f.id));
  } catch (err) {
    console.error('ERR', err.message);
    process.exit(1);
  }
})();
