const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { broadcast, registerClient } = require('../sse');
// helpers for additional exports
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// GET /api/rejected/export.csv - download CSV
router.get('/export.csv', async (req, res) => {
  await db.read();
  const entries = db.data.rejected || [];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.csv"');
  res.send(convertToCSV(entries));
});

// GET /api/rejected/export.json - get JSON
router.get('/export.json', async (req, res) => {
  await db.read();
  res.json(db.data.rejected || []);
});

// GET /api/rejected/export.xlsx - download Excel workbook
router.get('/export.xlsx', async (req, res) => {
  await db.read();
  const entries = db.data.rejected || [];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Rejected');
  sheet.columns = [
    { header: 'logId', key: 'logId' },
    { header: 'svpId', key: 'svpId' },
    { header: 'svpName', key: 'svpName' },
    { header: 'successorId', key: 'successorId' },
    { header: 'successorName', key: 'successorName' },
    { header: 'successorType', key: 'successorType' },
    { header: 'successorYearsExp', key: 'successorYearsExp' },
    { header: 'successorGender', key: 'successorGender' },
    { header: 'successorGrade', key: 'successorGrade' },
    { header: 'successorEnglish', key: 'successorEnglish' },
    { header: 'removedAt', key: 'removedAt' },
    { header: 'reason', key: 'reason' }
  ];
  entries.forEach(e => {
    sheet.addRow({
      logId: e.logId,
      svpId: e.svpId,
      svpName: e.svpName,
      successorId: e.successor.id,
      successorName: e.successor.name,
      successorType: e.successor.type,
      successorYearsExp: e.successor.yearsExp,
      successorGender: e.successor.gender || '',
      successorGrade: e.successor.grade || '',
      successorEnglish: e.successor.english || '',
      removedAt: e.removedAt,
      reason: e.reason || ''
    });
  });
  const buf = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.xlsx"');
  res.send(Buffer.from(buf));
});

// GET /api/rejected/export.pdf - download PDF of logs (table formatted)
router.get('/export.pdf', async (req, res) => {
  await db.read();
  const logs = db.data.rejected || [];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.pdf"');

  // Use buffered pages so we can add page numbers after rendering
  const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
  doc.pipe(res);

  // Title
  doc.fontSize(18).font('Helvetica-Bold').text('Rejected Successors', { align: 'center' });
  doc.moveDown(0.6);

  const pageInnerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Column width strategy: relative weights to distribute across pageInnerWidth
  const weights = {
    logId: 0.06,
    svpName: 0.14,
    succName: 0.22,
    gender: 0.06,
    grade: 0.06,
    english: 0.08,
    reason: 0.28,
    removedAt: 0.10
  };
  const colWidths = {};
  Object.keys(weights).forEach(k => { colWidths[k] = Math.floor(pageInnerWidth * weights[k]); });

  const startX = doc.page.margins.left;

  function drawHeader() {
    const headerHeight = 18;
    const y = doc.y;
    // Draw header background
    doc.save()
      .rect(startX, y, pageInnerWidth, headerHeight)
      .fillOpacity(0.08)
      .fillAndStroke('#cfe8ff', '#cfe8ff');
    doc.fillOpacity(1).fillColor('black');

    doc.fontSize(10).font('Helvetica-Bold');
    let x = startX;
    doc.text('logId', x + 4, y + 4, { width: colWidths.logId - 6 }); x += colWidths.logId;
    doc.text('SVP', x + 4, y + 4, { width: colWidths.svpName - 6 }); x += colWidths.svpName;
    doc.text('Successor', x + 4, y + 4, { width: colWidths.succName - 6 }); x += colWidths.succName;
    doc.text('性別', x + 4, y + 4, { width: colWidths.gender - 6 }); x += colWidths.gender;
    doc.text('Grade', x + 4, y + 4, { width: colWidths.grade - 6 }); x += colWidths.grade;
    doc.text('英語', x + 4, y + 4, { width: colWidths.english - 6 }); x += colWidths.english;
    doc.text('Reason', x + 4, y + 4, { width: colWidths.reason - 6 }); x += colWidths.reason;
    doc.text('RemovedAt', x + 4, y + 4, { width: colWidths.removedAt - 6 });
    doc.moveDown(1.2);

    // Draw vertical separators
    doc.lineWidth(0.4).strokeColor('#dddddd');
    let sx = startX;
    Object.keys(colWidths).forEach((k) => {
      sx += colWidths[k];
      doc.moveTo(sx, y).lineTo(sx, y + headerHeight + 6).stroke();
    });
    doc.restore();
    doc.font('Helvetica');
  }

  drawHeader();

  const rowHeight = 14;
  logs.forEach((e) => {
    // page break if needed
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawHeader();
    }

    let x = startX;
    doc.fontSize(9).text(String(e.logId), x + 4, doc.y, { width: colWidths.logId - 6 }); x += colWidths.logId;
    doc.text(String(e.svpName), x + 4, doc.y, { width: colWidths.svpName - 6 }); x += colWidths.svpName;
    doc.text(String(e.successor.name), x + 4, doc.y, { width: colWidths.succName - 6 }); x += colWidths.succName;
    doc.text(String(e.successor.gender || ''), x + 4, doc.y, { width: colWidths.gender - 6 }); x += colWidths.gender;
    doc.text(String(e.successor.grade || ''), x + 4, doc.y, { width: colWidths.grade - 6 }); x += colWidths.grade;
    doc.text(String(e.successor.english || ''), x + 4, doc.y, { width: colWidths.english - 6 }); x += colWidths.english;
    doc.text(String(e.reason || ''), x + 4, doc.y, { width: colWidths.reason - 6 }); x += colWidths.reason;
    doc.text(String(e.removedAt), x + 4, doc.y, { width: colWidths.removedAt - 6 });
    doc.moveDown(0.9);

    // Draw row separators (light)
    const rowY = doc.y - rowHeight + 2;
    doc.lineWidth(0.3).strokeColor('#f0f0f0');
    let sx = startX;
    Object.keys(colWidths).forEach((k) => {
      sx += colWidths[k];
      doc.moveTo(startX, rowY).lineTo(startX + pageInnerWidth, rowY).stroke();
    });
  });

  // Add page numbers to buffered pages
  const range = doc.bufferedPageRange(); // { start: 0, count: N }
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const p = i + 1;
    doc.fontSize(9).fillColor('gray').text(`Page ${p} / ${range.count}`, doc.page.width - doc.page.margins.right - 100, doc.page.height - doc.page.margins.bottom - 10, { width: 100, align: 'right' });
  }

  doc.end();
});

// GET /api/rejected/export.csv - CSV export
router.get('/export.csv', async (req, res) => {
  await db.read();
  const logs = db.data.rejected || [];
  const csv = convertToCSV(logs);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.csv"');
  res.send(csv);
});

// GET /api/rejected/export.json - JSON export
router.get('/export.json', async (req, res) => {
  await db.read();
  const logs = db.data.rejected || [];
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.json"');
  res.json(logs);
});

// GET /api/rejected/export.xlsx - Excel export
router.get('/export.xlsx', async (req, res) => {
  await db.read();
  const logs = db.data.rejected || [];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rejected Logs');
  worksheet.columns = [
    { header: 'logId', key: 'logId', width: 10 },
    { header: 'svpId', key: 'svpId', width: 10 },
    { header: 'svpName', key: 'svpName', width: 20 },
    { header: 'successorId', key: 'successorId', width: 10 },
    { header: 'successorName', key: 'successorName', width: 20 },
    { header: 'successorType', key: 'successorType', width: 15 },
    { header: 'successorYearsExp', key: 'successorYearsExp', width: 15 },
    { header: 'successorGender', key: 'successorGender', width: 15 },
    { header: 'successorGrade', key: 'successorGrade', width: 12 },
    { header: 'successorEnglish', key: 'successorEnglish', width: 15 },
    { header: 'removedAt', key: 'removedAt', width: 20 },
    { header: 'reason', key: 'reason', width: 30 }
  ];
  logs.forEach(e => {
    worksheet.addRow({
      logId: e.logId,
      svpId: e.svpId,
      svpName: e.svpName,
      successorId: e.successor.id,
      successorName: e.successor.name,
      successorType: e.successor.type,
      successorYearsExp: e.successor.yearsExp,
      successorGender: e.successor.gender || '',
      successorGrade: e.successor.grade || '',
      successorEnglish: e.successor.english || '',
      removedAt: e.removedAt,
      reason: e.reason || ''
    });
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="rejected_logs.xlsx"');
  return workbook.xlsx.write(res);
});

// GET /api/rejected/stream - Server-Sent Events stream
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  registerClient(res);
  res.write('data: {"type":"connected"}\n\n');
});

// GET /api/rejected/export.pdf - download PDF of logs (table formatted)


// GET /api/rejected - list all rejected logs (supports optional ?query=)
router.get('/', async (req, res) => {
  await db.read();
  let entries = db.data.rejected || [];
  const q = req.query.query;
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    entries = entries.filter((e) =>
      (e.successor && e.successor.name && e.successor.name.toLowerCase().includes(term)) ||
      (e.reason && e.reason.toLowerCase().includes(term)) ||
      (e.svpName && e.svpName.toLowerCase().includes(term))
    );
  }
  res.json(entries);
});

// PUT /api/rejected/:logId - update a log entry (admin)
router.put('/:logId', async (req, res) => {
  await db.read();
  const logId = parseInt(req.params.logId);
  const entry = (db.data.rejected || []).find(e => e.logId === logId);
  if (!entry) {
    return res.status(404).json({ error: 'Log not found' });
  }

  // allow editing of top-level fields
  if (req.body.svpName !== undefined) entry.svpName = req.body.svpName;
  if (req.body.removedAt !== undefined) entry.removedAt = req.body.removedAt;
  if (req.body.reason !== undefined) entry.reason = req.body.reason;

  if (req.body.successor && typeof entry.successor === 'object') {
    const upd = req.body.successor;
    ['name', 'gender', 'grade', 'english', 'type', 'yearsExp'].forEach(k => {
      if (upd[k] !== undefined) {
        entry.successor[k] = upd[k];
      }
    });
  }

  await db.write();
  broadcast('updated', entry);
  res.json({ success: true, entry });
});

// GET /api/rejected/:svpId - list rejected logs for a specific SVP
// (also supports optional ?query= filtering)
router.get('/:svpId', async (req, res) => {
  await db.read();
  const svpId = parseInt(req.params.svpId);
  let entries = (db.data.rejected || []).filter(e => e.svpId === svpId);
  const q = req.query.query;
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    entries = entries.filter((e) =>
      e.successor.name.toLowerCase().includes(term) ||
      (e.reason && e.reason.toLowerCase().includes(term))
    );
  }
  res.json(entries);
});

// DELETE /api/rejected/:logId - remove a log entry
router.delete('/:logId', async (req, res) => {
  await db.read();
  const logId = parseInt(req.params.logId);
  const idx = (db.data.rejected || []).findIndex(e => e.logId === logId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Log not found' });
  }
  const removed = db.data.rejected.splice(idx, 1)[0];
  await db.write();
  // notify subscribers
  broadcast('deleted', removed);
  res.json({ success: true, removed });
});

function convertToCSV(entries) {
  const header = ['logId','svpId','svpName','successorId','successorName','successorType','successorYearsExp','successorGender','successorGrade','successorEnglish','removedAt','reason'];
  const lines = [header.join(',')];
  entries.forEach(e => {
    const row = [
      e.logId,
      e.svpId,
      `"${e.svpName}"`,
      e.successor.id,
      `"${e.successor.name}"`,
      e.successor.type,
      e.successor.yearsExp,
      (e.successor.gender || ''),
      (e.successor.grade || ''),
      (e.successor.english || ''),
      e.removedAt,
      `"${e.reason || ''}"`
    ];
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

module.exports = router;
