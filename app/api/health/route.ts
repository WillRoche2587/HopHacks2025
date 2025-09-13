import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealthStatus, performAgentHealthCheck } from '@/lib/utils/healthCheck'

/**
 * Health Check API Endpoint
 * GET /api/health - Get overall system health
 * GET /api/health?agent=<agentName> - Get specific agent health
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentName = searchParams.get('agent')

    if (agentName) {
      // Check specific agent health
      const agentHealth = await performAgentHealthCheck(agentName)
      
      return NextResponse.json({
        success: true,
        data: agentHealth,
        timestamp: new Date().toISOString()
      })
    } else {
      // Get overall system health
      const systemHealth = await getSystemHealthStatus()
      
      return NextResponse.json({
        success: true,
        data: systemHealth,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for health checks.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for health checks.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET for health checks.' },
    { status: 405 }
  )
}
