const express = require('express');
const path = require('path');
const { getProducts } = require('./utils/AISearch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/search', async (req, res) => {
  console.log(`Search query: ${req.query.query}`);

  const filteredProducts = await getProducts(req.query.query || '');
  res.json(filteredProducts);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
