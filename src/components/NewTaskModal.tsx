import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { NewTaskInput, Attachment, TaskLabel } from '../types';
import { TASK_LABELS } from '../types';
import { LabelBadge } from './LabelBadge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const ALLOWED_TYPES_LABEL = 'PNG, JPG oder PDF';

interface NewTaskModalProps {
  onClose: () => void;
  onCreate: (input: NewTaskInput) => Promise<void>;
}

export function NewTaskModal({ onClose, onCreate }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState<TaskLabel>(TASK_LABELS[0]);
  const [critical, setCritical] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndAddFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim() || undefined, label, critical, progress, attachments });
      onClose();
    } catch {
      setSaving(false);
    }
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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e8eaf6' }}>Neue Aufgabe</h2>
            <p style={{ fontSize: '0.8125rem', color: '#7c83a0', marginTop: 2 }}>Erstellen Sie eine neue Aufgabe</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Title */}
          <div>
            <label className="form-label">
              Titel <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="new-task-title"
              className="form-input"
              type="text"
              placeholder="Aufgabentitel eingeben..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Beschreibung</label>
            <textarea
              id="new-task-description"
              className="form-input"
              placeholder="Detaillierte Beschreibung der Aufgabe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Label */}
          <div>
            <label className="form-label">Label</label>
            <select
              id="new-task-label"
              className="form-input"
              value={label}
              onChange={(e) => setLabel(e.target.value as TaskLabel)}
              style={{ cursor: 'pointer' }}
            >
              {TASK_LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div style={{ marginTop: '0.5rem' }}>
              <LabelBadge label={label} />
            </div>
          </div>

          {/* Critical */}
          <div>
            <label
              htmlFor="new-task-critical"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 10,
                border: `1px solid ${critical ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: critical ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                id="new-task-critical"
                type="checkbox"
                checked={critical}
                onChange={(e) => setCritical(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: critical ? '#f87171' : '#e8eaf6' }}>
                  ⚡ Als kritisch markieren
                </div>
                {critical && (
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: 2 }}>
                    Diese Aufgabe wird mit einem Dringlichkeitshinweis hervorgehoben
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Progress slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Fortschritt</label>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f6ef7' }}>{progress}%</span>
            </div>
            <input
              id="new-task-progress"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#4f6ef7',
                cursor: 'pointer',
                height: 6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: '#7c83a0' }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* File attachments */}
          <div>
            <label className="form-label">
              Dateianhänge ({attachments.length})
            </label>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#4f6ef7' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10,
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'rgba(79,110,247,0.06)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8eaf6', marginBottom: '0.25rem' }}>
                Dateien hier ablegen oder klicken
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7c83a0' }}>
                {ALLOWED_TYPES_LABEL} • Mehrere Dateien möglich • Max. 10MB pro Datei
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
              />
            </div>

            {/* Error message */}
            {fileError && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#f87171',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <span style={{ flexShrink: 0 }}>⚠️</span>
                {fileError}
              </div>
            )}

            {/* Attachment list */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{fileIcon(att.fileType)}</span>
                    <span style={{ flex: 1, fontSize: '0.8125rem', color: '#e8eaf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.fileName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#7c83a0', flexShrink: 0 }}>{formatBytes(att.fileSize)}</span>
                    <button
                      className="btn-icon"
                      onClick={(e) => { e.stopPropagation(); setAttachments((p) => p.filter((a) => a.id !== att.id)); }}
                      style={{ color: '#ef4444' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" id="new-task-cancel" onClick={onClose}>Abbrechen</button>
          <button
            id="new-task-submit"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!title.trim() || saving}
          >
            {saving ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            {saving ? 'Erstellen...' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
