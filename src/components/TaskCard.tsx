import type { Task } from '../types';
import { LabelBadge } from './LabelBadge';
import { ProgressBar } from './ProgressBar';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onArchive: () => void;
}

export function TaskCard({ task, onClick, onArchive }: TaskCardProps) {
  return (
    <div
      className="glass-card"
      style={{ padding: '1rem 1.25rem', cursor: 'pointer', position: 'relative' }}
      onClick={onClick}
    >
      {/* Critical ribbon */}
      {task.critical && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #ef4444, #f97316)',
            borderRadius: '12px 12px 0 0',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', paddingTop: task.critical ? '4px' : 0 }}>
        {/* Progress ring */}
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={task.progress === 100 ? '#22c55e' : '#4f6ef7'}
              strokeWidth="3"
              strokeDasharray={`${(task.progress / 100) * 100.5} 100.5`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill={task.progress === 100 ? '#22c55e' : '#e8eaf6'}
              fontSize="9"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {task.progress}%
            </text>
          </svg>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: '#e8eaf6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.title}
            </span>
            {task.critical && (
              <span
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  padding: '1px 8px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  animation: 'pulse-glow 2s infinite',
                  flexShrink: 0,
                }}
              >
                ⚡ Kritisch
              </span>
            )}
          </div>

          <div style={{ marginBottom: '0.625rem' }}>
            <LabelBadge label={task.label} small />
          </div>

          {task.description && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#7c83a0',
                marginBottom: '0.625rem',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
              }}
            >
              {task.description}
            </p>
          )}

          <div style={{ marginBottom: '0.625rem' }}>
            <ProgressBar progress={task.progress} showLabel />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#7c83a0' }}>
              {task.attachments.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  {task.attachments.length} Anhang{task.attachments.length !== 1 ? 'hänge' : ''}
                </span>
              )}
              <span>{new Date(task.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Archive button */}
        <button
          className="btn-icon"
          title="Archivieren"
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          style={{ flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
