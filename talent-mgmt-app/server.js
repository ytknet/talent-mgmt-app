const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { init } = require('./backend/data');
// During testing we don't need the news scraper and importing it
// would pull in `axios` which is an ES module.  Skip that route when
// running under Jest so that tests don't attempt to parse ESM code.
let newsRouter;
if (process.env.NODE_ENV !== 'test') {
  newsRouter = require('./backend/routes/news');
}
const svpRouter = require('./backend/routes/svps');
const rejectedRouter = require('./backend/routes/rejected');
const { registerClient } = require('./backend/sse');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// データベース初期化
init().catch(console.error);

// ルート登録
if (newsRouter) {
  app.use('/api/news', newsRouter);
}
app.use('/api/svps', svpRouter);
app.use('/api/rejected', rejectedRouter);

// (stream handler now defined within rejected router)

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Only start listening when this module is run directly.  This makes
// it possible to import `app` in tests without binding to a real port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Backend Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
