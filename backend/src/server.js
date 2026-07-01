'use strict';

const createApp = require('./app');

const PORT = process.env.PORT || 3000;

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`BazaarGrid Order Management API running on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Test UI available at http://localhost:${PORT}/index.html`);
});
