# Talent Management App Backend

This folder contains a simple Express-based backend used by the talent-mgmt-app frontend.

## Structure

```
backend/
  data.js         # lowdb configuration and initial data
  routes/
    news.js       # endpoint for scraping Nikkei HR news
    svps.js       # CRUD routes for SVPs and successors
server.js         # entry point registering routers
```

The database is stored in `backend/db.json` and uses [lowdb](https://github.com/typicode/lowdb) for small-scale JSON persistence.

### Available API endpoints

- `GET /api/health` - simple health check
- `GET /api/news` - fetch latest HR news from Nippon Keizai (scraped)

- `GET /api/svps` - list all SVPs with successors
- `GET /api/svps/:id` - get single SVP
- `POST /api/svps/:id/successors` - add a successor
- `DELETE /api/svps/:id/successors/:succId` - remove a successor

- `GET /api/rejected` - list all rejected (removed) successor logs
   - supports `?query=<term>` to search SVP name, successor name, or reason
- `GET /api/rejected/:svpId` - logs for a specific SVP (also supports `?query=`)
- `DELETE /api/rejected/:logId` - permanently delete a log entry
- `GET /api/rejected/export.csv` - download CSV of all logs
- `GET /api/rejected/export.json` - download formatted JSON of all logs
- `GET /api/rejected/export.xlsx` - download an Excel spreadsheet of all logs
- `GET /api/rejected/export.pdf` - download a simple PDF report of all logs
- `GET /api/rejected/stream` - Server-Sent Events (SSE) stream for real-time updates

**Manual Testing Examples**

```bash
# search logs
curl "http://localhost:3001/api/rejected?query=shoji"

# delete a log
curl -X DELETE "http://localhost:3001/api/rejected/12345"

# export CSV
curl -o logs.csv "http://localhost:3001/api/rejected/export.csv"

# stream events (in another terminal)
curl -N http://localhost:3001/api/rejected/stream
# then generate a log by removing a successor via the svps API
```

### Automated backend tests

A small Jest + Supertest suite is included under `backend/tests`.  It mocks
out the data layer and exercises the rejected‑log endpoints (listing,
filtering, deletion, export headers, etc.).  Run it from the project root with:

```bash
npm run test:backend
```

The configuration is in `jest.backend.config.js` and uses `NODE_ENV=test` so
that the news scraper (which pulls in axios) is skipped during the tests.


## Development

From the project root run:

```bash
# start only backend
npm run start:server

# start both backend + frontend
npm run start:all
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:3001`.
