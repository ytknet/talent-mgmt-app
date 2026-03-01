const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { broadcast } = require('../sse');

// 全SVP取得
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.svps);
});

// 単一SVP取得
router.get('/:id', async (req, res) => {
  await db.read();
  const id = parseInt(req.params.id);
  const svp = db.data.svps.find((s) => s.id === id);
  if (!svp) return res.status(404).json({ error: 'SVP not found' });
  res.json(svp);
});

// サクセッサー追加
router.post('/:id/successors', async (req, res) => {
  await db.read();
  const id = parseInt(req.params.id);
  const svp = db.data.svps.find((s) => s.id === id);
  if (!svp) return res.status(404).json({ error: 'SVP not found' });

  const newSucc = req.body;
  const nextId =
    svp.successors.length > 0
      ? Math.max(...svp.successors.map((s) => s.id)) + 1
      : id * 100 + 1;
  newSucc.id = nextId;
  svp.successors.push(newSucc);
  await db.write();
  res.status(201).json(newSucc);
});

// サクセッサー削除
router.delete('/:id/successors/:succId', async (req, res) => {
  await db.read();
  const id = parseInt(req.params.id);
  const succId = parseInt(req.params.succId);
  const svp = db.data.svps.find((s) => s.id === id);
  if (!svp) return res.status(404).json({ error: 'SVP not found' });

  const removed = svp.successors.find((s) => s.id === succId);
  if (!removed) return res.status(404).json({ error: 'Successor not found' });

  // Append to rejected log with metadata (accept reason, gender, grade, english)
  db.data.rejected = db.data.rejected || [];
  // Ensure we copy the successor object and augment with optional fields
  const successorMeta = Object.assign({}, removed);
  if (req.body) {
    if (req.body.gender) successorMeta.gender = req.body.gender;
    if (req.body.grade) successorMeta.grade = req.body.grade;
    if (req.body.english) successorMeta.english = req.body.english;
  }

  const logEntry = {
    logId: Date.now(),
    svpId: svp.id,
    svpName: svp.name,
    successor: successorMeta,
    removedAt: new Date().toISOString(),
    reason: req.body && req.body.reason ? req.body.reason : 'removed via API'
  };
  db.data.rejected.push(logEntry);
  // notify any clients watching for changes
  const { broadcast } = require('../sse');
  if (typeof broadcast === 'function') {
    broadcast('added', logEntry);
  }

  // Remove from successors and persist
  svp.successors = svp.successors.filter((s) => s.id !== succId);
  await db.write();
  res.json({ success: true, removed: removed, log: logEntry });
});

module.exports = router;