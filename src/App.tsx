import { useState, useEffect, useCallback } from 'react';
import type { Task } from './types';
import type { NewTaskInput } from './types';
import {
  getAllActiveTasks,
  getAllArchivedTasks,
  createTask,
  updateTask,
  archiveTask,
  restoreTask,
  deleteTask,
  exportBackup,
  importBackup,
} from './db/taskRepository';
import { TaskCard } from './components/TaskCard';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ArchiveModal } from './components/ArchiveModal';

type ModalState =
  | { type: 'none' }
  | { type: 'new' }
  | { type: 'detail'; task: Task }
  | { type: 'archive' };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTasks = useCallback(async () => {
    try {
      const active = await getAllActiveTasks();
      setTasks(active);
      setLoadError(null);
    } catch {
      setLoadError('Aufgaben konnten nicht geladen werden. Bitte Seite neu laden.');
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreate = async (input: NewTaskInput) => {
    await createTask(input);
    await loadTasks();
    showToast('Aufgabe erfolgreich erstellt!');
  };

  const handleUpdate = async (id: string, changes: Partial<Task>) => {
    await updateTask(id, changes);
    await loadTasks();
    showToast('Aufgabe gespeichert!');
  };

  const handleArchive = async (id: string) => {
    await archiveTask(id);
    await loadTasks();
    showToast('Aufgabe archiviert.');
    setModal({ type: 'none' });
  };

  const handleRestore = async (id: string) => {
    await restoreTask(id);
    await loadTasks();
    showToast('Aufgabe wiederhergestellt!');
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    await loadTasks();
    showToast('Aufgabe gelöscht.', 'error');
  };

  const handleExportBackup = async () => {
    try {
      await exportBackup();
      showToast('Backup erfolgreich exportiert!');
    } catch {
      showToast('Backup-Export fehlgeschlagen.', 'error');
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImportLoading(true);
      try {
        const { imported, skipped } = await importBackup(file);
        await loadTasks();
        showToast(`Import abgeschlossen: ${imported} importiert, ${skipped} übersprungen.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Import fehlgeschlagen.', 'error');
      } finally {
        setImportLoading(false);
      }
    };
    input.click();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <header style={{ padding: '2rem 0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #4f6ef7, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(79,110,247,0.35)',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e8eaf6', letterSpacing: '-0.01em' }}>Aufgabenverwaltung</h1>
              <p style={{ fontSize: '0.8125rem', color: '#7c83a0' }}>Behalten Sie den Überblick über Ihre Projekte</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              id="import-backup-btn"
              className="btn-secondary"
              onClick={handleImportBackup}
              disabled={importLoading}
              title="Backup importieren"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {importLoading ? 'Importieren...' : 'Import'}
            </button>
            <button
              id="export-backup-btn"
              className="btn-secondary"
              onClick={handleExportBackup}
              title="Backup exportieren"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              id="open-archive-btn"
              className="btn-secondary"
              onClick={() => setModal({ type: 'archive' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archiv
            </button>
            <button
              id="new-task-btn"
              className="btn-primary"
              onClick={() => setModal({ type: 'new' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Neue Aufgabe
            </button>
          </div>
        </header>

        {/* Stats bar */}
        {tasks.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Gesamt', value: tasks.length, color: '#4f6ef7' },
              { label: 'Kritisch', value: tasks.filter((t) => t.critical).length, color: '#ef4444' },
              { label: 'Abgeschlossen', value: tasks.filter((t) => t.progress === 100).length, color: '#22c55e' },
              { label: 'In Bearbeitung', value: tasks.filter((t) => t.progress > 0 && t.progress < 100).length, color: '#f59e0b' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: '0.75rem', color: '#7c83a0' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '1rem', color: '#f87171', marginBottom: '1.5rem' }}>
            {loadError}
          </div>
        )}

        {/* Task list or empty state */}
        {tasks.length === 0 && !loadError ? (
          <div
            style={{
              textAlign: 'center', padding: '5rem 2rem',
              background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4f6ef7" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8eaf6', marginBottom: '0.5rem' }}>Keine Aufgaben vorhanden</h2>
            <p style={{ fontSize: '0.875rem', color: '#7c83a0', marginBottom: '1.75rem' }}>
              Erstellen Sie Ihre erste Aufgabe, um loszulegen
            </p>
            <button
              id="first-task-btn"
              className="btn-primary"
              onClick={() => setModal({ type: 'new' })}
              style={{ fontSize: '0.9375rem', padding: '0.625rem 1.5rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Erste Aufgabe erstellen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '2rem' }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setModal({ type: 'detail', task })}
                onArchive={() => handleArchive(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.type === 'new' && (
        <NewTaskModal onClose={() => setModal({ type: 'none' })} onCreate={handleCreate} />
      )}
      {modal.type === 'detail' && (
        <TaskDetailModal
          task={modal.task}
          onClose={() => setModal({ type: 'none' })}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}
      {modal.type === 'archive' && (
        <ArchiveModal
          onClose={() => setModal({ type: 'none' })}
          onRestore={handleRestore}
          fetchArchivedTasks={getAllArchivedTasks}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 100,
            background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
            color: toast.type === 'error' ? '#f87171' : '#4ade80',
            padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 380,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            animation: 'slideUp 0.25s ease',
          }}
        >
          {toast.type === 'error' ? '❌' : '✅'} {toast.message}
        </div>
      )}

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </div>
  );
}
