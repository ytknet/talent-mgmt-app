// lowdb v7 switched to separate node-specific adapters.  The
// JSONFile class is exported from "lowdb/node" instead of the
// top-level package.  Previously we imported both from
// 'lowdb' which worked in older versions, but with the current
// dependency we were seeing `JSONFile is not a constructor` at
// runtime.  Adjust accordingly.
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// データファイル path.  Allow tests to override via DB_FILE env var.
const fileName = process.env.DB_FILE || 'db.json';
const file = path.join(__dirname, fileName);
const adapter = new JSONFile(file);
// Starting with lowdb v7 the Low constructor requires a second argument
// for default data; if omitted it throws "missing default data".
// We can simply supply an empty object and then populate it during
// `init()` if the file was empty.
const db = new Low(adapter, {});

// DB初期化
async function init() {
  await db.read();
  // If the file or in-memory data doesn't include `svps`, populate defaults.
  const defaultSvps = [
    {
      id: 1,
      name: 'Mark',
      position: 'Senior Vice President',
      successors: [
        { id: 101, name: 'John Smith', type: 'internal', yearsExp: 8 },
        { id: 102, name: 'Sarah Johnson', type: 'internal', yearsExp: 6 },
        { id: 103, name: 'Michael Chen', type: 'external', yearsExp: 10 }
      ]
    },
    {
      id: 2,
      name: 'Shuji',
      position: 'Senior Vice President',
      successors: [
        { id: 201, name: 'Hiroshi Tanaka', type: 'internal', yearsExp: 7 },
        { id: 202, name: 'Yuki Yamamoto', type: 'external', yearsExp: 9 },
        { id: 203, name: 'Akira Suzuki', type: 'internal', yearsExp: 5 }
      ]
    },
    {
      id: 3,
      name: 'Sayaka',
      position: 'Senior Vice President',
      successors: [
        { id: 301, name: 'Emma Davis', type: 'external', yearsExp: 11 },
        { id: 302, name: 'Lisa Anderson', type: 'internal', yearsExp: 8 },
        { id: 303, name: 'Nicole Martinez', type: 'external', yearsExp: 7 }
      ]
    }
  ];

  if (!db.data || !Array.isArray(db.data.svps) || db.data.svps.length === 0) {
    db.data = db.data || {};
    db.data.svps = defaultSvps;
    // store for rejected / passed-over successors
    db.data.rejected = db.data.rejected || [];
  }
  await db.write();
}

module.exports = { db, init };