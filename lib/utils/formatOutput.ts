/**
 * Utility functions for clean, readable agent output formatting
 */

export interface CleanOutputOptions {
  maxItems?: number
  showDetails?: boolean
  compact?: boolean
}

/**
 * Format a list of items in a clean, readable way
 */
export function formatList(items: string[], options: CleanOutputOptions = {}): string {
  const { maxItems = 5, compact = false } = options
  
  if (!items || items.length === 0) {
    return '• None identified'
  }

  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems
  
  if (compact) {
    return displayItems.map(item => `• ${item}`).join('\n')
  }
  
  const formatted = displayItems.map((item, index) => `${index + 1}. ${item}`).join('\n')
  
  if (hasMore) {
    return `${formatted}\n• ... and ${items.length - maxItems} more`
  }
  
  return formatted
}

/**
 * Format recommendations with priority indicators
 */
export function formatRecommendations(recommendations: any[], options: CleanOutputOptions = {}): string {
  const { maxItems = 3, compact = true } = options
  
  if (!recommendations || recommendations.length === 0) {
    return '• No specific recommendations'
  }

  const displayItems = recommendations.slice(0, maxItems)
  const hasMore = recommendations.length > maxItems
  
  const formatted = displayItems.map((rec, index) => {
    const priority = rec.priority || 'Medium'
    const priorityIcon = priority === 'High' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢'
    const action = rec.action || 'No specific action provided'
    
    if (compact) {
      return `${priorityIcon} ${action}`
    }
    
    return `${index + 1}. ${priorityIcon} [${priority}] ${rec.category || 'General'}\n   ${action}`
  }).join('\n')
  
  if (hasMore) {
    return `${formatted}\n• ... and ${recommendations.length - maxItems} more recommendations`
  }
  
  return formatted
}

/**
 * Format risk assessment in a clean way
 */
export function formatRisks(risks: any[], options: CleanOutputOptions = {}): string {
  const { maxItems = 3, compact = true } = options
  
  if (!risks || risks.length === 0) {
    return '• No significant risks identified'
  }

  const displayItems = risks.slice(0, maxItems)
  const hasMore = risks.length > maxItems
  
  const formatted = displayItems.map((risk, index) => {
    const probability = risk.probability || 'Unknown'
    const impact = risk.impact || 'Unknown'
    const riskLevel = getRiskLevel(probability, impact)
    const riskIcon = riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢'
    const description = risk.risk || 'Unspecified risk'
    
    if (compact) {
      return `${riskIcon} ${description}`
    }
    
    return `${index + 1}. ${riskIcon} ${description}\n   ${probability} probability, ${impact} impact`
  }).join('\n')
  
  if (hasMore) {
    return `${formatted}\n• ... and ${risks.length - maxItems} more risks`
  }
  
  return formatted
}

/**
 * Get risk level based on probability and impact
 */
function getRiskLevel(probability: string, impact: string): string {
  if (probability === 'High' && impact === 'High') return 'High'
  if (probability === 'High' || impact === 'High') return 'Medium'
  return 'Low'
}

/**
 * Format a score with visual indicator
 */
export function formatScore(score: number, maxScore: number = 100): string {
  const percentage = Math.round((score / maxScore) * 100)
  const icon = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴'
  return `${icon} ${score}/${maxScore} (${percentage}%)`
}

/**
 * Format success probability with visual indicator
 */
export function formatSuccessProbability(percentage: number, confidence: string): string {
  const icon = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴'
  const confidenceIcon = confidence === 'High' ? '🟢' : confidence === 'Medium' ? '🟡' : '🔴'
  return `${icon} ${percentage}% (${confidenceIcon} ${confidence} confidence)`
}

/**
 * Create a clean section header
 */
export function createSectionHeader(title: string, icon?: string): string {
  const headerIcon = icon || '📋'
  return `\n${headerIcon} ${title.toUpperCase()}\n${'─'.repeat(title.length + 3)}`
}

/**
 * Format key metrics in a compact way
 */
export function formatMetrics(metrics: Record<string, any>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `• ${key}: ${value}`)
    .join('\n')
}

/**
 * Create a clean summary with key highlights
 */
export function createSummary(highlights: string[], maxItems: number = 3): string {
  if (!highlights || highlights.length === 0) {
    return '• Analysis completed successfully'
  }
  
  const displayItems = highlights.slice(0, maxItems)
  const hasMore = highlights.length > maxItems
  
  const formatted = displayItems.map((highlight, index) => `${index + 1}. ${highlight}`).join('\n')
  
  if (hasMore) {
    return `${formatted}\n• ... and ${highlights.length - maxItems} more insights`
  }
  
  return formatted
}
