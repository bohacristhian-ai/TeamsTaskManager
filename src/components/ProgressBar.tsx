interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress, showLabel = false }: ProgressBarProps) {
  const color =
    progress === 100
      ? '#22c55e'
      : progress >= 60
      ? '#4f6ef7'
      : progress >= 30
      ? '#f59e0b'
      : '#7c83a0';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.4s ease',
            boxShadow: progress > 0 ? `0 0 8px ${color}80` : 'none',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '2.5rem', textAlign: 'right' }}>
          {progress}%
        </span>
      )}
    </div>
  );
}
