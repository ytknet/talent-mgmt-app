import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RejectedChart from '../RejectedChart';

// mock out the Bar component so we don't need a canvas environment
jest.mock('react-chartjs-2', () => ({
  Bar: (props) => <div data-testid="bar-chart" {...props} />
}));

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve([
      { svpName: 'A' },
      { svpName: 'B' },
      { svpName: 'A' }
    ]) })
  );
});

afterEach(() => {
  delete global.fetch;
});

test('renders loading state then chart heading and Bar component', async () => {
  render(<RejectedChart />);
  expect(screen.getByText(/チャート読み込み中/)).toBeInTheDocument();

  await waitFor(() => screen.getByTestId('bar-chart'));
  expect(screen.getByText('SVP別見送り件数')).toBeInTheDocument();
});
