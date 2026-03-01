import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RejectedChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/rejected');
      const logs = await res.json();
      const counts = {};
      logs.forEach((e) => {
        counts[e.svpName] = (counts[e.svpName] || 0) + 1;
      });
      const labels = Object.keys(counts);
      const values = labels.map((l) => counts[l]);
      setData({
        labels,
        datasets: [
          {
            label: '見送り件数',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      });
    };
    fetchData();
  }, []);

  if (!data) return <div>チャート読み込み中...</div>;

  return (
    <div className="rejected-chart">
      <h3>SVP別見送り件数</h3>
      <Bar data={data} />
    </div>
  );
}
