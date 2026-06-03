import { useCallback, useRef } from 'react'
import { speak, cancelSpeech } from '../services/voice'

export function useVoice() {
  const speakingRef = useRef(false)

  const say = useCallback(async (text, options = {}) => {
    if (!text) return
    speakingRef.current = true
    try {
      await speak(text, options)
    } catch (err) {
      console.warn('Voice error:', err.message)
    } finally {
      speakingRef.current = false
    }
  }, [])

  const stop = useCallback(() => {
    cancelSpeech()
    speakingRef.current = false
  }, [])

  return { say, stop, isSpeaking: () => speakingRef.current }
}
