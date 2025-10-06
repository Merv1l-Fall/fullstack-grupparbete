fetch('../README.md')
  .then(response => response.text())
  .then(text => {
    document.getElementById('readme-content').innerHTML = marked.parse(text);
  })
  .catch(err => console.error('Kunde inte läsa README:', err));