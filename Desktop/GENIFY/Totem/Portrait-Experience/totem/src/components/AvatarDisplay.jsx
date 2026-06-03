// Cuando tengas el archivo .riv listo, descomenta la sección Rive y
// coloca el archivo en public/avatar.riv. El placeholder CSS se reemplaza solo.

// import { useRive, useStateMachineInput } from '@rive-app/react-canvas'

const STATE_COLORS = {
  idle:        { ring: '#c8a96e44', core: '#c8a96e' },
  greeting:    { ring: '#4ade8066', core: '#4ade80' },
  talking:     { ring: '#60a5fa66', core: '#60a5fa' },
  directing:   { ring: '#a78bfa66', core: '#a78bfa' },
  celebrating: { ring: '#f59e0b66', core: '#f59e0b' },
  processing:  { ring: '#c8a96e33', core: '#888888' },
}

const STATE_LABELS = {
  idle:        'Esperando...',
  greeting:    'Saludando',
  talking:     'Hablando',
  directing:   'Dirigiendo',
  celebrating: '¡Celebrando!',
  processing:  'Procesando...',
}

export default function AvatarDisplay({ state = 'idle', emotion = 'neutral', size = 320 }) {
  const colors = STATE_COLORS[state] || STATE_COLORS.idle
  const isTalking = state === 'talking' || state === 'greeting' || state === 'directing'
  const isAnimated = state !== 'idle' && state !== 'processing'

  /* ── Rive (descomentar cuando tengas avatar.riv) ──────────────────
  const { RiveComponent, rive } = useRive({
    src: '/avatar.riv',
    stateMachines: 'AvatarSM',
    autoplay: true,
  })
  const avatarState = useStateMachineInput(rive, 'AvatarSM', 'state')
  const emotionInput = useStateMachineInput(rive, 'AvatarSM', 'emotion')

  useEffect(() => {
    if (avatarState) avatarState.value = state
    if (emotionInput) emotionInput.value = emotion
  }, [state, emotion])

  return (
    <div style={{ width: size, height: size }}>
      <RiveComponent />
    </div>
  )
  ── fin Rive ──────────────────────────────────────────────────── */

  // Placeholder CSS hasta tener el .riv
  return (
    <div style={{ ...styles.root, width: size, height: size }}>
      {/* Anillos de fondo */}
      <div style={{ ...styles.ring, ...styles.ring3, borderColor: colors.ring }} />
      <div style={{
        ...styles.ring, ...styles.ring2,
        borderColor: colors.ring,
        animation: isAnimated ? 'ringExpand 2s ease-out infinite' : 'none',
      }} />
      <div style={{
        ...styles.ring, ...styles.ring1,
        borderColor: colors.ring,
        animation: isAnimated ? 'ringExpand 2s ease-out 1s infinite' : 'none',
      }} />

      {/* Cuerpo del avatar */}
      <div style={{ ...styles.body, boxShadow: `0 0 40px ${colors.ring}` }}>
        {/* Cabeza */}
        <div style={styles.head}>
          {/* Ojos */}
          <div style={styles.eyes}>
            <div style={{ ...styles.eye, background: colors.core }} />
            <div style={{ ...styles.eye, background: colors.core }} />
          </div>
          {/* Boca — anima cuando habla */}
          <div style={{
            ...styles.mouth,
            height: isTalking ? '10px' : '4px',
            background: colors.core,
            animation: isTalking ? 'talkAnim 0.25s ease-in-out infinite alternate' : 'none',
          }} />
        </div>

        {/* Icono de estado */}
        <div style={{ ...styles.stateIcon, color: colors.core }}>
          {STATE_ICONS[state]}
        </div>
      </div>

      {/* Label de estado */}
      <p style={{ ...styles.label, color: colors.core }}>
        {STATE_LABELS[state]}
      </p>
    </div>
  )
}

const STATE_ICONS = {
  idle:        '◉',
  greeting:    '✦',
  talking:     '♪',
  directing:   '⟶',
  celebrating: '★',
  processing:  '◌',
}

const styles = {
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  ring: {
    position: 'absolute',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '1px',
    pointerEvents: 'none',
  },
  ring3: { width: '85%', height: '85%', opacity: 0.3 },
  ring2: { width: '75%', height: '75%', opacity: 0.5 },
  ring1: { width: '65%', height: '65%', opacity: 0.7 },
  body: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #2a2a2a, #111)',
    border: '2px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    position: 'relative',
    zIndex: 1,
    transition: 'box-shadow 0.4s ease',
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  eyes: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  eye: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    transition: 'background 0.3s ease',
  },
  mouth: {
    width: '32px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  stateIcon: {
    fontSize: '20px',
    transition: 'color 0.3s ease',
  },
  label: {
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    opacity: 0.7,
    transition: 'color 0.3s ease',
  },
}
