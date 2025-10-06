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
    if (!res.ok) throw new Error(`Serverfel: ${res.status}`);
    const products = await res.json();

    if (products.length === 0) {
      status.textContent = 'Inga produkter hittades.';
      return;
    }

    // 🟢 Bygg HTML utifrån rätt fältnamn
    const html = products.map(p => `
      <div class="product-card">
        <h3>${p.productName}</h3>
        <p><strong>Pris:</strong> ${p.price} kr</p>
        <p><strong>Lager:</strong> ${p.amountInStock}</p>
        
        <small>${p.PK}</small>
      </div>
    `).join('');

    container.innerHTML += `<div class="products-grid">${html}</div>`;
    status.textContent = `Visar ${products.length} produkter(dom visas under README texten).`;
  } catch (err) {
    console.error('Fel vid hämtning:', err);
    status.textContent = `Fel: ${err.message}`;
  }
});
