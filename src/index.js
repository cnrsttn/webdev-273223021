const { createApp } = require('./app');
const dbAccess = require('./db');

const PORT = process.env.PORT || 3000;

dbAccess.initDb()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
