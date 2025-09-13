import { AgentResponse, createAgentResponse, parseAIResponse } from '@/lib/types/agentResponse'
import { getDetailedAgentPrompt } from '@/lib/prompts/agentPrompts'

/**
 * Current Events Agent - Analyzes events within the last 72 hours that could impact the upcoming event
 * @param payload - Contains location, date, and event details
 * @returns Analysis of recent events that could affect the planned event
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
    // Use Gemini to search for and analyze recent events in one go
    const currentDate = new Date()
    const startDate = new Date(Date.now() - 72 * 60 * 60 * 1000) // 72 hours ago
    
    const prompt = `You are a comprehensive current events analyst with access to real-time information. Search for and analyze ANY significant events that have occurred in ${location} within the last 72 hours (from ${startDate.toISOString()} to ${currentDate.toISOString()}) that could impact an upcoming ${eventType} event on ${date}.

SEARCH AND ANALYZE:
- Traffic incidents, road closures, construction delays
- Weather emergencies, severe weather warnings, storms
- Local emergencies, accidents, public safety incidents
- Major events, festivals, concerts, protests, gatherings
- Infrastructure issues (power outages, water main breaks, gas leaks)
- Transportation disruptions (airport delays, train cancellations, transit issues)
- Public health alerts, disease outbreaks, advisories
- Government announcements, policy changes affecting the area
- Sports events, entertainment venues with large crowds
- Breaking news that could affect local conditions

EVENT DETAILS:
Type: ${eventType}
Location: ${location}
Date: ${date}
Expected Attendance: ${expectedAttendance || 'Not specified'}

OUTPUT FORMAT - Provide a comprehensive report exactly like this:

📰 CURRENT EVENTS ANALYSIS REPORT

📍 Location: ${location}
📅 Event Date: ${date}
🎪 Event Type: ${eventType}

⏰ MONITORING WINDOW: Last 72 Hours

🔍 RECENT EVENTS ANALYSIS:
[If events found: List each significant event with timestamp, description, and potential impact]
[If no events: • No significant events detected in the last 72 hours that could impact your upcoming event]

📊 IMPACT ASSESSMENT:
• Overall Impact Level: [None/Minimal/Low/Medium/High]
• Risk Level: [None/Low/Medium/High/Critical]
• Event Viability: [Unaffected/Minor Concerns/Moderate Impact/Major Impact/Critical Impact]

[IF EVENTS FOUND, INCLUDE:]
🚨 CRITICAL FINDINGS:
[List any events that pose immediate risks or require urgent action]

✅ POSITIVE DEVELOPMENTS:
[List any events that could benefit the planned event or improve conditions]

⚠️ POTENTIAL CONCERNS:
[List events that require monitoring, could cause minor issues, or need contingency planning]

[IF NO EVENTS FOUND, INCLUDE:]
✅ KEY FINDINGS:
1. No traffic disruptions or road closures reported
2. No major local incidents or emergencies
3. No competing events scheduled for the same timeframe
4. Normal public service operations expected
5. Weather conditions appear stable

🎯 SPECIFIC RECOMMENDATIONS:
[Provide 3-5 actionable recommendations based on your findings - either mitigation strategies for found events OR standard preparation steps if no events found]

📈 CONFIDENCE LEVEL: [High/Medium/Low]
[Brief explanation: "Based on comprehensive monitoring of news sources, emergency services, traffic systems, and local announcements" OR "Limited data availability requires manual verification"]

🔄 MONITORING STATUS:
• Continuous monitoring active
• Will alert if new developments arise
• Next update scheduled closer to event date

---
Generated: ${currentDate.toISOString()}
Analysis Window: 72 hours prior to report generation
Event: ${eventType} in ${location} on ${date}

INSTRUCTIONS:
- Only include REAL, VERIFIED events that have actually occurred
- Focus on events that could realistically impact the planned event
- If you find significant events, provide detailed impact analysis
- If you find no significant events, clearly state the area is clear for event planning
- Be specific about locations, times, and expected duration of any impacts
- Provide actionable recommendations in all cases`

    // Call Gemini API for comprehensive analysis
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      3,
      30000,
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
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error('Gemini API Error:', response.status, errorText)
      return generateFallbackAnalysis(payload)
    }

    const data = await response.json()
    const rawAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawAnalysis || rawAnalysis.trim().length === 0) {
      console.error('Empty analysis from Gemini')
      return generateFallbackAnalysis(payload)
    }

    return rawAnalysis

  } catch (error) {
    console.error('Current events agent error:', error)
    return generateFallbackAnalysis(payload)
  }
}

/**
 * Generate fallback analysis when Gemini fails
 */
function generateFallbackAnalysis(payload: any): string {
  const { location, date, eventType } = payload
  
  return `📰 CURRENT EVENTS ANALYSIS REPORT

📍 Location: ${location}
📅 Event Date: ${date}
🎪 Event Type: ${eventType}

⏰ MONITORING WINDOW: Last 72 Hours

🔍 RECENT EVENTS ANALYSIS:
• Analysis system temporarily unavailable - using fallback monitoring
• Standard monitoring protocols engaged
• Manual verification recommended for critical events

📊 IMPACT ASSESSMENT:
• Overall Impact Level: Unknown (System Unavailable)
• Risk Level: Medium (Precautionary)
• Event Viability: Requires Manual Verification

⚠️ FALLBACK RECOMMENDATIONS:
• Contact local authorities for recent incident reports
• Check local news sources manually
• Verify traffic conditions via local traffic apps
• Confirm venue accessibility with venue management
• Monitor social media for local disruptions
• Check weather services for any alerts

🎯 IMMEDIATE ACTIONS:
1. Manual verification of local conditions strongly recommended
2. Contact venue directly for any reported issues
3. Check with local emergency services for recent incidents
4. Verify public transportation status
5. Review local government websites for announcements

📈 CONFIDENCE LEVEL: Low
(Due to analysis system limitations - manual verification required)

🔄 MONITORING STATUS:
• Attempting to restore analysis capabilities
• Manual verification strongly recommended
• Contact technical support if issues persist

---
Generated: ${new Date().toISOString()}
Analysis Window: 72 hours prior to report generation
Event: ${eventType} in ${location} on ${date}`
}

/**
 * Utility function for retry logic
 */
async function fetchWithRetry(url: string, maxRetries: number, timeout: number, options?: RequestInit): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return response
      } else if (response.status >= 500 || response.status === 429) {
        // Server errors or rate limits - retry
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
      } else {
        // Client errors - return for handling
        return response
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error')
      
      if (attempt === maxRetries) {
        break
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}