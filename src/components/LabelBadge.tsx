import type { TaskLabel } from '../types';

const LABEL_STYLES: Record<TaskLabel, { bg: string; text: string; dot: string }> = {
  'PM/KD/TVID - Allgemein (Spezteam-Meeting)': {
    bg: 'rgba(168, 85, 247, 0.15)',
    text: '#c084fc',
    dot: '#a855f7',
  },
  'PM - Allgemein (Montags-Meeting)': {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#60a5fa',
    dot: '#3b82f6',
  },
  'PM - Product Management (PM-Meeting)': {
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#4ade80',
    dot: '#22c55e',
  },
  'Sonstiges': {
    bg: 'rgba(251, 191, 36, 0.15)',
    text: '#fbbf24',
    dot: '#f59e0b',
  },
};

interface LabelBadgeProps {
  label: TaskLabel;
  small?: boolean;
}

export function LabelBadge({ label, small = false }: LabelBadgeProps) {
  const style = LABEL_STYLES[label];
  return (
    <span
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.dot}40`,
        padding: small ? '2px 8px' : '3px 10px',
        borderRadius: '999px',
        fontSize: small ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </span>
  );
}
