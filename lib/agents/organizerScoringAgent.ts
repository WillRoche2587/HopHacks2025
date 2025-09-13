import { GoogleGenAI } from '@google/genai'
import { performAgentHealthCheck } from '@/lib/utils/healthCheck'
import { formatList, formatRecommendations, formatRisks, formatSuccessProbability, createSectionHeader, createSummary } from '@/lib/utils/formatOutput'

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
As an expert event planning consultant, analyze the following comprehensive data and provide a structured readiness assessment.

EVENT DETAILS:
${JSON.stringify(data.eventDetails, null, 2)}

WEATHER ANALYSIS:
${data.weather}

CURRENT EVENTS ANALYSIS:
${data.currentEvents}

HISTORICAL ANALYSIS:
${data.historical}

Please provide a comprehensive analysis in the following EXACT JSON structure:

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
  "criticalIssues": [
    "Issue 1 with specific details",
    "Issue 2 with specific details"
  ],
  "strengths": [
    "Strength 1 with specific details",
    "Strength 2 with specific details"
  ],
  "opportunities": [
    "Opportunity 1 with specific details",
    "Opportunity 2 with specific details"
  ],
  "recommendations": [
    {
      "category": "Weather",
      "priority": "High",
      "action": "Specific actionable recommendation",
      "timeline": "When to implement",
      "impact": "Expected impact on success"
    },
    {
      "category": "Marketing",
      "priority": "Medium",
      "action": "Specific actionable recommendation",
      "timeline": "When to implement",
      "impact": "Expected impact on success"
    }
  ],
  "riskAssessment": [
    {
      "risk": "Risk description",
      "probability": "High/Medium/Low",
      "impact": "High/Medium/Low",
      "mitigation": "Specific mitigation strategy"
    }
  ],
  "successProbability": {
    "percentage": 85,
    "confidence": "High/Medium/Low",
    "factors": ["Factor 1", "Factor 2", "Factor 3"]
  },
  "nextSteps": [
    "Immediate action item 1",
    "Immediate action item 2",
    "Immediate action item 3"
  ],
  "summary": "Comprehensive 2-3 sentence summary of the event's readiness and key recommendations"
}

IMPORTANT: 
- Return ONLY the JSON object, no additional text
- Base all scores and assessments on the provided data
- Be specific and actionable in all recommendations
- Consider all three agent analyses in your assessment
- Ensure all scores are realistic and justified by the data
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
      return formatStructuredAnalysis(structuredData, data.eventDetails)
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
  const { overallScore, criticalIssues, strengths, opportunities, recommendations, riskAssessment, successProbability, nextSteps, summary } = data
  
  return `🎯 EVENT READINESS ASSESSMENT

📍 ${eventDetails.eventType} • ${eventDetails.location} • ${eventDetails.date}

${createSectionHeader('Overall Score')}
🟢 ${overallScore?.total || 'N/A'}/100

${overallScore?.breakdown ? `
${createSectionHeader('Score Breakdown')}
• Weather: ${overallScore.breakdown.weather}/100
• Competition: ${overallScore.breakdown.competition}/100
• Historical: ${overallScore.breakdown.historical}/100
• Budget: ${overallScore.breakdown.budget}/100
• Logistics: ${overallScore.breakdown.logistics}/100
` : ''}

${createSectionHeader('Critical Issues')}
${formatList(criticalIssues, { maxItems: 3, compact: true })}

${createSectionHeader('Key Strengths')}
${formatList(strengths, { maxItems: 3, compact: true })}

${createSectionHeader('Top Opportunities')}
${formatList(opportunities, { maxItems: 3, compact: true })}

${createSectionHeader('Priority Recommendations')}
${formatRecommendations(recommendations, { maxItems: 3, compact: true })}

${createSectionHeader('Risk Assessment')}
${formatRisks(riskAssessment, { maxItems: 3, compact: true })}

${createSectionHeader('Success Probability')}
${formatSuccessProbability(successProbability?.percentage || 0, successProbability?.confidence || 'Unknown')}

${createSectionHeader('Next Steps')}
${formatList(nextSteps, { maxItems: 3, compact: true })}

${createSectionHeader('Summary')}
${summary || 'Analysis completed successfully'}`
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
