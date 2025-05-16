/**
 * Resamples audio data to a target sample rate
 * @param audioBuffer The original audio buffer
 * @param originalSampleRate The original sample rate
 * @param targetSampleRate The target sample rate
 * @returns Resampled audio data
 */
export function resampleAudio(
  audioBuffer: Float32Array,
  originalSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (originalSampleRate === targetSampleRate) {
    return audioBuffer
  }

  const ratio = originalSampleRate / targetSampleRate
  const newLength = Math.round(audioBuffer.length / ratio)
  const result = new Float32Array(newLength)

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const fraction = position - index

    if (index + 1 < audioBuffer.length) {
      // Linear interpolation
      result[i] = audioBuffer[index] * (1 - fraction) + audioBuffer[index + 1] * fraction
    } else {
      result[i] = audioBuffer[index]
    }
  }

  return result
}

/**
 * Converts Float32Array audio data to Int16Array (16-bit PCM)
 * @param floatData Float32Array audio data (-1.0 to 1.0)
 * @returns Int16Array audio data (-32768 to 32767)
 */
export function floatTo16BitPCM(floatData: Float32Array): Int16Array {
  const pcmData = new Int16Array(floatData.length)
  for (let i = 0; i < floatData.length; i++) {
    const s = Math.max(-1, Math.min(1, floatData[i]))
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return pcmData
}

/**
 * Downmixes stereo audio to mono
 * @param stereoData Stereo audio data (interleaved)
 * @returns Mono audio data
 */
export function stereoToMono(stereoData: Float32Array): Float32Array {
  const monoData = new Float32Array(stereoData.length / 2)
  for (let i = 0; i < monoData.length; i++) {
    monoData[i] = (stereoData[i * 2] + stereoData[i * 2 + 1]) / 2
  }
  return monoData
}
