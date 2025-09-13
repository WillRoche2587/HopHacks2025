/**
 * Standardized response structure for all AI agents
 */

export interface AgentResponse {
  /** Agent identifier */
  agent: string
  /** Analysis summary */
  summary: string
  /** Key findings and insights */
  findings: string[]
  /** Specific recommendations */
  recommendations: string[]
  /** Risk factors identified */
  risks: string[]
  /** Opportunities identified */
  opportunities: string[]
  /** Confidence level (0-100) */
  confidence: number
  /** Additional metadata */
  metadata?: {
    dataSource?: string
    lastUpdated?: string
    processingTime?: number
    [key: string]: any
  }
  /** Raw analysis text for fallback */
  rawAnalysis?: string
}

/**
 * Helper function to create a standardized agent response
 */
export function createAgentResponse(
  agent: string,
  summary: string,
  findings: string[] = [],
  recommendations: string[] = [],
  risks: string[] = [],
  opportunities: string[] = [],
  confidence: number = 85,
  metadata?: any,
  rawAnalysis?: string
): AgentResponse {
  return {
    agent,
    summary,
    findings,
    recommendations,
    risks,
    opportunities,
    confidence,
    metadata: {
      lastUpdated: new Date().toISOString(),
      ...metadata
    },
    rawAnalysis
  }
}

/**
 * Parse AI response text into structured format
 */
export function parseAIResponse(
  agent: string,
  aiResponse: string,
  fallbackSummary?: string
): AgentResponse {
  try {
    // Try to extract structured information from AI response
    const lines = aiResponse.split('\n').filter(line => line.trim())
    
    const findings: string[] = []
    const recommendations: string[] = []
    const risks: string[] = []
    const opportunities: string[] = []
    
    let currentSection = ''
    let summary = fallbackSummary || ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Extract summary from first few lines if not provided
      if (!summary && trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        summary = trimmedLine.substring(0, 200) + (trimmedLine.length > 200 ? '...' : '')
      }
      
      // Identify sections
      if (trimmedLine.toLowerCase().includes('finding') || trimmedLine.toLowerCase().includes('analysis')) {
        currentSection = 'findings'
        continue
      } else if (trimmedLine.toLowerCase().includes('recommendation') || trimmedLine.toLowerCase().includes('suggest')) {
        currentSection = 'recommendations'
        continue
      } else if (trimmedLine.toLowerCase().includes('risk') || trimmedLine.toLowerCase().includes('challenge') || trimmedLine.toLowerCase().includes('concern')) {
        currentSection = 'risks'
        continue
      } else if (trimmedLine.toLowerCase().includes('opportunity') || trimmedLine.toLowerCase().includes('advantage') || trimmedLine.toLowerCase().includes('benefit')) {
        currentSection = 'opportunities'
        continue
      }
      
      // Extract bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const content = trimmedLine.substring(1).trim()
        if (content) {
          switch (currentSection) {
            case 'findings':
              findings.push(content)
              break
            case 'recommendations':
              recommendations.push(content)
              break
            case 'risks':
              risks.push(content)
              break
            case 'opportunities':
              opportunities.push(content)
              break
            default:
              // Default to findings if no section identified
              findings.push(content)
          }
        }
      }
    }
    
    // If no structured data found, create a basic response
    if (findings.length === 0 && recommendations.length === 0) {
      return createAgentResponse(
        agent,
        summary || aiResponse.substring(0, 200),
        [aiResponse],
        [],
        [],
        [],
        70,
        { parsingMethod: 'fallback' },
        aiResponse
      )
    }
    
    return createAgentResponse(
      agent,
      summary,
      findings,
      recommendations,
      risks,
      opportunities,
      85,
      { parsingMethod: 'structured' },
      aiResponse
    )
    
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return createAgentResponse(
      agent,
      fallbackSummary || 'Analysis completed',
      [aiResponse],
      [],
      [],
      [],
      60,
      { parsingMethod: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      aiResponse
    )
  }
}
