import { GoogleGenAI } from '@google/genai'
import { performAgentHealthCheck } from '@/lib/utils/healthCheck'
import { formatList, formatRecommendations, formatRisks, formatSuccessProbability, createSectionHeader, createSummary } from '@/lib/utils/formatOutput'
import { validateWordLimit, truncateToWordLimit } from '@/lib/utils/wordCount'

/**
 * Organizer Scoring Agent - Aggregates all agent outputs and computes readiness score
 * @param payload - Contains all agent results and event details
 * @returns Comprehensive readiness score and recommendations
 */
export async function run(payload: any): Promise<string> {
  const { 
    weatherAnalysis, 
    currentEventsAnalysis, 
    historicAnalysis, 
    eventDetails 
  } = payload

  if (!eventDetails) {
    throw new Error('Event details are required for scoring')
  }

  try {
    // Aggregate all analyses
    const aggregatedData = {
      weather: weatherAnalysis || 'No weather data available',
      currentEvents: currentEventsAnalysis || 'No current events data available',
      historical: historicAnalysis || 'No historical data available',
      eventDetails
    }

    // Compute readiness score using LLM
    const scoreAnalysis = await computeReadinessScore(aggregatedData)

    return scoreAnalysis
  } catch (error) {
    console.error('Organizer scoring agent error:', error)
    return `Unable to compute readiness score. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Compute readiness score using LLM analysis
 */
async function computeReadinessScore(data: any): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not configured for Organizer Scoring Agent - using fallback analysis')
    return generateFallbackScoring(data)
  }

  try {
    const prompt = `
You are a comprehensive event analysis coordinator. Your role is to synthesize data from multiple specialized agents and provide structured, actionable recommendations for a charitable event.

EVENT DETAILS:
${JSON.stringify(data.eventDetails, null, 2)}

AGENT ANALYSIS INPUTS:

WEATHER AGENT ANALYSIS:
${data.weather}

CURRENT EVENTS AGENT ANALYSIS:
${data.currentEvents}

HISTORICAL EVENTS AGENT ANALYSIS:
${data.historical}

TASK: Synthesize the above agent analyses into a comprehensive assessment. Extract key insights from each agent, identify patterns across analyses, and create actionable recommendations that combine insights from all sources.

ANALYSIS REQUIREMENTS:
1. Extract specific findings from each agent's analysis
2. Identify cross-cutting themes and patterns
3. Synthesize recommendations that address multiple factors simultaneously
4. Prioritize recommendations based on combined impact across all analysis areas
5. Create a holistic view that goes beyond individual agent outputs

Provide your comprehensive analysis in the following EXACT JSON structure:

{
  "overallScore": {
    "total": 85,
    "breakdown": {
      "weather": 90,
      "competition": 75,
      "historical": 80,
      "budget": 85,
      "logistics": 90
    }
  },
  "weatherAnalysis": "Synthesized weather insights from weather agent analysis",
  "currentEventsAnalysis": "Synthesized current events insights from current events agent analysis", 
  "historicalAnalysis": "Synthesized historical insights from historical events agent analysis",
  "organizerScoring": "Comprehensive recommendations combining insights from all agents",
  "criticalIssues": [
    "Cross-cutting issue identified from multiple agent analyses",
    "Issue 2 with specific details from agent data"
  ],
  "strengths": [
    "Strength identified from agent analysis",
    "Strength 2 with specific details"
  ],
  "opportunities": [
    "Opportunity identified from agent analysis",
    "Opportunity 2 with specific details"
  ],
  "recommendations": [
    {
      "category": "Weather & Logistics",
      "priority": "High",
      "action": "Specific actionable recommendation combining weather and logistics insights",
      "timeline": "When to implement",
      "impact": "Expected impact on success",
      "source": "Combined from weather and logistics agent analyses"
    },
    {
      "category": "Marketing & Competition",
      "priority": "Medium", 
      "action": "Specific actionable recommendation combining marketing and competition insights",
      "timeline": "When to implement",
      "impact": "Expected impact on success",
      "source": "Combined from current events and historical agent analyses"
    }
  ],
  "riskAssessment": [
    {
      "risk": "Risk identified from agent analysis",
      "probability": "High/Medium/Low",
      "impact": "High/Medium/Low", 
      "mitigation": "Specific mitigation strategy",
      "source": "Which agent(s) identified this risk"
    }
  ],
  "successProbability": {
    "percentage": 85,
    "confidence": "High/Medium/Low",
    "factors": ["Factor from agent analysis", "Factor 2", "Factor 3"]
  },
  "nextSteps": [
    "Immediate action item derived from agent analysis",
    "Immediate action item 2",
    "Immediate action item 3"
  ],
  "summary": "Comprehensive 2-3 sentence summary synthesizing insights from all agent analyses"
}

CRITICAL INSTRUCTIONS:
- Return ONLY the JSON object, no additional text
- Base ALL content on the provided agent analyses - do not invent data
- Synthesize insights across agents rather than just listing individual findings
- Create recommendations that address multiple analysis areas simultaneously
- Ensure weatherAnalysis, currentEventsAnalysis, historicalAnalysis, and organizerScoring fields contain synthesized content from the respective agent outputs
- Make recommendations actionable and specific to the event details provided
- Cross-reference findings between agents to identify patterns and conflicts
- Prioritize recommendations based on combined impact across all analysis areas
- IMPORTANT: Keep all text content under 250 words total. Be concise and focused.
`

    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    
    // Call Gemini API using SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })

    const rawAnalysis = response.text
    
    if (!rawAnalysis) {
      throw new Error('No analysis generated from LLM')
    }
    
    // Try to parse the structured JSON response
    try {
      const jsonMatch = rawAnalysis.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : rawAnalysis
      const structuredData = JSON.parse(jsonString)
      
      // Format the structured data into a comprehensive report
      const report = formatStructuredAnalysis(structuredData, data.eventDetails)
      
      // Validate and truncate if necessary to stay under 250 words
      return truncateToWordLimit(report, 250)
    } catch (parseError) {
      console.error('Error parsing structured response:', parseError)
      // Fallback to raw analysis if JSON parsing fails
      return rawAnalysis
    }
  } catch (error) {
    console.error('LLM scoring error:', error)
    
    // If API fails, provide fallback analysis
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('abort') || error.message.includes('fetch'))) {
      console.log('API call failed, providing fallback scoring analysis')
      return generateFallbackScoring(data)
    }
    
    throw new Error(`Unable to compute readiness score: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format structured analysis data into a comprehensive report
 */
function formatStructuredAnalysis(data: any, eventDetails: any): string {
  const { overallScore, weatherAnalysis, currentEventsAnalysis, historicalAnalysis, organizerScoring, criticalIssues, strengths, opportunities, recommendations, riskAssessment, successProbability, nextSteps, summary } = data
  
  return `# Comprehensive Recommendations

Event Type: ${eventDetails.eventType || 'Not specified'}
Date: ${eventDetails.date || 'Not specified'}
Location: ${eventDetails.location || 'Not specified'}
Duration: ${eventDetails.duration || 'Not specified'}
Expected Attendance: ${eventDetails.expectedAttendance || 'Not specified'}
Budget: $${eventDetails.budget?.toLocaleString() || 'Not specified'}
Target Audience: ${eventDetails.audience || 'Not specified'}

## Weather Analysis
${formatAnalysisSection(weatherAnalysis || 'Weather data not available', 'weather')}

## Current Events Analysis
${formatAnalysisSection(currentEventsAnalysis || 'Current events data not available', 'events')}

## Historical Trends Analysis
${formatAnalysisSection(historicalAnalysis || 'Historical data not available', 'historical')}

## Key Findings

### Critical Issues
${formatListWithMarkers(criticalIssues, '')}

### Strengths & Opportunities
${formatListWithMarkers(strengths, '')}
${formatListWithMarkers(opportunities, '')}

## Action Items
${formatActionItems(recommendations)}

## Risk Assessment
${formatRiskAssessment(riskAssessment)}

## Summary & Next Steps
${formatSummaryAndNextSteps(summary, nextSteps, overallScore?.total)}`
}

/**
 * Format analysis section with key findings and markers
 */
function formatAnalysisSection(content: string, sectionType: string): string {
  if (!content || content === 'No data available') {
    return `No ${sectionType} data available for analysis`
  }
  
  // Extract key points and format without bullet points
  const lines = content.split('\n').filter(line => line.trim())
  const formattedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      // Remove bullet points and keep content
      return trimmed.substring(1).trim()
    }
    return trimmed
  })
  
  return formattedLines.slice(0, 5).join('\n') // Limit to 5 key points
}

/**
 * Format list with risk/opportunity markers
 */
function formatListWithMarkers(items: string[], marker: string): string {
  if (!items || items.length === 0) {
    return `No items identified`
  }
  
  return items.slice(0, 3).join('\n')
}

/**
 * Format action items from recommendations
 */
function formatActionItems(recommendations: any[]): string {
  if (!recommendations || recommendations.length === 0) {
    return `No specific action items identified`
  }
  
  return recommendations.slice(0, 5).map(rec => {
    const priority = rec.priority === 'High' ? '**HIGH**' : rec.priority === 'Medium' ? '**MEDIUM**' : '**LOW**'
    const source = rec.source ? ` *[${rec.source}]*` : ''
    return `${priority} **${rec.category}:** ${rec.action} (${rec.timeline})${source}`
  }).join('\n')
}

/**
 * Format risk assessment
 */
function formatRiskAssessment(risks: any[]): string {
  if (!risks || risks.length === 0) {
    return `No significant risks identified`
  }
  
  return risks.slice(0, 3).map(risk => {
    const severity = risk.impact === 'High' ? '**HIGH**' : risk.impact === 'Medium' ? '**MEDIUM**' : '**LOW**'
    const source = risk.source ? ` *[${risk.source}]*` : ''
    return `${severity} **${risk.risk}** (${risk.probability} probability) - ${risk.mitigation}${source}`
  }).join('\n')
}

/**
 * Format summary and next steps
 */
function formatSummaryAndNextSteps(summary: string, nextSteps: string[], score: number): string {
  const scoreText = score ? `**Overall Readiness Score: ${score}/100**\n\n` : ''
  const summaryText = summary ? `${summary}\n\n` : ''
  const stepsText = nextSteps && nextSteps.length > 0 
    ? `**Immediate Next Steps:**\n${nextSteps.slice(0, 3).join('\n')}`
    : 'Review analysis and develop action plan'
  
  return `${scoreText}${summaryText}${stepsText}`
}



/**
 * Generate fallback scoring when API is unavailable
 */
function generateFallbackScoring(data: any): string {
  const eventDetails = data.eventDetails || {}
  const { eventType, location, date, expectedAttendance, budget } = eventDetails
  
  // Generate a reasonable fallback score based on available data
  const baseScore = 70
  let adjustedScore = baseScore
  
  // Adjust score based on available information
  if (expectedAttendance && expectedAttendance > 0) adjustedScore += 5
  if (budget && budget > 0) adjustedScore += 5
  if (location && location.length > 0) adjustedScore += 5
  if (date && date.length > 0) adjustedScore += 5
  
  // Cap the score
  adjustedScore = Math.min(adjustedScore, 85)
  
  const fallbackData = {
    overallScore: {
      total: adjustedScore,
      breakdown: {
        weather: 75,
        competition: 70,
        historical: 65,
        budget: budget ? 80 : 60,
        logistics: 75
      }
    },
    weatherAnalysis: 'Weather data not available - manual verification recommended for event date',
    currentEventsAnalysis: 'Current events data not available - research local event calendar for conflicts',
    historicalAnalysis: 'Historical data not available - review past similar events for insights',
    organizerScoring: 'Comprehensive analysis limited due to data availability - manual verification required',
    criticalIssues: [
      'Limited real-time data available for comprehensive analysis',
      'Manual verification required for venue availability and pricing',
      'Competitive landscape assessment needs local research'
    ],
    strengths: [
      'Event planning framework is in place',
      'Basic event parameters are defined',
      'Location and timing are specified'
    ],
    opportunities: [
      'Leverage local community networks for support',
      'Consider partnerships with local businesses',
      'Explore alternative venues and dates for optimization'
    ],
    recommendations: [
      {
        category: 'Data Collection',
        priority: 'High',
        action: 'Gather real-time venue availability and pricing information',
        timeline: 'Within 1 week',
        impact: 'Critical for accurate planning and budgeting'
      },
      {
        category: 'Competitive Analysis',
        priority: 'Medium',
        action: 'Research local event calendar and competing events',
        timeline: 'Within 2 weeks',
        impact: 'Helps optimize timing and positioning'
      },
      {
        category: 'Risk Management',
        priority: 'High',
        action: 'Develop contingency plans for weather and venue issues',
        timeline: 'Within 1 week',
        impact: 'Ensures event can proceed despite challenges'
      }
    ],
    riskAssessment: [
      {
        risk: 'Limited real-time data for decision making',
        probability: 'High',
        impact: 'Medium',
        mitigation: 'Conduct manual research and verification of key factors'
      },
      {
        risk: 'Potential venue conflicts or availability issues',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Contact venues directly and have backup options ready'
      }
    ],
    successProbability: {
      percentage: adjustedScore,
      confidence: 'Medium',
      factors: ['Basic planning framework in place', 'Location and timing defined', 'Need for additional data collection']
    },
    nextSteps: [
      'Verify venue availability and pricing',
      'Research local event calendar for conflicts',
      'Develop detailed contingency plans',
      'Establish vendor relationships and contracts',
      'Create detailed timeline and task assignments'
    ],
    summary: `Event readiness assessment shows ${adjustedScore}% preparedness based on available information. While basic planning elements are in place, additional data collection and verification are needed for optimal event success.`
  }
  
  return formatStructuredAnalysis(fallbackData, eventDetails)
}

/**
 * Health check for Organizer Scoring Agent
 */
export async function healthCheck() {
  return await performAgentHealthCheck('organizerScoring')
}
