import { NextRequest, NextResponse } from 'next/server'
import { run as weatherAgent } from '@/lib/agents/weatherAgent'
import { run as currentEventsAgent } from '@/lib/agents/currentEventsAgent'
import { run as historicEventsAgent } from '@/lib/agents/historicEventsAgent'
import { run as organizerScoringAgent } from '@/lib/agents/organizerScoringAgent'
import { supabaseAdmin } from '@/lib/supabaseClient'

/**
 * API Route Handler for Agent Operations
 * Handles POST requests to execute different AI agents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent, payload, eventId, userId } = body

    if (!agent || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: agent and payload' },
        { status: 400 }
      )
    }

    // Validate agent type
    const validAgents = ['weather', 'currentEvents', 'historicEvents', 'organizerScoring']
    if (!validAgents.includes(agent)) {
      return NextResponse.json(
        { error: `Invalid agent type. Must be one of: ${validAgents.join(', ')}` },
        { status: 400 }
      )
    }

    let result: string

    // Route to appropriate agent
    switch (agent) {
      case 'weather':
        result = await weatherAgent(payload)
        break
      case 'currentEvents':
        result = await currentEventsAgent(payload)
        break
      case 'historicEvents':
        result = await historicEventsAgent(payload)
        break
      case 'organizerScoring':
        result = await organizerScoringAgent(payload)
        break
      default:
        return NextResponse.json(
          { error: 'Unknown agent type' },
          { status: 400 }
        )
    }

    // Store result in database if eventId and userId are provided
    if (eventId && userId) {
      try {
        const { error } = await supabaseAdmin
          .from('agent_results')
          .insert({
            event_id: eventId,
            agent_name: agent,
            response_text: result,
            user_id: userId
          })

        if (error) {
          console.error('Database insert error:', error)
          // Don't fail the request if database insert fails
        }
      } catch (dbError) {
        console.error('Database operation error:', dbError)
        // Don't fail the request if database operation fails
      }
    }

    return NextResponse.json({
      success: true,
      agent,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Agent API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to execute agents.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to execute agents.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to execute agents.' },
    { status: 405 }
  )
}
