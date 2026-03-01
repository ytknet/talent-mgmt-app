import React, { useEffect, useState } from 'react';
import './RejectedLog.css';

export default function RejectedLog({ disableFetch = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [englishFilter, setEnglishFilter] = useState('');
  const [toasts, setToasts] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [editMeta, setEditMeta] = useState({ reason: '', gender: '', grade: '', english: '' });

  const fetchLogs = async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = '/api/rejected' + (q ? `?query=${encodeURIComponent(q)}` : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disableFetch) {
      fetchLogs(query);
    }
  }, [query, disableFetch]);

  // subscribe to SSE for realtime updates
  useEffect(() => {
    if (disableFetch) return undefined;
    const es = new EventSource('/api/rejected/stream');
    es.addEventListener('added', (e) => {
      const entry = JSON.parse(e.data);
      setLogs((prev) => [entry, ...prev]);
      pushToast(`追加: ${entry.successor.name} (${entry.svpName})`);
    });
    es.addEventListener('deleted', (e) => {
      const entry = JSON.parse(e.data);
      setLogs((prev) => prev.filter(l => l.logId !== entry.logId));
      pushToast(`削除: ${entry.successor.name} (${entry.svpName})`);
    });
    es.addEventListener('updated', (e) => {
      const entry = JSON.parse(e.data);
      setLogs((prev) => prev.map(l => (l.logId === entry.logId ? entry : l)));
      pushToast(`更新: ${entry.successor.name} (${entry.svpName})`);
    });
    return () => es.close();
  }, [disableFetch]);

  const pushToast = (text) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id));
    }, 4000);
  };

  // Apply filters and search to logs
  const filteredLogs = logs.filter((entry) => {
    // Text search filter
    if (query && query.trim()) {
      const term = query.trim().toLowerCase();
      const matches =
        (entry.svpName && entry.svpName.toLowerCase().includes(term)) ||
        (entry.successor && entry.successor.name && entry.successor.name.toLowerCase().includes(term)) ||
        (entry.reason && entry.reason.toLowerCase().includes(term));
      if (!matches) return false;
    }

    // Gender filter
    if (genderFilter && entry.successor.gender !== genderFilter) {
      return false;
    }

    // Grade filter
    if (gradeFilter && entry.successor.grade !== gradeFilter) {
      return false;
    }

    // English level filter
    if (englishFilter && entry.successor.english !== englishFilter) {
      return false;
    }

    return true;
  });

  if (loading) return <div className="rejected-log">読み込み中...</div>;
  if (error) return <div className="rejected-log">エラー: {error}</div>;

  const handleEdit = (entry) => {
    setEditTarget(entry);
    setEditMeta({
      reason: entry.reason || '',
      gender: entry.successor.gender || '',
      grade: entry.successor.grade || '',
      english: entry.successor.english || ''
    });
  };

  const confirmEdit = async () => {
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/rejected/${editTarget.logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: editMeta.reason, successor: { gender: editMeta.gender, grade: editMeta.grade, english: editMeta.english } })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setLogs((prev) => prev.map(l => l.logId === body.entry.logId ? body.entry : l));
      pushToast('更新しました');
      setEditTarget(null);
    } catch (err) {
      alert('更新に失敗しました:' + err.message);
    }
  };

  const cancelEdit = () => {
    setEditTarget(null);
  };

  return (
    <div className="rejected-log">
      {/* toast container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
      <h3>見送りログ</h3>
      <div className="rejected-search-group">
        <div className="rejected-search-bar">
          <input
            type="text"
            placeholder="検索 (SVP名、候補者、理由)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="rejected-filters">
          <select
            className="filter-select"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            title="性別でフィルタ"
          >
            <option value="">— 性別 —</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
          <select
            className="filter-select"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            title="グレードでフィルタ"
          >
            <option value="">— グレード —</option>
            <option value="MG5">MG5</option>
            <option value="MG6">MG6</option>
            <option value="MG7">MG7</option>
          </select>
          <select
            className="filter-select"
            value={englishFilter}
            onChange={(e) => setEnglishFilter(e.target.value)}
            title="英語レベルでフィルタ"
          >
            <option value="">— 英語 —</option>
            <option value="C2">C2</option>
            <option value="C1">C1</option>
            <option value="B2">B2</option>
            <option value="B1">B1</option>
            <option value="A2">A2</option>
            <option value="A1">A1</option>
          </select>
        </div>
      </div>
      <div className="rejected-export-bar">
        <button
          className="rejected-export-btn"
          disabled={logs.length === 0}
          onClick={() => {
            window.location.href = '/api/rejected/export.csv';
          }}
        >CSVダウンロード</button>
        <button
          className="rejected-export-btn"
          disabled={logs.length === 0}
          onClick={() => {
            window.location.href = '/api/rejected/export.json';
          }}
        >JSONダウンロード</button>
        <button
          className="rejected-export-btn"
          disabled={logs.length === 0}
          onClick={() => {
            window.location.href = '/api/rejected/export.xlsx';
          }}
        >Excelダウンロード</button>
        <button
          className="rejected-export-btn"
          disabled={logs.length === 0}
          onClick={() => {
            window.location.href = '/api/rejected/export.pdf';
          }}
        >PDFダウンロード</button>
      </div>
      {logs.length === 0 && (
        <div className="no-logs-msg">
          見送り記録はありません。エクスポートボタンは無効になります。
        </div>
      )}
      {logs.length > 0 && filteredLogs.length === 0 && (
        <div className="no-logs-msg">
          該当する見送り記録がありません。フィルタ条件を変更してください。
        </div>
      )}
      <p className="logs-count">
        {filteredLogs.length} / {logs.length}件表示
      </p>
      <ul>
        {filteredLogs.map((entry) => (
          <li key={entry.logId} className="rejected-entry">
            <div className="rejected-meta">
              {entry.removedAt} — {entry.svpName}
              <button
                className="rejected-delete-btn"
                onClick={async () => {
                  if (!window.confirm('このログを削除しますか？')) return;
                  try {
                    const res = await fetch(`/api/rejected/${entry.logId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setLogs(logs.filter(l => l.logId !== entry.logId));
                  } catch (err) {
                    alert('削除に失敗しました:' + err.message);
                  }
                }}
              >削除</button>
              <button
                className="rejected-edit-btn"
                onClick={() => handleEdit(entry)}
              >編集</button>
            </div>
            <div className="rejected-body">
              <div><strong>{entry.successor.name}</strong> ({entry.successor.type}, {entry.successor.yearsExp}年)</div>
              <div>性別: {entry.successor.gender || '不明'} • グレード: {entry.successor.grade || 'N/A'} • 英語: {entry.successor.english || 'N/A'}</div>
              <div>理由: {entry.reason || '—'}</div>
            </div>
          </li>
        ))}
      </ul>
      {editTarget && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">ログ編集</h3>
              <button className="modal-close" onClick={cancelEdit} aria-label="閉じる">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-target-name">{editTarget.successor.name}</p>
              <div className="modal-form-group">
                <label htmlFor="edit-reason">理由</label>
                <textarea
                  id="edit-reason"
                  value={editMeta.reason}
                  onChange={e => setEditMeta({ ...editMeta, reason: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="edit-gender">性別</label>
                <select
                  id="edit-gender"
                  value={editMeta.gender}
                  onChange={e => setEditMeta({ ...editMeta, gender: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="edit-grade">グレード</label>
                <select
                  id="edit-grade"
                  value={editMeta.grade}
                  onChange={e => setEditMeta({ ...editMeta, grade: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="MG5">MG5</option>
                  <option value="MG6">MG6</option>
                  <option value="MG7">MG7</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="edit-english">英語レベル</label>
                <select
                  id="edit-english"
                  value={editMeta.english}
                  onChange={e => setEditMeta({ ...editMeta, english: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="C2">C2</option>
                  <option value="C1">C1</option>
                  <option value="B2">B2</option>
                  <option value="B1">B1</option>
                  <option value="A2">A2</option>
                  <option value="A1">A1</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={confirmEdit} className="confirm-btn">更新</button>
              <button onClick={cancelEdit} className="cancel-btn">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
