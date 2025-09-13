/**
 * Input Parser Agent - Uses Gemini to intelligently parse user input
 * @param payload - Contains the user's raw text input
 * @returns Structured event details and context
 */
export async function run(payload: any): Promise<any> {
  const { userInput } = payload

  if (!userInput) {
    throw new Error('User input is required for parsing')
  }

  const geminiApiKey = process.env.GEMINI_API_KEY
  
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured for Input Parser Agent')
  }

  try {
    const prompt = `
You are an expert event planning assistant. Parse the following user input and extract structured information about their event.

User Input: "${userInput}"

Extract and return ONLY a JSON object with the following structure:
{
  "eventType": "string (e.g., festival, concert, conference, meeting, party, gathering, workshop, seminar, etc.)",
  "location": "string (city, venue, or specific address)",
  "date": "string (YYYY-MM-DD format, or relative dates like 'tomorrow', 'next week')",
  "expectedAttendance": "number (estimated number of attendees)",
  "budget": "number (budget in dollars)",
  "eventName": "string (specific name of the event if mentioned)",
  "venue": "string (specific venue name if mentioned)",
  "time": "string (time of day if mentioned)",
  "duration": "string (how long the event will last)",
  "purpose": "string (what the event is for, its goals)",
  "audience": "string (target audience or demographic)",
  "specialRequirements": "array of strings (any special needs, equipment, or considerations)",
  "context": "string (additional context or details about the event)"
}

Rules:
1. If information is not explicitly mentioned, use null for that field
2. Convert relative dates to YYYY-MM-DD format
3. Extract numbers for attendance and budget (remove commas, convert to integers)
4. Be specific about event types and locations
5. Include any special requirements or considerations mentioned
6. Return ONLY the JSON object, no other text

Example:
Input: "I'm organizing a tech conference in San Francisco on March 15th, 2024 for about 500 developers with a $50,000 budget"
Output: {
  "eventType": "conference",
  "location": "San Francisco",
  "date": "2024-03-15",
  "expectedAttendance": 500,
  "budget": 50000,
  "eventName": null,
  "venue": null,
  "time": null,
  "duration": null,
  "purpose": "tech conference for developers",
  "audience": "developers",
  "specialRequirements": [],
  "context": "tech conference"
}
`

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      3,
      10000,
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
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : responseText
      const parsedData = JSON.parse(jsonString)
      
      // Validate and clean the parsed data
      return validateAndCleanParsedData(parsedData)
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      throw new Error(`Unable to parse user input: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

  } catch (error) {
    console.error('Input parser agent error:', error)
    throw new Error(`Unable to parse user input: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}


/**
 * Validate and clean the parsed data from Gemini
 */
function validateAndCleanParsedData(data: any): any {
  return {
    eventType: data.eventType || null,
    location: data.location || null,
    date: data.date || null,
    expectedAttendance: typeof data.expectedAttendance === 'number' ? data.expectedAttendance : null,
    budget: typeof data.budget === 'number' ? data.budget : null,
    eventName: data.eventName || null,
    venue: data.venue || null,
    time: data.time || null,
    duration: data.duration || null,
    purpose: data.purpose || null,
    audience: data.audience || null,
    specialRequirements: Array.isArray(data.specialRequirements) ? data.specialRequirements : [],
    context: data.context || null
  }
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
