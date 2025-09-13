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
    throw new Error('GEMINI_API_KEY not configured for Organizer Scoring Agent')
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

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      3,
      15000,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const responseData = await response.json()
    const rawAnalysis = responseData.candidates?.[0]?.content?.parts?.[0]?.text
    
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
    throw new Error(`Unable to compute readiness score: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format structured analysis data into a comprehensive report
 */
function formatStructuredAnalysis(data: any, eventDetails: any): string {
  const { overallScore, criticalIssues, strengths, opportunities, recommendations, riskAssessment, successProbability, nextSteps, summary } = data
  
  return `🎯 COMPREHENSIVE EVENT READINESS ASSESSMENT

📊 OVERALL READINESS SCORE: ${overallScore?.total || 'N/A'}/100

${overallScore?.breakdown ? `
📈 SCORE BREAKDOWN:
• Weather Conditions: ${overallScore.breakdown.weather}/100
• Competition Analysis: ${overallScore.breakdown.competition}/100
• Historical Performance: ${overallScore.breakdown.historical}/100
• Budget Adequacy: ${overallScore.breakdown.budget}/100
• Logistics Planning: ${overallScore.breakdown.logistics}/100
` : ''}

🚨 CRITICAL ISSUES:
${criticalIssues && criticalIssues.length > 0 ? 
  criticalIssues.map((issue: string, index: number) => `${index + 1}. ${issue}`).join('\n') : 
  '• No critical issues identified'}

✅ STRENGTHS:
${strengths && strengths.length > 0 ? 
  strengths.map((strength: string, index: number) => `${index + 1}. ${strength}`).join('\n') : 
  '• No specific strengths identified'}

🎯 OPPORTUNITIES:
${opportunities && opportunities.length > 0 ? 
  opportunities.map((opportunity: string, index: number) => `${index + 1}. ${opportunity}`).join('\n') : 
  '• No specific opportunities identified'}

📋 DETAILED RECOMMENDATIONS:
${recommendations && recommendations.length > 0 ? 
  recommendations.map((rec: any, index: number) => 
    `${index + 1}. [${rec.priority || 'Medium'} Priority] ${rec.category || 'General'}
   Action: ${rec.action || 'No specific action provided'}
   Timeline: ${rec.timeline || 'Not specified'}
   Impact: ${rec.impact || 'Not specified'}`
  ).join('\n\n') : 
  '• No specific recommendations provided'}

⚠️ RISK ASSESSMENT:
${riskAssessment && riskAssessment.length > 0 ? 
  riskAssessment.map((risk: any, index: number) => 
    `${index + 1}. ${risk.risk || 'Unspecified risk'}
   Probability: ${risk.probability || 'Unknown'} | Impact: ${risk.impact || 'Unknown'}
   Mitigation: ${risk.mitigation || 'No mitigation strategy provided'}`
  ).join('\n\n') : 
  '• No specific risks identified'}

🎲 SUCCESS PROBABILITY: ${successProbability?.percentage || 'N/A'}%
Confidence Level: ${successProbability?.confidence || 'Unknown'}
${successProbability?.factors && successProbability.factors.length > 0 ? 
  `Key Factors: ${successProbability.factors.join(', ')}` : ''}

📅 IMMEDIATE NEXT STEPS:
${nextSteps && nextSteps.length > 0 ? 
  nextSteps.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n') : 
  '• No specific next steps provided'}

📝 EXECUTIVE SUMMARY:
${summary || 'No summary provided'}

---
Generated: ${new Date().toISOString()}
Event: ${eventDetails.eventType} in ${eventDetails.location} on ${eventDetails.date}`
}


/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(url: string, maxRetries: number, timeout: number, options: RequestInit): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}
