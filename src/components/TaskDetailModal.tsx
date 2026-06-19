import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Attachment, TaskLabel } from '../types';
import { TASK_LABELS } from '../types';
import { LabelBadge } from './LabelBadge';
import { ProgressBar } from './ProgressBar';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const ALLOWED_TYPES_LABEL = 'PNG, JPG oder PDF';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskDetailModal({ task, onClose, onUpdate, onArchive, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [label, setLabel] = useState<TaskLabel>(task.label);
  const [critical, setCritical] = useState(task.critical);
  const [progress, setProgress] = useState(task.progress);
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    label !== task.label ||
    critical !== task.critical ||
    progress !== task.progress ||
    attachments !== task.attachments;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const validateAndAddFiles = useCallback((files: FileList | File[]) => {
    setFileError(null);
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" hat einen nicht unterstützten Dateityp. Erlaubt: ${ALLOWED_TYPES_LABEL}.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" überschreitet die maximale Dateigrösse von 10 MB.`);
        return;
      }
    }
    const newAttachments: Attachment[] = fileArray.map((file) => ({
      id: uuidv4(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      blob: file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        label,
        critical,
        progress,
        attachments,
      });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    await onArchive(task.id);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await onDelete(task.id);
    onClose();
  };

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileIcon(type: string): string {
    if (type === 'application/pdf') return '📄';
    return '🖼️';
  }

  const downloadAttachment = (att: Attachment) => {
    const url = URL.createObjectURL(att.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        {/* Critical accent */}
        {task.critical && (
          <div style={{ height: 3, background: 'linear-gradient(90deg, #ef4444, #f97316)', borderRadius: '16px 16px 0 0', flexShrink: 0 }} />
        )}

        {/* Header */}
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e8eaf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title}
              </h2>
              {task.critical && (
                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                  ⚡ Kritisch
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#7c83a0', marginTop: 2 }}>
              Erstellt am {new Date(task.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1.5rem', flexShrink: 0 }}>
          {(['details', 'attachments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.625rem 0.5rem',
                marginRight: '1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#4f6ef7' : '#7c83a0',
                borderBottom: activeTab === tab ? '2px solid #4f6ef7' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab === 'details' ? 'Details' : `Anhänge (${attachments.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === 'details' && (
            <>
              <div>
                <label className="form-label">Titel <span style={{ color: '#ef4444' }}>*</span></label>
                <input id="detail-title" className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Beschreibung</label>
                <textarea id="detail-description" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detaillierte Beschreibung..." />
              </div>
              <div>
                <label className="form-label">Label</label>
                <select id="detail-label" className="form-input" value={label} onChange={(e) => setLabel(e.target.value as TaskLabel)} style={{ cursor: 'pointer' }}>
                  {TASK_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <div style={{ marginTop: '0.5rem' }}><LabelBadge label={label} /></div>
              </div>
              <div>
                <label
                  htmlFor="detail-critical"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
                    borderRadius: 10, border: `1px solid ${critical ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: critical ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <input id="detail-critical" type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: critical ? '#f87171' : '#e8eaf6' }}>⚡ Als kritisch markieren</div>
                    {critical && <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: 2 }}>Hervorgehoben als dringende Aufgabe</div>}
                  </div>
                </label>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Fortschritt</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f6ef7' }}>{progress}%</span>
                </div>
                <input id="detail-progress" type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: '100%', accentColor: '#4f6ef7', cursor: 'pointer', height: 6 }} />
                <div style={{ marginTop: '0.5rem' }}>
                  <ProgressBar progress={progress} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: '#7c83a0' }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'attachments' && (
            <>
              <div
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); validateAndAddFiles(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#4f6ef7' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10, padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                  background: isDragging ? 'rgba(79,110,247,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>📎</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e8eaf6', marginBottom: '0.25rem' }}>Dateien hinzufügen</div>
                <div style={{ fontSize: '0.75rem', color: '#7c83a0' }}>{ALLOWED_TYPES_LABEL} • Max. 10MB</div>
                <input ref={fileInputRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf" style={{ display: 'none' }} onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)} />
              </div>

              {fileError && (
                <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.8125rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span>⚠️</span>{fileError}
                </div>
              )}

              {attachments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#7c83a0', padding: '1.5rem', fontSize: '0.875rem' }}>Keine Anhänge vorhanden</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {attachments.map((att) => (
                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{fileIcon(att.fileType)}</span>
                      <span style={{ flex: 1, fontSize: '0.8125rem', color: '#e8eaf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</span>
                      <span style={{ fontSize: '0.75rem', color: '#7c83a0', flexShrink: 0 }}>{formatBytes(att.fileSize)}</span>
                      <button className="btn-icon" title="Herunterladen" onClick={() => downloadAttachment(att)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id="detail-archive"
              className="btn-secondary"
              onClick={handleArchive}
              title="Archivieren"
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archivieren
            </button>
            <button
              id="detail-delete"
              onClick={handleDelete}
              style={{
                background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: '#f87171',
                border: `1px solid ${confirmDelete ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)'}`,
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              {confirmDelete ? 'Bestätigen' : 'Löschen'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" id="detail-cancel" onClick={onClose}>Abbrechen</button>
            <button id="detail-save" className="btn-primary" onClick={handleSave} disabled={!title.trim() || saving || !isDirty}>
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
