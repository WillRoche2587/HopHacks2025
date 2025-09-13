/**
 * Utility functions for word counting and text validation
 */

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0
  
  // Remove markdown formatting and count actual words
  const cleanText = text
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
    .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link formatting, keep text
    .replace(/^\s*[-*+]\s/gm, '') // Remove bullet points
    .replace(/^\s*\d+\.\s/gm, '') // Remove numbered lists
    .replace(/>\s/g, '') // Remove blockquote markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()
  
  // Split by whitespace and filter out empty strings
  const words = cleanText.split(/\s+/).filter(word => word.length > 0)
  return words.length
}

/**
 * Validate that text is under the specified word limit
 */
export function validateWordLimit(text: string, maxWords: number = 250): {
  isValid: boolean
  wordCount: number
  maxWords: number
  message?: string
} {
  const wordCount = countWords(text)
  const isValid = wordCount <= maxWords
  
  return {
    isValid,
    wordCount,
    maxWords,
    message: isValid 
      ? undefined 
      : `Text exceeds word limit: ${wordCount}/${maxWords} words`
  }
}

/**
 * Truncate text to fit within word limit while preserving markdown structure
 */
export function truncateToWordLimit(text: string, maxWords: number = 250): string {
  const validation = validateWordLimit(text, maxWords)
  
  if (validation.isValid) {
    return text
  }
  
  // If text is too long, try to truncate intelligently
  const words = text.split(/\s+/)
  const truncatedWords = words.slice(0, maxWords)
  
  // Try to end at a sentence boundary
  let truncated = truncatedWords.join(' ')
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  )
  
  if (lastSentenceEnd > truncated.length * 0.8) {
    truncated = truncated.substring(0, lastSentenceEnd + 1)
  }
  
  return truncated + (truncated.length < text.length ? '...' : '')
}

/**
 * Format word count information for display
 */
export function formatWordCount(text: string, maxWords: number = 250): string {
  const wordCount = countWords(text)
  const percentage = Math.round((wordCount / maxWords) * 100)
  
  if (wordCount <= maxWords) {
    return `${wordCount}/${maxWords} words (${percentage}%)`
  } else {
    return `${wordCount}/${maxWords} words (${percentage}% - OVER LIMIT)`
  }
}
