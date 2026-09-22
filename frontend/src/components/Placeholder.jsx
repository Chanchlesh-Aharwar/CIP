export default function Placeholder({ title, description }) {
  return (
    <div style={{ padding: '2rem', border: '1px dashed #ccc', borderRadius: 8, textAlign: 'center' }}>
      <h2>{title}</h2>
      {description && <p style={{ color: '#666' }}>{description}</p>}
    </div>
  );
}
