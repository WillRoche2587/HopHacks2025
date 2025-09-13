'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import EventInputForm, { EventFormData } from '@/components/EventInputForm'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  agent?: string
  structuredData?: {
    summary: string
    findings: string[]
    recommendations: string[]
    risks: string[]
    opportunities: string[]
    confidence: number
    metadata?: any
  }
}

// EventDetails is now handled by EventFormData from the form component

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<EventFormData | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize user session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        } else {
          // Create anonymous user for demo
          const { data, error } = await supabase.auth.signInAnonymously()
          if (data.user) {
            setUserId(data.user.id)
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    initializeUser()
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (type: 'user' | 'ai', content: string, agent?: string, structuredData?: any) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      agent,
      structuredData
    }
    setMessages(prev => [...prev, newMessage])
  }

  const callAgent = async (agent: string, payload: any) => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent,
          payload,
          eventId: currentEvent ? 'current-event' : null,
          userId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error(`Error calling ${agent} agent:`, error)
      return `Error: Unable to get ${agent} analysis. Please try again.`
    }
  }

  const callAgentWithStructuredResponse = async (agent: string, payload: any) => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent,
          payload,
          eventId: currentEvent ? 'current-event' : null,
          userId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Try to parse as structured response
      try {
        const structuredData = JSON.parse(data.result)
        if (structuredData.agent && structuredData.summary) {
          return { structured: true, data: structuredData }
        }
      } catch (parseError) {
        // Not a structured response, return as plain text
      }
      
      return { structured: false, data: data.result }
    } catch (error) {
      console.error(`Error calling ${agent} agent:`, error)
      return { structured: false, data: `Error: Unable to get ${agent} analysis. Please try again.` }
    }
  }

  const handleFormSubmit = async (formData: EventFormData) => {
    setIsLoading(true)
    setCurrentEvent(formData)

    // Add user message showing the event details
    const eventSummary = `${formData.eventType} in ${formData.location} on ${formData.date} for ${formData.expectedAttendance} attendees`
    addMessage('user', eventSummary)

    try {
      addMessage('ai', 'Starting comprehensive event analysis...', 'System')

      // Run all agents in parallel with the structured form data
      const [weatherResult, currentEventsResponse, historicResult] = await Promise.all([
        callAgent('weather', formData),
        callAgentWithStructuredResponse('currentEvents', formData),
        callAgent('historicEvents', formData)
      ])

      // Add individual agent results
      addMessage('ai', weatherResult, 'Weather Agent')
      
      // Handle structured response for current events
      if (currentEventsResponse.structured) {
        const structuredData = currentEventsResponse.data
        addMessage('ai', structuredData.summary, 'Current Events Agent', structuredData)
      } else {
        addMessage('ai', currentEventsResponse.data, 'Current Events Agent')
      }
      
      addMessage('ai', historicResult, 'Historical Events Agent')

      // Run organizer scoring agent with all results
      const scoringResult = await callAgent('organizerScoring', {
        weatherAnalysis: weatherResult,
        currentEventsAnalysis: currentEventsResponse.structured ? currentEventsResponse.data.rawAnalysis : currentEventsResponse.data,
        historicAnalysis: historicResult,
        eventDetails: formData
      })

      addMessage('ai', scoringResult, 'Organizer Scoring Agent')

    } catch (error) {
      console.error('Error processing request:', error)
      addMessage('ai', 'Sorry, I encountered an error while processing your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Removed parseEventDetails - now using structured form input

  const clearChat = () => {
    setMessages([])
    setCurrentEvent(null)
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Philanthropic Event Impact Predictor
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered analysis for charity events, fundraisers, and community service initiatives
            </p>
          </div>
          <button
            onClick={clearChat}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </header>

      {/* Current Event Display */}
      {currentEvent && (
        <div className="bg-blue-50 border-b px-6 py-3">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Current Event Analysis:</h3>
          <div className="text-sm text-blue-800">
            <span className="font-medium">{currentEvent.eventType}</span> in{' '}
            <span className="font-medium">{currentEvent.location}</span> on{' '}
            <span className="font-medium">{currentEvent.date}</span>
            {currentEvent.expectedAttendance && (
              <span> • {currentEvent.expectedAttendance} expected attendees</span>
            )}
            {currentEvent.budget && (
              <span> • ${currentEvent.budget.toLocaleString()} budget</span>
            )}
          </div>
        </div>
      )}

      {/* Event Input Form */}
      <div className="px-6 py-4">
        <EventInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <h3 className="text-lg font-medium mb-2">Welcome to the Philanthropic Event Impact Predictor!</h3>
            <p className="mb-4">
              Fill out the form above with your charity event details and I'll provide comprehensive analysis to help maximize your social impact, 
              including weather considerations, community engagement opportunities, and success predictions.
            </p>
            <div className="text-sm text-gray-400 space-y-2">
              <p><strong>What you'll get:</strong></p>
              <p>• Weather analysis for outdoor charity events</p>
              <p>• Community engagement and volunteer coordination insights</p>
              <p>• Historical philanthropic event performance data</p>
              <p>• Impact maximization and readiness assessment</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-message ${
                message.type === 'user' ? 'user-message' : 'ai-message'
              }`}
            >
              {message.agent && (
                <div className="text-xs font-medium mb-2 opacity-75">
                  {message.agent}
                  {message.structuredData && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Confidence: {message.structuredData.confidence}%
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Display structured data if available */}
              {message.structuredData && (
                <div className="mt-3 space-y-2">
                  {message.structuredData.findings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-1">Key Findings:</h4>
                      <ul className="text-sm space-y-1">
                        {message.structuredData.findings.slice(0, 3).map((finding, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.structuredData.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-700 mb-1">Recommendations:</h4>
                      <ul className="text-sm space-y-1">
                        {message.structuredData.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.structuredData.risks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-700 mb-1">Risks:</h4>
                      <ul className="text-sm space-y-1">
                        {message.structuredData.risks.slice(0, 2).map((risk, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-500 mr-2">⚠</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-message ai-message">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="text-xs opacity-60 mt-2">Analyzing...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {/* Removed old input form - now using structured form above */}
    </div>
  )
}
