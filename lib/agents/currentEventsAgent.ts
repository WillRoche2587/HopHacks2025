import { AgentResponse, createAgentResponse, parseAIResponse } from '@/lib/types/agentResponse'
import { getDetailedAgentPrompt } from '@/lib/prompts/agentPrompts'
import { GoogleGenAI } from '@google/genai'
import { performAgentHealthCheck } from '@/lib/utils/healthCheck'
import { formatList, createSectionHeader, formatMetrics } from '@/lib/utils/formatOutput'

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
    console.warn('GEMINI_API_KEY not configured for Current Events Agent - using fallback analysis')
    return generateFallbackAnalysis(payload)
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

    // Generate optimized prompt for faster response
    const prompt = generateOptimizedCurrentEventsPrompt(analysisContext)

    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    
    // Call Gemini API for intelligent analysis using SDK
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })

    const rawAnalysis = response.text

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

    // Format as clean, readable output
    return formatCurrentEventsOutput(structuredResponse, { eventType, location, date })

  } catch (error) {
    console.error('Current events agent error:', error)
    
    // If API fails, provide fallback analysis
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('abort') || error.message.includes('fetch'))) {
      console.log('API call failed, providing fallback analysis')
      return generateFallbackAnalysis(payload)
    }
    
    return `Unable to analyze current events for ${location}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}


/**
 * Fetch current events from various sources
 */
async function fetchCurrentEvents(location: string, date: string): Promise<any[]> {
  try {
    console.log(`Fetching current events for ${location} on ${date}`)
    
    // For now, we'll use a combination of approaches:
    // 1. Try to fetch from public event APIs (if available)
    // 2. Use AI to generate realistic event data based on location and date
    // 3. Return structured mock data that represents typical events in the area
    
    const eventDate = new Date(date)
    const dayOfWeek = eventDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // Generate realistic event data based on location and timing
    const mockEvents = generateRealisticEvents(location, date, isWeekend)
    
    console.log(`Found ${mockEvents.length} events for ${location} on ${date}`)
    return mockEvents
    
  } catch (error) {
    console.error('Error fetching current events:', error)
  return []
  }
}

/**
 * Generate realistic event data based on location and date
 */
function generateRealisticEvents(location: string, date: string, isWeekend: boolean): any[] {
  const events: any[] = []
  
  // Base events that are common in most locations
  const baseEvents = [
    {
      name: "Community Farmers Market",
      type: "market",
      venue: "Downtown Square",
      time: "8:00 AM - 2:00 PM",
      expectedAttendance: 200,
      category: "community"
    },
    {
      name: "Local Art Gallery Opening",
      type: "exhibition",
      venue: "Community Arts Center",
      time: "6:00 PM - 9:00 PM",
      expectedAttendance: 75,
      category: "cultural"
    }
  ]
  
  // Weekend-specific events
  if (isWeekend) {
    baseEvents.push(
      {
        name: "Weekend Yoga in the Park",
        type: "fitness",
        venue: "Central Park",
        time: "9:00 AM - 10:00 AM",
        expectedAttendance: 30,
        category: "wellness"
      },
      {
        name: "Saturday Night Live Music",
        type: "concert",
        venue: "Local Brewery",
        time: "8:00 PM - 11:00 PM",
        expectedAttendance: 150,
        category: "entertainment"
      }
    )
  }
  
  // Location-specific events
  if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('nyc')) {
    baseEvents.push(
      {
        name: "Broadway Show Preview",
        type: "theater",
        venue: "Times Square Theater District",
        time: "7:30 PM - 10:00 PM",
        expectedAttendance: 500,
        category: "entertainment"
      },
      {
        name: "Central Park Running Club",
        type: "fitness",
        venue: "Central Park",
        time: "7:00 AM - 8:30 AM",
        expectedAttendance: 50,
        category: "sports"
      }
    )
  }
  
  // Add some variation and realistic details
  baseEvents.forEach((event, index) => {
    events.push({
      ...event,
      id: `event_${index + 1}`,
      date: date,
      location: location,
      description: `${event.name} happening in ${location}`,
      organizer: "Local Community Organization",
      price: event.type === 'market' ? 'Free' : '$10-25',
      capacity: Math.round(event.expectedAttendance * 1.2),
      registrationRequired: event.type === 'fitness' || event.type === 'workshop'
    })
  })
  
  return events
}

/**
 * Fetch traffic data from maps APIs
 */
async function fetchTrafficData(location: string, date: string): Promise<any> {
  try {
    console.log(`Fetching traffic data for ${location} on ${date}`)
    
    const mapsApiKey = process.env.MAPS_API_KEY
    
    if (!mapsApiKey) {
      console.log('MAPS_API_KEY not configured, using estimated traffic data')
      return generateEstimatedTrafficData(location, date)
    }
    
    // TODO: Implement real Google Maps Traffic API integration
    // For now, return estimated data
    return generateEstimatedTrafficData(location, date)
    
  } catch (error) {
    console.error('Error fetching traffic data:', error)
    return generateEstimatedTrafficData(location, date)
  }
}

/**
 * Generate estimated traffic data based on location and date
 */
function generateEstimatedTrafficData(location: string, date: string): any {
  const eventDate = new Date(date)
  const dayOfWeek = eventDate.getDay()
  const hour = eventDate.getHours()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
  
  // Base traffic levels
  let baseTrafficLevel = 'moderate'
  let congestionFactor = 1.0
  
  // Adjust based on day of week and time
  if (isWeekday) {
    if (hour >= 7 && hour <= 9) {
      baseTrafficLevel = 'high'
      congestionFactor = 1.8
    } else if (hour >= 17 && hour <= 19) {
      baseTrafficLevel = 'high'
      congestionFactor = 1.6
    } else if (hour >= 10 && hour <= 16) {
      baseTrafficLevel = 'moderate'
      congestionFactor = 1.2
    } else {
      baseTrafficLevel = 'low'
      congestionFactor = 0.8
    }
  } else if (isWeekend) {
    if (hour >= 10 && hour <= 18) {
      baseTrafficLevel = 'moderate'
      congestionFactor = 1.3
    } else {
      baseTrafficLevel = 'low'
      congestionFactor = 0.7
    }
  }
  
  // Adjust for location
  if (location.toLowerCase().includes('new york') || location.toLowerCase().includes('nyc')) {
    congestionFactor *= 1.5
    baseTrafficLevel = congestionFactor > 1.5 ? 'high' : 'moderate'
  } else if (location.toLowerCase().includes('los angeles') || location.toLowerCase().includes('california')) {
    congestionFactor *= 1.3
  }
  
  return {
    location: location,
    date: date,
    trafficLevel: baseTrafficLevel,
    congestionFactor: Math.round(congestionFactor * 100) / 100,
    estimatedTravelTime: {
      normal: '15-20 minutes',
      withTraffic: `${Math.round(15 * congestionFactor)}-${Math.round(20 * congestionFactor)} minutes`
    },
    peakHours: isWeekday ? ['7:00-9:00 AM', '5:00-7:00 PM'] : ['10:00 AM-6:00 PM'],
    recommendations: generateTrafficRecommendations(baseTrafficLevel, isWeekend, hour),
    dataSource: 'Estimated based on location and timing patterns',
    confidence: 'Medium'
  }
}

/**
 * Generate traffic recommendations based on conditions
 */
function generateTrafficRecommendations(trafficLevel: string, isWeekend: boolean, hour: number): string[] {
  const recommendations = []
  
  if (trafficLevel === 'high') {
    recommendations.push('Consider starting event earlier or later to avoid peak traffic')
    recommendations.push('Provide alternative transportation options (public transit, carpooling)')
    recommendations.push('Allow extra time for setup and attendee arrival')
  }
  
  if (isWeekend) {
    recommendations.push('Weekend traffic is generally lighter, but popular areas may still be congested')
    recommendations.push('Consider parking availability and provide parking guidance')
  } else {
    recommendations.push('Weekday events may face rush hour traffic - plan accordingly')
    recommendations.push('Consider public transportation options for attendees')
  }
  
  if (hour >= 7 && hour <= 9) {
    recommendations.push('Morning rush hour - consider later start time')
  } else if (hour >= 17 && hour <= 19) {
    recommendations.push('Evening rush hour - consider earlier start time')
  }
  
  return recommendations
}

/**
 * Format current events analysis into clean, readable output
 */
function formatCurrentEventsOutput(analysis: any, eventDetails: any): string {
  const { eventType, location, date } = eventDetails
  const { findings, recommendations, risks, opportunities, confidence } = analysis
  
  return `📅 CURRENT EVENTS ANALYSIS

📍 ${eventType} • ${location} • ${date}

${createSectionHeader('Key Findings')}
${formatList(findings, { maxItems: 3, compact: true })}

${createSectionHeader('Top Recommendations')}
${formatList(recommendations, { maxItems: 3, compact: true })}

${createSectionHeader('Risk Factors')}
${formatList(risks, { maxItems: 3, compact: true })}

${createSectionHeader('Opportunities')}
${formatList(opportunities, { maxItems: 3, compact: true })}

${createSectionHeader('Confidence')}
🟢 ${confidence || 85}% (Based on available data)

⚠️ Note: Analysis based on estimated data. Configure APIs for real-time information.`
}

/**
 * Generate fallback analysis when API is unavailable
 */
function generateFallbackAnalysis(payload: any): string {
  const { location, date, eventType, expectedAttendance } = payload
  
  const fallbackAnalysis = {
    agent: 'currentEvents',
    summary: `Competitive landscape analysis for ${eventType} in ${location} on ${date}`,
    findings: [
      `No real-time event data available for ${location} on ${date}`,
      `Competitive analysis based on general market knowledge`,
      `Traffic patterns estimated based on location and timing`
    ],
    recommendations: [
      'Contact local venues directly for availability and pricing',
      'Check local event calendars and community boards',
      'Plan for potential traffic congestion during peak hours'
    ],
    risks: [
      'Potential venue conflicts with other events',
      'Traffic congestion during peak hours',
      'Limited real-time competitive intelligence'
    ],
    opportunities: [
      'Partner with local businesses for venue and promotion',
      'Leverage community networks for volunteer recruitment',
      'Consider off-peak timing for better venue availability'
    ],
    confidence: 60,
    metadata: {
      dataSource: 'Fallback analysis - no real-time data available',
      processingTime: Date.now(),
      eventsFound: 0,
      trafficDataAvailable: false,
      fallbackMode: true
    },
    rawAnalysis: `Fallback competitive analysis for ${eventType} event in ${location} on ${date}. This analysis is based on general market knowledge and should be supplemented with real-time data when available.`
  }
  
  return formatCurrentEventsOutput(fallbackAnalysis, { eventType, location, date })
}

/**
 * Generate optimized prompt for faster current events analysis
 */
function generateOptimizedCurrentEventsPrompt(context: any): string {
  const { eventDetails, currentEvents, trafficConditions } = context
  const { eventType, location, date, expectedAttendance } = eventDetails
  
  return `Analyze competitive landscape for ${eventType} in ${location} on ${date}.

EVENT DATA:
- Type: ${eventType}
- Location: ${location}
- Date: ${date}
- Expected Attendance: ${expectedAttendance || 'Not specified'}

COMPETING EVENTS (${currentEvents.length} found):
${currentEvents.map((event: any, i: number) => 
  `${i + 1}. ${event.name} (${event.type}) - ${event.venue} at ${event.time} - ${event.expectedAttendance} attendees`
).join('\n')}

TRAFFIC CONDITIONS:
- Level: ${trafficConditions?.trafficLevel || 'Unknown'}
- Congestion Factor: ${trafficConditions?.congestionFactor || 'Unknown'}
- Peak Hours: ${trafficConditions?.peakHours?.join(', ') || 'Unknown'}

Provide concise analysis with:
1. Key competitive threats (top 3)
2. Traffic impact assessment
3. Venue availability concerns
4. Timing optimization recommendations
5. Risk mitigation strategies

Keep response under 500 words.`
}

/**
 * Health check for Current Events Agent
 */
export async function healthCheck() {
  return await performAgentHealthCheck('currentEvents')
}
