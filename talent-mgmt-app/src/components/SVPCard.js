import React, { useState, useEffect } from 'react';
import SuccessorBadge from './SuccessorBadge';
import './SVPCard.css';

const SVPCard = ({ svp }) => {
  const [successors, setSuccessors] = useState(svp.successors);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteMeta, setDeleteMeta] = useState({ reason: '', gender: 'male', grade: 'MG5', english: 'C2' });
  const [newSuccessor, setNewSuccessor] = useState({
    name: '',
    type: 'internal',
    yearsExp: ''
  });

  const handleAddSuccessor = async () => {
    if (newSuccessor.name.trim() === '' || newSuccessor.yearsExp === '') return;

    const payload = {
      name: newSuccessor.name,
      type: newSuccessor.type,
      yearsExp: parseInt(newSuccessor.yearsExp)
    };

    try {
      const res = await fetch(`/api/svps/${svp.id}/successors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setSuccessors([...successors, created]);
      setNewSuccessor({ name: '', type: 'internal', yearsExp: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add successor', err);
      // optionally show error to user
    }
  };

  const handleDeleteSuccessor = async (id) => {
    // open confirmation form for this successor
    const s = successors.find(x => x.id === id);
    setDeleteTarget(s || { id });
    // reset metadata defaults
    setDeleteMeta({ reason: '', gender: 'male', grade: 'MG5', english: 'C2' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/svps/${svp.id}/successors/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteMeta)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccessors(successors.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete successor', err);
      // keep modal open so user can retry
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // ESC key closes modal
  useEffect(() => {
    if (!deleteTarget) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        cancelDelete();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [deleteTarget]);

  return (
    <div className="svp-card">
      <div className="svp-header">
        <div className="svp-title-row">
          <h2 className="svp-name">{svp.name}</h2>
          <button 
            className="add-btn"
            onClick={() => setShowForm(!showForm)}
            title="候補者を追加"
          >
            +
          </button>
        </div>
        <p className="svp-position">{svp.position}</p>
      </div>

      {showForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="名前"
            value={newSuccessor.name}
            onChange={(e) => setNewSuccessor({ ...newSuccessor, name: e.target.value })}
            className="form-input"
          />
          <input
            type="number"
            placeholder="経験年数"
            value={newSuccessor.yearsExp}
            onChange={(e) => setNewSuccessor({ ...newSuccessor, yearsExp: e.target.value })}
            className="form-input"
            min="0"
          />
          <select
            value={newSuccessor.type}
            onChange={(e) => setNewSuccessor({ ...newSuccessor, type: e.target.value })}
            className="form-select"
          >
            <option value="internal">内部候補</option>
            <option value="external">外部候補</option>
          </select>
          <div className="form-buttons">
            <button onClick={handleAddSuccessor} className="confirm-btn">追加</button>
            <button onClick={() => setShowForm(false)} className="cancel-btn">キャンセル</button>
          </div>
        </div>
      )}

      <div className="successors-section">
        <h3 className="successors-title">サクセッサー候補</h3>
        <ul className="successors-list">
          {successors.map((successor) => (
            <li key={successor.id} className="successor-item">
              <div className="successor-info">
                <p className="successor-name">{successor.name}</p>
                <p className="successor-exp">経験年数: {successor.yearsExp}年</p>
              </div>
              <div className="successor-actions">
                <SuccessorBadge type={successor.type} />
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteSuccessor(successor.id)}
                  title="削除"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {deleteTarget && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">見送り登録</h3>
              <button className="modal-close" onClick={cancelDelete} aria-label="閉じる">×</button>
            </div>
            <div className="modal-body">
              <p className="modal-target-name">{deleteTarget.name}</p>
              
              <div className="modal-form-group">
                <label htmlFor="reason">理由</label>
                <textarea 
                  id="reason"
                  value={deleteMeta.reason} 
                  onChange={(e) => setDeleteMeta({ ...deleteMeta, reason: e.target.value })}
                  placeholder="見送り理由を入力してください"
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="gender">性別</label>
                <select 
                  id="gender"
                  value={deleteMeta.gender} 
                  onChange={(e) => setDeleteMeta({ ...deleteMeta, gender: e.target.value })}
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="grade">グレード</label>
                <select 
                  id="grade"
                  value={deleteMeta.grade} 
                  onChange={(e) => setDeleteMeta({ ...deleteMeta, grade: e.target.value })}
                >
                  <option value="MG5">MG5</option>
                  <option value="MG6">MG6</option>
                  <option value="MG7">MG7</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="english">英語レベル</label>
                <select 
                  id="english"
                  value={deleteMeta.english} 
                  onChange={(e) => setDeleteMeta({ ...deleteMeta, english: e.target.value })}
                >
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
              <button onClick={confirmDelete} className="confirm-btn">見送り登録</button>
              <button onClick={cancelDelete} className="cancel-btn">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SVPCard;
