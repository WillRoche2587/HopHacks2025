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
    return 'None identified'
  }

  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems
  
  if (compact) {
    return displayItems.join('\n')
  }
  
  const formatted = displayItems.map((item, index) => `${index + 1}. ${item}`).join('\n')
  
  if (hasMore) {
    return `${formatted}\n... and ${items.length - maxItems} more`
  }
  
  return formatted
}

/**
 * Format recommendations with priority indicators
 */
export function formatRecommendations(recommendations: any[], options: CleanOutputOptions = {}): string {
  const { maxItems = 3, compact = true } = options
  
  if (!recommendations || recommendations.length === 0) {
    return 'No specific recommendations'
  }

  const displayItems = recommendations.slice(0, maxItems)
  const hasMore = recommendations.length > maxItems
  
  const formatted = displayItems.map((rec, index) => {
    const priority = rec.priority || 'Medium'
    const priorityText = priority === 'High' ? '**HIGH**' : priority === 'Medium' ? '**MEDIUM**' : '**LOW**'
    const action = rec.action || 'No specific action provided'
    
    if (compact) {
      return `${priorityText} ${action}`
    }
    
    return `${index + 1}. ${priorityText} [${priority}] ${rec.category || 'General'}\n   ${action}`
  }).join('\n')
  
  if (hasMore) {
    return `${formatted}\n... and ${recommendations.length - maxItems} more recommendations`
  }
  
  return formatted
}

/**
 * Format risk assessment in a clean way
 */
export function formatRisks(risks: any[], options: CleanOutputOptions = {}): string {
  const { maxItems = 3, compact = true } = options
  
  if (!risks || risks.length === 0) {
    return 'No significant risks identified'
  }

  const displayItems = risks.slice(0, maxItems)
  const hasMore = risks.length > maxItems
  
  const formatted = displayItems.map((risk, index) => {
    const probability = risk.probability || 'Unknown'
    const impact = risk.impact || 'Unknown'
    const riskLevel = getRiskLevel(probability, impact)
    const riskText = riskLevel === 'High' ? '**HIGH**' : riskLevel === 'Medium' ? '**MEDIUM**' : '**LOW**'
    const description = risk.risk || 'Unspecified risk'
    
    if (compact) {
      return `${riskText} ${description}`
    }
    
    return `${index + 1}. ${riskText} ${description}\n   ${probability} probability, ${impact} impact`
  }).join('\n')
  
  if (hasMore) {
    return `${formatted}\n... and ${risks.length - maxItems} more risks`
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
  const level = percentage >= 80 ? '**EXCELLENT**' : percentage >= 60 ? '**GOOD**' : '**NEEDS IMPROVEMENT**'
  return `${level} ${score}/${maxScore} (${percentage}%)`
}

/**
 * Format success probability with visual indicator
 */
export function formatSuccessProbability(percentage: number, confidence: string): string {
  const level = percentage >= 80 ? '**HIGH**' : percentage >= 60 ? '**MEDIUM**' : '**LOW**'
  const confidenceLevel = confidence === 'High' ? '**HIGH**' : confidence === 'Medium' ? '**MEDIUM**' : '**LOW**'
  return `${level} ${percentage}% (${confidenceLevel} ${confidence} confidence)`
}

/**
 * Create a clean section header
 */
export function createSectionHeader(title: string, icon?: string): string {
  return `\n## ${title}`
}

/**
 * Format key metrics in a compact way
 */
export function formatMetrics(metrics: Record<string, any>): string {
  return Object.entries(metrics)
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join('\n')
}

/**
 * Create a clean summary with key highlights
 */
export function createSummary(highlights: string[], maxItems: number = 3): string {
  if (!highlights || highlights.length === 0) {
    return 'Analysis completed successfully'
  }
  
  const displayItems = highlights.slice(0, maxItems)
  const hasMore = highlights.length > maxItems
  
  const formatted = displayItems.map((highlight, index) => `${index + 1}. ${highlight}`).join('\n')
  
  if (hasMore) {
    return `${formatted}\n... and ${highlights.length - maxItems} more insights`
  }
  
  return formatted
}
