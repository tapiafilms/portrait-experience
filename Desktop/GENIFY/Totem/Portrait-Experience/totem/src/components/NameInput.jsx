import { useState, useCallback } from 'react'

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

export default function NameInput({ onConfirm, onSkip }) {
  const [name, setName] = useState('')

  const press = useCallback((char) => {
    setName(n => n.length < 24 ? n + char : n)
  }, [])

  const del = useCallback(() => {
    setName(n => n.slice(0, -1))
  }, [])

  const confirm = useCallback(() => {
    const trimmed = name.trim()
    onConfirm(trimmed || null)
  }, [name, onConfirm])

  return (
    <div style={styles.root}>
      <div style={styles.content}>
        {/* Instrucción */}
        <div style={styles.header}>
          <h2 style={styles.title}>¿Cuál es tu nombre?</h2>
          <p style={styles.sub}>El avatar te saludará personalmente</p>
        </div>

        {/* Display del nombre */}
        <div style={styles.display}>
          <span style={styles.displayText}>
            {name || <span style={styles.placeholder}>Escribe tu nombre...</span>}
          </span>
          <span style={styles.cursor}>|</span>
        </div>

        {/* Teclado */}
        <div style={styles.keyboard}>
          {ROWS.map((row, ri) => (
            <div key={ri} style={styles.row}>
              {row.map(char => (
                <button
                  key={char}
                  style={styles.key}
                  onPointerDown={() => press(char)}
                >
                  {char}
                </button>
              ))}
              {ri === 2 && (
                <button style={{ ...styles.key, ...styles.keyDel }} onPointerDown={del}>
                  ⌫
                </button>
              )}
            </div>
          ))}

          {/* Fila inferior */}
          <div style={styles.row}>
            <button style={{ ...styles.key, ...styles.keySpace }} onPointerDown={() => press(' ')}>
              ESPACIO
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div style={styles.actions}>
          <button style={styles.skipBtn} onPointerDown={onSkip}>
            Continuar sin nombre
          </button>
          <button
            style={{
              ...styles.confirmBtn,
              opacity: name.trim() ? 1 : 0.5,
            }}
            onPointerDown={confirm}
          >
            Confirmar →
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.95)',
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
    gap: '32px',
    width: '100%',
    maxWidth: '700px',
    padding: '40px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'center',
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
  display: {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid rgba(200,169,110,0.4)',
    borderRadius: '8px',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minHeight: '72px',
  },
  displayText: {
    fontSize: '32px',
    color: '#fff',
    fontWeight: 500,
    letterSpacing: '2px',
    flex: 1,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.2)',
    fontWeight: 300,
    fontSize: '24px',
  },
  cursor: {
    fontSize: '32px',
    color: '#c8a96e',
    animation: 'pulse 1s ease-in-out infinite',
  },
  keyboard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  row: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  key: {
    width: '58px',
    height: '58px',
    background: '#1e1e1e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.1s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
  },
  keyDel: {
    width: '80px',
    background: '#2a1a1a',
    color: '#f87171',
  },
  keySpace: {
    width: '340px',
    height: '52px',
    fontSize: '13px',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.5)',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  skipBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.35)',
    border: 'none',
    fontSize: '14px',
    letterSpacing: '1px',
    cursor: 'pointer',
    padding: '12px 20px',
  },
  confirmBtn: {
    background: '#c8a96e',
    color: '#000',
    border: 'none',
    padding: '16px 48px',
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '2px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
}
