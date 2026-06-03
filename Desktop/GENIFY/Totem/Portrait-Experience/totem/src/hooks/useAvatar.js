import { useState, useCallback } from 'react'

// Estados del avatar — mapean directo a animaciones Rive cuando estén disponibles
// idle | greeting | talking | directing | celebrating | processing
export function useAvatar() {
  const [state, setState] = useState('idle')
  const [emotion, setEmotion] = useState('neutral') // neutral | happy | excited | calm

  const setAvatarState = useCallback((newState, newEmotion = null) => {
    setState(newState)
    if (newEmotion) setEmotion(newEmotion)
  }, [])

  const greet = useCallback(() => setAvatarState('greeting', 'happy'), [setAvatarState])
  const talk = useCallback(() => setAvatarState('talking', 'neutral'), [setAvatarState])
  const direct = useCallback(() => setAvatarState('directing', 'calm'), [setAvatarState])
  const celebrate = useCallback(() => setAvatarState('celebrating', 'excited'), [setAvatarState])
  const process = useCallback(() => setAvatarState('processing', 'calm'), [setAvatarState])
  const idle = useCallback(() => setAvatarState('idle', 'neutral'), [setAvatarState])

  return { state, emotion, greet, talk, direct, celebrate, process, idle }
}
