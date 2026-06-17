export type AiModelKey = 'flash' | 'thinking'

interface AiModel {
  key: AiModelKey
  label: string
  description: string
}

export const AI_MODELS: AiModel[] = [
  {
    key: 'flash',
    label: 'Quick',
    description: 'Faster answers, good for most questions',
  },
  {
    key: 'thinking',
    label: 'Deep',
    description: 'Slower but more thorough answers',
  },
]

export const DEFAULT_MODEL_KEY: AiModelKey = 'flash'

export function resolveModelId(key: AiModelKey): string {
  if (key === 'flash') return 'llama3.1:8b'
  return process.env.OLLAMA_MODEL ?? 'gemma4:26b'
}
