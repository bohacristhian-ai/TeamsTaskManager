import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { LabelBadge } from './LabelBadge';

interface ArchiveModalProps {
  onClose: () => void;
  onRestore: (id: string) => Promise<void>;
  fetchArchivedTasks: () => Promise<Task[]>;
}

export function ArchiveModal({ onClose, onRestore, fetchArchivedTasks }: ArchiveModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    fetchArchivedTasks()
      .then(setTasks)
      .catch(() => setError('Archiv konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [fetchArchivedTasks]);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleRestore = async (id: string) => {
    await onRestore(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e8eaf6' }}>Archiv</h2>
            <p style={{ fontSize: '0.8125rem', color: '#7c83a0', marginTop: 2 }}>Archivierte Aufgaben verwalten</p>
          </div>
          <button className="btn-icon" id="archive-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7c83a0', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="archive-search"
              className="form-input"
              type="text"
              placeholder="Aufgaben durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', color: '#7c83a0', padding: '2rem' }}>Laden...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#7c83a0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <p style={{ fontWeight: 600, color: '#e8eaf6', marginBottom: '0.25rem' }}>
                {search ? 'Keine Treffer' : 'Archiv ist leer'}
              </p>
              <p style={{ fontSize: '0.8125rem' }}>
                {search ? 'Versuchen Sie andere Suchbegriffe.' : 'Archivierte Aufgaben erscheinen hier.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c9ccdb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </span>
                      {task.critical && (
                        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '0px 6px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                          ⚡ Kritisch
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <LabelBadge label={task.label} small />
                      {task.archivedAt && (
                        <span style={{ fontSize: '0.7rem', color: '#7c83a0' }}>
                          Archiviert: {new Date(task.archivedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    id={`restore-${task.id}`}
                    onClick={() => handleRestore(task.id)}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', flexShrink: 0 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3" />
                    </svg>
                    Wiederherstellen
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '0.8125rem', color: '#7c83a0' }}>
            {tasks.length} Aufgabe{tasks.length !== 1 ? 'n' : ''} im Archiv
          </span>
        </div>
      </div>
    </div>
  );
}
