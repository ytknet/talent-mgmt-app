import React, { useEffect, useState } from 'react';
import SVPCard from './SVPCard';
import DailyNewsSection from './DailyNewsSection';
import RejectedLog from './RejectedLog';
import RejectedChart from './RejectedChart';
import './SVPDashboard.css';

const SVPDashboard = () => {
  const [svps, setSvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSvps = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/svps');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSvps(data);
      } catch (err) {
        console.error('Failed to load SVPs', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSvps();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">SVPサクセッサー管理ダッシュボード</h1>
        <p className="dashboard-subtitle">メルカリ経営幹部のサクセッサー候補一覧</p>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-badge badge-internal">内部候補</span>
          <span className="legend-text">社内候補</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge badge-external">外部候補</span>
          <span className="legend-text">外部候補</span>
        </div>
      </div>

      <div className="cards-container">
        {loading && <p>Loading SVPs...</p>}
        {error && <p className="error-text">Error: {error}</p>}
        {!loading && !error && svps.map((svp) => (
          <SVPCard key={svp.id} svp={svp} />
        ))}
      </div>

      <DailyNewsSection />
      <RejectedChart />
      <RejectedLog />
    </div>
  );
};

export default SVPDashboard;
