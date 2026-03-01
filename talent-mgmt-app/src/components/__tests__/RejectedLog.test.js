import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RejectedLog from '../RejectedLog';

// stub fetch and EventSource since component will use them
beforeAll(() => {
  // start with a generic fake; some tests will override locally
  const fake = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
  global.fetch = fake;
  if (typeof window !== 'undefined') {
    window.fetch = fake;
  }
  global.EventSource = class {
    constructor() {}
    addEventListener() {}
    close() {}
  };
});

afterAll(() => {
  delete global.fetch;
  delete global.EventSource;
});

test('renders export buttons including Excel and PDF (disabled when empty)', async () => {
  render(<RejectedLog disableFetch={true} />);
  await screen.findByText('CSVダウンロード');
  const csvBtn = screen.getByText('CSVダウンロード');
  const jsonBtn = screen.getByText('JSONダウンロード');
  const xlsBtn = screen.getByText('Excelダウンロード');
  const pdfBtn = screen.getByText('PDFダウンロード');

  // with no logs these should be disabled
  expect(csvBtn).toBeDisabled();
  expect(jsonBtn).toBeDisabled();
  expect(xlsBtn).toBeDisabled();
  expect(pdfBtn).toBeDisabled();
});

test('user can open edit modal and submit changes', async () => {
  const sample = {
    logId: 5,
    svpName: 'SVPz',
    successor: { name: 'Succ', gender: 'male', grade: 'MG5', english: 'C2', type: 'internal', yearsExp: 2 },
    removedAt: '2022-01-01',
    reason: 'old'
  };
  const fake = jest.fn((url, opts) => {
    if (!opts) {
      // GET logs
      return Promise.resolve({ ok: true, json: () => Promise.resolve([sample]) });
    }
    if (opts.method === 'PUT') {
      // return updated entry echoed
      const body = JSON.parse(opts.body);
      const updated = { ...sample, reason: body.reason, successor: { ...sample.successor, ...body.successor } };
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, entry: updated }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  global.fetch = fake;
  if (typeof window !== 'undefined') window.fetch = fake;

  render(<RejectedLog disableFetch={false} />);
  // wait for sample entry to render (SVP name may be part of larger string)
  await screen.findByText(/SVPz/);
  expect(screen.getByText(/old/)).toBeInTheDocument();

  const editBtn = screen.getByText('編集');
  fireEvent.click(editBtn);

  // modal should appear with textarea
  const textarea = await screen.findByLabelText('理由');
  expect(textarea.value).toBe('old');

  // change reason and submit
  fireEvent.change(textarea, { target: { value: 'newReason' } });

  const updateBtn = screen.getByText('更新');
  fireEvent.click(updateBtn);

  // after submission, the textarea should disappear (modal closed) and log updated
  await screen.findByText(/newReason/);
  expect(fake).toHaveBeenCalledWith('/api/rejected/5', expect.objectContaining({ method: 'PUT' }));
});
