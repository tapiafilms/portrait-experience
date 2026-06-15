import { useEffect } from 'react'
import { useRive, useStateMachineInput } from '@rive-app/react-canvas'

// Estados del fotógrafo → valor numérico para Rive
// 0 = idle      (nadie frente al tótem)
// 1 = talking   (saludando, dando instrucciones)
// 2 = waiting   (esperando respuesta del usuario)
// 3 = capture   (encuadre activo, a punto de tomar la foto)
const RIVE_STATE = {
  idle:      0,
  greeting:  1,
  talking:   1,
  listening: 2,
  thinking:  2,
  countdown: 3,
}

const STATE_COLORS = {
  idle:    { ring: '#c8a96e44', core: '#c8a96e' },
  talking: { ring: '#60a5fa66', core: '#60a5fa' },
  waiting: { ring: '#a78bfa66', core: '#a78bfa' },
  capture: { ring: '#4ade8066', core: '#4ade80' },
}

const STATE_LABELS = {
  idle:      'Esperando...',
  greeting:  'Hablando',
  talking:   'Hablando',
  listening: 'Escuchando...',
  thinking:  'Pensando...',
  countdown: 'Preparando...',
}

export default function AvatarDisplay({ state = 'idle', size = 320 }) {
  const riveValue = RIVE_STATE[state] ?? 0
  const colorKey = riveValue === 0 ? 'idle' : riveValue === 1 ? 'talking' : riveValue === 2 ? 'waiting' : 'capture'
  const colors = STATE_COLORS[colorKey]
  const isTalking = riveValue === 1
  const isAnimated = riveValue !== 0

  const { RiveComponent, rive } = useRive({
    src: '/avatar.riv',
    stateMachines: 'AvatarSM',
    autoplay: true,
  })
  const stateInput = useStateMachineInput(rive, 'AvatarSM', 'state')

  useEffect(() => {
    console.log('[AvatarDisplay] riveValue:', riveValue, '| state:', state)
    if (stateInput) stateInput.value = riveValue
  }, [riveValue, state])

  return (
    <div style={{ width: size, height: size }}>
      <RiveComponent />
    </div>
  )

}

// Referencia de estados Rive:
// 0 = idle    → nadie frente al tótem
// 1 = talking → saludando / dando instrucciones
// 2 = waiting → esperando respuesta del usuario
// 3 = capture → encuadre activo, a punto de tomar la foto
