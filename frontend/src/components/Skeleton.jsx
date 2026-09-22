export function Skeleton({ height = 16, width = '100%', style = {} }) {
  return <div style={{ height, width, background: 'linear-gradient(90deg, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', borderRadius: 12, backdropFilter: 'blur(8px)', ...style }} />;
}

export function CardSkeleton() {
  return (
    <div className="liquid-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height={18} width="40%" />
      <Skeleton height={14} width="90%" />
      <Skeleton height={14} width="70%" />
    </div>
  );
}
