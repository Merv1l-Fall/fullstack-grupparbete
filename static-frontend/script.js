fetch('../README.md')
  .then(response => response.text())
  .then(text => {
    document.getElementById('readme-content').innerHTML = marked.parse(text);
  })
  .catch(err => console.error('Kunde inte läsa README:', err));

  // Hämta produkter från ditt API på port 3350
const API_BASE = 'http://localhost:3350/products';

document.getElementById('load-products-btn').addEventListener('click', async () => {
  const container = document.getElementById('readme-content');
  const status = document.getElementById('status');
  status.textContent = 'Hämtar produkter...';

  try {
    const res = await fetch(API_BASE);

    console.log('Fetch status:', res.status, res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Server svarade ${res.status}: ${txt}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const txt = await res.text();
      console.error('Fick icke-JSON-svar från /products:', txt);
      status.textContent = 'Fel: server returnerade icke-JSON. Se konsolen.';
      return;
    }

    const products = await res.send();
    if (!Array.isArray(products) || products.length === 0) {
      status.textContent = 'Inga produkter hittades.';
      return;
    }

    const html = products.map(p => `
      <div class="product-card">
        ${p.url ? `<img src="${p.url}" alt="${p.name || ''}">` : ''}
        <h3>${p.name || 'Namnlös'}</h3>
        <p>Pris: ${p.price ?? '-'} kr</p>
        <small>ID: ${p.productId || p.PK || '-'}</small>
      </div>
    `).join('');

    container.innerHTML += `<div class="products-grid">${html}</div>`;
    status.textContent = `Visar ${products.length} produkter (dom visas under README).`;
  } catch (err) {
    console.error('Fel vid hämtning:', err);
    status.textContent = `Fel: ${err.message}`;
  }
});
