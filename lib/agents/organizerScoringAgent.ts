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
    // Return a more user-friendly error response instead of throwing
    return generateFallbackAnalysis(eventDetails, error instanceof Error ? error.message : 'Unknown error')
  }
}

/**
 * Compute readiness score using LLM analysis with comprehensive error handling
 */
async function computeReadinessScore(data: any): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured for Organizer Scoring Agent')
  }

  // Validate input data
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data provided to scoring function')
  }

  try {
    const prompt = buildOptimizedPrompt(data)
    
    // Log request details for debugging
    console.log('LLM Request Details:', {
      promptLength: prompt.length,
      eventType: data.eventDetails?.eventType,
      location: data.eventDetails?.location,
      timestamp: new Date().toISOString()
    })

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      3,
      20000, // Increased timeout to 20 seconds
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
            maxOutputTokens: 4096, // Increased token limit
            stopSequences: []
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        })
      }
    )

    // Enhanced response validation
    console.log('LLM Response Status:', response.status)
    console.log('LLM Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('LLM API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      })
      throw new Error(`LLM API error: ${response.status} - ${response.statusText}. Body: ${errorText}`)
    }

    const responseData = await response.json()
    console.log('LLM Response Structure:', {
      hasCandidates: !!responseData.candidates,
      candidatesLength: responseData.candidates?.length,
      hasContent: !!responseData.candidates?.[0]?.content,
      hasParts: !!responseData.candidates?.[0]?.content?.parts,
      partsLength: responseData.candidates?.[0]?.content?.parts?.length
    })

    // More robust response extraction
    const rawAnalysis = extractAnalysisFromResponse(responseData)
    
    if (!rawAnalysis || rawAnalysis.trim().length === 0) {
      console.error('Empty analysis from LLM. Full response:', JSON.stringify(responseData, null, 2))
      throw new Error('No analysis generated from LLM - empty response content')
    }

    console.log('Raw Analysis Length:', rawAnalysis.length)
    console.log('Raw Analysis Preview:', rawAnalysis.substring(0, 200) + '...')
    
    // Try to parse the structured JSON response
    try {
      const structuredData = parseStructuredResponse(rawAnalysis)
      return formatStructuredAnalysis(structuredData, data.eventDetails)
    } catch (parseError) {
      console.error('Error parsing structured response:', parseError)
      console.error('Raw response for debugging:', rawAnalysis)
      
      // Enhanced fallback - try to extract partial data
      const partialData = extractPartialData(rawAnalysis)
      if (partialData) {
        return formatStructuredAnalysis(partialData, data.eventDetails)
      }
      
      // Final fallback to raw analysis with formatting
      return formatRawAnalysis(rawAnalysis, data.eventDetails)
    }
  } catch (error) {
    console.error('LLM scoring error:', error)
    
    // Check for specific error types and provide better error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error(`Network error connecting to LLM service: ${error.message}`)
      } else if (error.message.includes('timeout') || error.message.includes('aborted')) {
        throw new Error(`LLM request timed out. The analysis may be too complex.`)
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(`Authentication error with LLM service. Check API key configuration.`)
      } else if (error.message.includes('429')) {
        throw new Error(`Rate limit exceeded for LLM service. Please try again later.`)
      }
    }
    
    throw new Error(`Unable to compute readiness score: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Build an optimized prompt with better structure and constraints
 */
function buildOptimizedPrompt(data: any): string {
  return `You are a senior event planning strategist analyzing event readiness. Provide a comprehensive assessment in STRICT JSON format.

EVENT DATA:
Event Type: ${data.eventDetails?.eventType || 'Not specified'}
Location: ${data.eventDetails?.location || 'Not specified'}
Date: ${data.eventDetails?.date || 'Not specified'}
Budget: ${data.eventDetails?.budget || 'Not specified'}
Expected Attendance: ${data.eventDetails?.expectedAttendance || 'Not specified'}

WEATHER ANALYSIS:
${data.weather}

CURRENT EVENTS:
${data.currentEvents}

HISTORICAL DATA:
${data.historical}

RESPOND WITH ONLY THIS JSON STRUCTURE (no additional text):

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
    "Issue 1 description",
    "Issue 2 description"
  ],
  "strengths": [
    "Strength 1 description",
    "Strength 2 description"
  ],
  "opportunities": [
    "Opportunity 1 description",
    "Opportunity 2 description"
  ],
  "recommendations": [
    {
      "category": "Weather",
      "priority": "High",
      "action": "Specific action",
      "timeline": "When to implement",
      "impact": "Expected impact"
    }
  ],
  "riskAssessment": [
    {
      "risk": "Risk description",
      "probability": "High",
      "impact": "Medium",
      "mitigation": "Mitigation strategy"
    }
  ],
  "successProbability": {
    "percentage": 85,
    "confidence": "High",
    "factors": ["Factor 1", "Factor 2"]
  },
  "nextSteps": [
    "Step 1",
    "Step 2"
  ],
  "summary": "Brief summary of readiness and key points"
}`
}

/**
 * Extract analysis from LLM response with multiple fallback methods
 */
function extractAnalysisFromResponse(responseData: any): string | null {
  // Method 1: Standard extraction
  let analysis = responseData.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (analysis && analysis.trim().length > 0) {
    return analysis
  }

  // Method 2: Check for alternative response structures
  if (responseData.candidates && responseData.candidates.length > 0) {
    for (const candidate of responseData.candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text && part.text.trim().length > 0) {
            return part.text
          }
        }
      }
    }
  }

  // Method 3: Check for direct text response
  if (responseData.text && responseData.text.trim().length > 0) {
    return responseData.text
  }

  // Method 4: Check for any text content in the response
  const responseStr = JSON.stringify(responseData)
  const textMatches = responseStr.match(/"text"\s*:\s*"([^"]+)"/g)
  if (textMatches && textMatches.length > 0) {
    return textMatches[0].replace(/"text"\s*:\s*"/, '').replace(/"$/, '')
  }

  return null
}

/**
 * Parse structured response with multiple parsing strategies
 */
function parseStructuredResponse(rawAnalysis: string): any {
  // Clean the response
  const cleaned = rawAnalysis.trim()
  
  // Strategy 1: Direct JSON parse
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Continue to next strategy
  }
  
  // Strategy 2: Extract JSON from text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {
      // Continue to next strategy
    }
  }
  
  // Strategy 3: Try to find and parse nested JSON
  const nestedJsonMatch = cleaned.match(/```json\s*(\{[\s\S]*?\})\s*```/)
  if (nestedJsonMatch) {
    try {
      return JSON.parse(nestedJsonMatch[1])
    } catch (e) {
      // Continue to next strategy
    }
  }
  
  // Strategy 4: Build basic structure from text
  return extractPartialData(cleaned)
}

/**
 * Extract partial data from unstructured response
 */
function extractPartialData(text: string): any {
  const partialData: any = {
    overallScore: { total: 75, breakdown: {} },
    criticalIssues: [],
    strengths: [],
    opportunities: [],
    recommendations: [],
    riskAssessment: [],
    successProbability: { percentage: 75, confidence: "Medium", factors: [] },
    nextSteps: [],
    summary: "Analysis partially extracted from unstructured response."
  }

  // Try to extract score
  const scoreMatch = text.match(/score[:\s]*(\d+)/i)
  if (scoreMatch) {
    partialData.overallScore.total = parseInt(scoreMatch[1])
  }

  // Try to extract issues
  const issueMatches = text.match(/(?:issue|problem|concern)[s]?[:\s]*([^\n.]+)/gi)
  if (issueMatches) {
    partialData.criticalIssues = issueMatches.slice(0, 3).map(match => 
      match.replace(/(?:issue|problem|concern)[s]?[:\s]*/i, '').trim()
    )
  }

  return partialData
}

/**
 * Generate fallback analysis when LLM fails completely
 */
function generateFallbackAnalysis(eventDetails: any, errorMessage: string): string {
  const fallbackData = {
    overallScore: {
      total: 70,
      breakdown: {
        weather: 75,
        competition: 65,
        historical: 70,
        budget: 70,
        logistics: 75
      }
    },
    criticalIssues: [
      "LLM analysis service temporarily unavailable",
      "Using fallback assessment based on basic event parameters"
    ],
    strengths: [
      "Event planning process is active and organized",
      "Multiple data sources being considered for decision making"
    ],
    opportunities: [
      "Retry analysis when service is restored",
      "Manual review of individual agent reports"
    ],
    recommendations: [
      {
        category: "System",
        priority: "High", 
        action: "Retry automated analysis or conduct manual review",
        timeline: "Immediate",
        impact: "Ensures proper event assessment"
      }
    ],
    riskAssessment: [
      {
        risk: "Incomplete automated analysis",
        probability: "High",
        impact: "Medium",
        mitigation: "Manual review of source data and expert consultation"
      }
    ],
    successProbability: {
      percentage: 70,
      confidence: "Low",
      factors: ["Limited analysis due to system error", "Base event parameters appear viable"]
    },
    nextSteps: [
      "Review individual agent reports manually",
      "Retry automated analysis",
      "Consult with event planning experts"
    ],
    summary: `Automated analysis temporarily unavailable due to: ${errorMessage}. Fallback assessment suggests moderate readiness with need for manual review.`
  }

  return formatStructuredAnalysis(fallbackData, eventDetails)
}

/**
 * Format raw analysis when structured parsing fails
 */
function formatRawAnalysis(rawAnalysis: string, eventDetails: any): string {
  return `🎯 EVENT READINESS ASSESSMENT (Raw Analysis)

📊 ANALYSIS OUTPUT:
${rawAnalysis}

---
⚠️ Note: This analysis was provided in unstructured format and may require manual interpretation.

Generated: ${new Date().toISOString()}
Event: ${eventDetails.eventType} in ${eventDetails.location} on ${eventDetails.date}`
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
• Weather Conditions: ${overallScore.breakdown.weather || 'N/A'}/100
• Competition Analysis: ${overallScore.breakdown.competition || 'N/A'}/100
• Historical Performance: ${overallScore.breakdown.historical || 'N/A'}/100
• Budget Adequacy: ${overallScore.breakdown.budget || 'N/A'}/100
• Logistics Planning: ${overallScore.breakdown.logistics || 'N/A'}/100
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
 * Fetch with retry logic and timeout - Enhanced version
 */
async function fetchWithRetry(url: string, maxRetries: number, timeout: number, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`LLM Request attempt ${attempt}/${maxRetries}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log(`Request timeout after ${timeout}ms`)
        controller.abort()
      }, timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log(`LLM Request successful on attempt ${attempt}`)
        return response
      } else {
        // Log non-success responses but continue retrying for certain status codes
        console.log(`LLM Request failed with status ${response.status} on attempt ${attempt}`)
        if (response.status >= 500 || response.status === 429) {
          // Server errors or rate limits - retry
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        } else {
          // Client errors - don't retry
          return response
        }
      }
    } catch (error) {
      console.error(`LLM Request attempt ${attempt} failed:`, error)
      lastError = error instanceof Error ? error : new Error('Unknown fetch error')
      
      if (attempt === maxRetries) {
        break
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attempt) * 1000
      const jitter = Math.random() * 1000
      const delay = baseDelay + jitter
      
      console.log(`Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}