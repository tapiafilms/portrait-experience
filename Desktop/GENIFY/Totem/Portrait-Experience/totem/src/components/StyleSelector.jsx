const STYLES = [
  { id: 'forbes',    label: 'Forbes',     desc: 'Retrato ejecutivo premium',         icon: '◈' },
  { id: 'hollywood', label: 'Hollywood',  desc: 'Glamour cinematográfico dramático',  icon: '✦' },
  { id: 'vogue',     label: 'Vogue',      desc: 'Alta moda editorial sofisticada',   icon: '◆' },
  { id: 'cyberpunk', label: 'Cyberpunk',  desc: 'Futurista neón distópico urbano',   icon: '⬡' },
  { id: 'spaceceo',  label: 'Space CEO',  desc: 'Astronauta ejecutivo del futuro',   icon: '○' },
  { id: 'noir',      label: 'Noir',       desc: 'Blanco y negro misterioso',         icon: '◐' },
]

export default function StyleSelector({ selected, onSelect, onConfirm }) {
  return (
    <div style={styles.root}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.title}>Elige tu estilo</h2>
          <p style={styles.sub}>El avatar transformará tu foto en esta estética</p>
        </div>

        <div style={styles.grid}>
          {STYLES.map(s => (
            <button
              key={s.id}
              style={{
                ...styles.card,
                ...(selected === s.id ? styles.cardActive : {}),
              }}
              onPointerDown={() => onSelect(s.id)}
            >
              <span style={{
                ...styles.cardIcon,
                color: selected === s.id ? '#c8a96e' : 'rgba(255,255,255,0.3)',
              }}>
                {s.icon}
              </span>
              <span style={styles.cardLabel}>{s.label}</span>
              <span style={styles.cardDesc}>{s.desc}</span>
            </button>
          ))}
        </div>

        <button
          style={{
            ...styles.confirmBtn,
            opacity: selected ? 1 : 0.4,
          }}
          onPointerDown={selected ? onConfirm : undefined}
        >
          Transformar con IA →
        </button>
      </div>
    </div>
  )
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.96)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    animation: 'fadeIn 0.3s ease',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '36px',
    width: '100%',
    maxWidth: '800px',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#fff',
  },
  sub: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '1px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    width: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px 16px',
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
  cardActive: {
    background: 'rgba(200,169,110,0.1)',
    border: '1px solid rgba(200,169,110,0.6)',
    boxShadow: '0 0 20px rgba(200,169,110,0.15)',
  },
  cardIcon: {
    fontSize: '28px',
    transition: 'color 0.2s',
  },
  cardLabel: {
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '2px',
    color: '#fff',
  },
  cardDesc: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  confirmBtn: {
    background: '#c8a96e',
    color: '#000',
    border: 'none',
    padding: '18px 64px',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '2px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
}
