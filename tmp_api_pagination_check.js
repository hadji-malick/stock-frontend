const http = require('http');
const urls = [
  '/api/produits/ventes',
  '/api/produits/ventes?size=100',
  '/api/produits/ventes?limit=100',
  '/api/produits/ventes?max=100',
  '/api/produits/ventes?count=100',
  '/api/produits/ventes?perPage=100',
  '/api/produits/ventes?page=0&size=100',
  '/api/produits/ventes?offset=0&limit=100',
  '/api/produits/ventes?page=1&size=100',
  '/api/produits/ventes?sort=date,desc'
];
function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 8080, path, timeout: 5000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (err) {
          return resolve({ path, status: res.statusCode, body: data, err: 'invalid-json' });
        }
        resolve({ path, status: res.statusCode, body });
      });
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}
(async () => {
  for (const path of urls) {
    try {
      const result = await fetch(path);
      const count = Array.isArray(result.body) ? result.body.length : (result.body && result.body.content ? result.body.content.length : 'n/a');
      console.log(`${path} -> status=${result.status} count=${count}`);
      if (Array.isArray(result.body)) {
        console.log('first ids:', result.body.slice(0, 5).map((item) => item.id || item.factureId || item.numero || item));
      } else if (result.body && result.body.content) {
        console.log('first ids:', result.body.content.slice(0, 5).map((item) => item.id || item.factureId || item.numero || item));
      } else {
        console.log('body sample:', typeof result.body === 'object' ? JSON.stringify(result.body).slice(0, 300) : result.body.slice(0, 300));
      }
    } catch (err) {
      console.log(`${path} -> ERROR ${err.message}`);
    }
    console.log('---');
  }
})();
