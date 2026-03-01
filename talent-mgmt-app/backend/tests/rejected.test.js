const request = require('supertest');
// no fs/path needed since we're mocking data

// mock the database module to avoid importing lowdb (ESM) during tests.
// The mock provides the `db` object with simple read/write stubs along with
// an `init` function that resets the in-memory storage.
let mockDataStore = { svps: [], rejected: [] };

// axios is an ES module; news router imports it.  Mock it to prevent Jest
// from trying to parse the real package.
jest.mock('axios');

jest.mock('../../backend/data', () => {
  return {
    db: {
      read: async () => {},
      write: async () => {},
      get data() {
        return mockDataStore;
      },
      set data(val) {
        mockDataStore = val;
      }
    },
    init: async () => {
      mockDataStore = { svps: [], rejected: [] };
    }
  };
});

const app = require('../../server');
const { db, init } = require('../../backend/data');

beforeAll(async () => {
  // reset mock storage before running tests
  await init();
});

beforeEach(async () => {
  // start each test with empty collections
  db.data = { svps: [], rejected: [] };
  await db.write();
});

// no cleanup needed since nothing is written to disk

describe('basic API sanity', () => {
  test('health endpoint responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/rejected returns empty array initially', async () => {
    const res = await request(app).get('/api/rejected');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('rejected log operations', () => {
  test('can add and retrieve entries', async () => {
    const entry = {
      logId: 1,
      svpId: 10,
      svpName: 'Test SVP',
      successor: { id: 100, name: 'Foo', type: 'internal', yearsExp: 5 },
      removedAt: new Date().toISOString(),
      reason: 'No fit'
    };
    db.data.rejected.push(entry);
    await db.write();

    const res = await request(app).get('/api/rejected');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].svpName).toBe('Test SVP');
  });

  test('DELETE /api/rejected/:logId removes an entry', async () => {
    const entry = {
      logId: 2,
      svpId: 20,
      svpName: 'Another',
      successor: { id: 200, name: 'Bar', type: 'external', yearsExp: 3 },
      removedAt: new Date().toISOString()
    };
    db.data.rejected.push(entry);
    await db.write();

    const delRes = await request(app).delete('/api/rejected/2');
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const getRes = await request(app).get('/api/rejected');
    expect(getRes.body).toHaveLength(0);
  });

  test('PUT /api/rejected/:logId updates an entry', async () => {
    const entry = {
      logId: 3,
      svpId: 30,
      svpName: 'EditSVP',
      successor: { id: 300, name: 'Old', type: 'internal', yearsExp: 1, gender: 'male', grade: 'MG5', english: 'C2' },
      removedAt: '2021-01-01T00:00:00Z',
      reason: 'initial'
    };
    db.data.rejected.push(entry);
    await db.write();

    const updates = {
      reason: 'updated reason',
      successor: { name: 'NewName', grade: 'MG6' }
    };
    const putRes = await request(app)
      .put('/api/rejected/3')
      .send(updates)
      .set('Content-Type', 'application/json');
    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.entry.reason).toBe('updated reason');
    expect(putRes.body.entry.successor.name).toBe('NewName');
    expect(putRes.body.entry.successor.grade).toBe('MG6');

    const getRes = await request(app).get('/api/rejected');
    expect(getRes.body[0].reason).toBe('updated reason');
  });

  test('export endpoints return correct headers and content', async () => {
    const e = {
      logId: 1,
      svpId: 1,
      svpName: 'A',
      successor: { id: 1, name: 'X', type: 'i', yearsExp: 1 },
      removedAt: '2020',
      reason: 'r'
    };
    db.data.rejected.push(e);
    await db.write();

    const csv = await request(app).get('/api/rejected/export.csv');
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('logId,svpId');

    const json = await request(app).get('/api/rejected/export.json');
    expect(json.status).toBe(200);
    expect(json.headers['content-type']).toMatch(/application\/json/);
    const parsed = JSON.parse(json.text);
    expect(parsed[0].svpName).toBe('A');
  });

  test('excel and pdf exports return correct headers', async () => {
    // uses same single entry already added earlier
    const xlsx = await request(app)
      .get('/api/rejected/export.xlsx')
      .buffer()
      .parse((res, callback) => {
        res.setEncoding('binary');
        res.data = '';
        res.on('data', chunk => { res.data += chunk; });
        res.on('end', () => callback(null, Buffer.from(res.data, 'binary')));
      });
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers['content-type']).toMatch(/spreadsheetml/);
    expect(xlsx.body.length).toBeGreaterThan(0);

    const pdf = await request(app)
      .get('/api/rejected/export.pdf')
      .buffer();
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/application\/pdf/);
    expect(pdf.body.length).toBeGreaterThan(0);
  });

  test('query parameter filters results', async () => {
    db.data.rejected.push({
      logId: 1,
      svpId: 1,
      svpName: 'Alice',
      successor: { id: 1, name: 'Bob', type: 'i', yearsExp: 1 },
      removedAt: '2020'
    });
    db.data.rejected.push({
      logId: 2,
      svpId: 1,
      svpName: 'Alice',
      successor: { id: 2, name: 'Charlie', type: 'i', yearsExp: 2 },
      removedAt: '2020'
    });
    await db.write();

    const res = await request(app).get('/api/rejected').query({ query: 'charl' });
    expect(res.body.length).toBe(1);
    expect(res.body[0].successor.name).toBe('Charlie');
  });
});
