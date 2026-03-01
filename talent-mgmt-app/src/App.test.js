import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock out complex child components so the test can focus on
// high-level rendering without triggering network or SSE logic.
jest.mock('./components/RejectedChart', () => () => <div>MockChart</div>);
jest.mock('./components/RejectedLog', () => () => <div>MockLog</div>);
jest.mock('./components/DailyNewsSection', () => () => <div>MockNews</div>);

beforeAll(() => {
  // Only need to stub the SVP fetch; children are mocked above.
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
});

afterAll(() => {
  delete global.fetch;
});

test('renders the main dashboard header', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText(/SVPサクセッサー管理ダッシュボード/)).toBeInTheDocument());
});
