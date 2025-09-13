import { AgentResponse, createAgentResponse, parseAIResponse } from '@/lib/types/agentResponse'
import { getDetailedAgentPrompt } from '@/lib/prompts/agentPrompts'

/**
 * Current Events Agent - Analyzes current events and traffic conditions using AI
 * @param payload - Contains location, date, and event details
 * @returns Structured AI-powered current events analysis and traffic impact assessment
 */
export async function run(payload: any): Promise<string> {
  const { location, date, eventType, expectedAttendance } = payload

  if (!location || !date) {
    throw new Error('Location and date are required for current events analysis')
  }

  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured for Current Events Agent')
  }

  try {
    // Fetch current events and traffic data
    const [eventsData, trafficData] = await Promise.allSettled([
      fetchCurrentEvents(location, date),
      fetchTrafficData(location, date)
    ])

    // Prepare context for AI analysis
    const eventsContext = eventsData.status === 'fulfilled' ? eventsData.value : []
    const trafficContext = trafficData.status === 'fulfilled' ? trafficData.value : null

    // Create structured context for analysis - pass the full form data
    const analysisContext = {
      eventDetails: payload, // Pass the complete form data
      currentEvents: eventsContext,
      trafficConditions: trafficContext,
      analysisTimestamp: new Date().toISOString()
    }

    // Generate detailed, event-specific prompt
    const prompt = getDetailedAgentPrompt('currentEvents', analysisContext)

    // Call Gemini API for intelligent analysis
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3072,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const data = await response.json()
    const rawAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawAnalysis) {
      throw new Error('No analysis generated from LLM')
    }

    // Parse AI response into structured format
    const structuredResponse = parseAIResponse('currentEvents', rawAnalysis, 
      `Current events and traffic analysis for ${eventType} in ${location} on ${date}`)

    // Add metadata
    structuredResponse.metadata = {
      ...structuredResponse.metadata,
      dataSource: 'No real data sources configured',
      processingTime: Date.now(),
      eventsFound: eventsContext.length,
      trafficDataAvailable: trafficContext !== null
    }

    // Return structured response as JSON string
    return JSON.stringify(structuredResponse)

  } catch (error) {
    console.error('Current events agent error:', error)
    return `Unable to analyze current events for ${location}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Utility function for retry logic
 */
async function fetchWithRetry(url: string, maxRetries: number, timeout: number, options?: RequestInit): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * Fetch current events from various sources
 */
async function fetchCurrentEvents(location: string, date: string): Promise<any[]> {
  // This would integrate with event APIs like Eventbrite, Facebook Events, etc.
  // For now, return empty array as we don't have real event data sources configured
  // In a production system, this would query actual event APIs and databases
  console.log(`Fetching current events for ${location} on ${date} - no data sources configured`)
  return []
}

/**
 * Fetch traffic data from maps APIs
 */
async function fetchTrafficData(location: string, date: string): Promise<any> {
  try {
    // This would integrate with real maps APIs (Google Maps, HERE, etc.)
    // For now, return null as we don't have real traffic data sources configured
    // In a production system, this would query actual traffic APIs
    console.log(`Fetching traffic data for ${location} on ${date} - no data sources configured`)
    return null
  } catch (error) {
    console.error('Error fetching traffic data:', error)
    return null
  }
}
