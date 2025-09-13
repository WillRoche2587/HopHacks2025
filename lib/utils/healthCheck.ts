/**
 * Health Check Utilities for Agent System
 */

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export interface AgentHealthCheck {
  agentName: string
  status: HealthStatus
  dependencies: {
    geminiApi: HealthStatus
    weatherApi?: HealthStatus
    mapsApi?: HealthStatus
    supabase?: HealthStatus
  }
}

/**
 * Check if Gemini API is accessible
 */
export async function checkGeminiApiHealth(apiKey?: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  if (!apiKey) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'GEMINI_API_KEY not configured'
    }
  }

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })
    
    // Simple test call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Health check - respond with 'OK'"
    })

    const responseTime = Date.now() - startTime
    
    if (response.text && response.text.toLowerCase().includes('ok')) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: { model: 'gemini-2.5-flash' }
      }
    } else {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        error: 'Unexpected response format'
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if Weather API is accessible
 */
export async function checkWeatherApiHealth(apiKey?: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  if (!apiKey) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'WEATHER_API_KEY not configured'
    }
  }

  try {
    // Test with a simple geocoding request
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=London&limit=1&appid=${apiKey}`,
      { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    const responseTime = Date.now() - startTime

    if (response.ok) {
      const data = await response.json()
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: { 
          service: 'OpenWeatherMap',
          testLocation: 'London',
          dataReceived: Array.isArray(data) && data.length > 0
        }
      }
    } else {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if Maps API is accessible
 */
export async function checkMapsApiHealth(apiKey?: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  if (!apiKey) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'MAPS_API_KEY not configured'
    }
  }

  try {
    // Test with a simple geocoding request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${apiKey}`,
      { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    const responseTime = Date.now() - startTime

    if (response.ok) {
      const data = await response.json()
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: { 
          service: 'Google Maps',
          testLocation: 'New York',
          status: data.status
        }
      }
    } else {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if Supabase is accessible
 */
export async function checkSupabaseHealth(url?: string, key?: string): Promise<HealthStatus> {
  const startTime = Date.now()
  
  if (!url || !key) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'SUPABASE_URL or SUPABASE_KEY not configured'
    }
  }

  try {
    // Test with a simple query
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime,
        details: { 
          service: 'Supabase',
          url: url
        }
      }
    } else {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Perform comprehensive health check for an agent
 */
export async function performAgentHealthCheck(agentName: string): Promise<AgentHealthCheck> {
  const geminiApiKey = process.env.GEMINI_API_KEY
  const weatherApiKey = process.env.WEATHER_API_KEY
  const mapsApiKey = process.env.MAPS_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  // Check all dependencies in parallel
  const [geminiHealth, weatherHealth, mapsHealth, supabaseHealth] = await Promise.allSettled([
    checkGeminiApiHealth(geminiApiKey),
    checkWeatherApiHealth(weatherApiKey),
    checkMapsApiHealth(mapsApiKey),
    checkSupabaseHealth(supabaseUrl, supabaseKey)
  ])

  // Determine overall agent health
  const dependencies = {
    geminiApi: geminiHealth.status === 'fulfilled' ? geminiHealth.value : {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    },
    weatherApi: weatherHealth.status === 'fulfilled' ? weatherHealth.value : undefined,
    mapsApi: mapsHealth.status === 'fulfilled' ? mapsHealth.value : undefined,
    supabase: supabaseHealth.status === 'fulfilled' ? supabaseHealth.value : undefined
  }

  // Determine overall status
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  
  if (dependencies.geminiApi.status === 'unhealthy') {
    overallStatus = 'unhealthy' // Gemini is critical
  } else if (dependencies.geminiApi.status === 'degraded') {
    overallStatus = 'degraded'
  }

  // Check if any optional services are unhealthy
  const optionalServices = [dependencies.weatherApi, dependencies.mapsApi, dependencies.supabase]
  const unhealthyOptional = optionalServices.filter(service => 
    service && service.status === 'unhealthy'
  ).length

  if (unhealthyOptional > 0 && overallStatus === 'healthy') {
    overallStatus = 'degraded'
  }

  return {
    agentName,
    status: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      details: {
        totalDependencies: 4,
        healthyDependencies: [
          dependencies.geminiApi,
          dependencies.weatherApi,
          dependencies.mapsApi,
          dependencies.supabase
        ].filter(dep => dep && dep.status === 'healthy').length
      }
    },
    dependencies
  }
}

/**
 * Get system-wide health status
 */
export async function getSystemHealthStatus(): Promise<{
  overall: 'healthy' | 'unhealthy' | 'degraded'
  agents: AgentHealthCheck[]
  timestamp: string
}> {
  const agents = ['weather', 'currentEvents', 'historicEvents', 'organizerScoring']
  
  const agentHealthChecks = await Promise.allSettled(
    agents.map(agent => performAgentHealthCheck(agent))
  )

  const successfulChecks = agentHealthChecks
    .filter((result): result is PromiseFulfilledResult<AgentHealthCheck> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value)

  const failedChecks = agentHealthChecks
    .filter((result): result is PromiseRejectedResult => 
      result.status === 'rejected'
    )

  // Determine overall system health
  let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  
  if (successfulChecks.some(check => check.status.status === 'unhealthy')) {
    overall = 'unhealthy'
  } else if (successfulChecks.some(check => check.status.status === 'degraded') || failedChecks.length > 0) {
    overall = 'degraded'
  }

  return {
    overall,
    agents: successfulChecks,
    timestamp: new Date().toISOString()
  }
}
