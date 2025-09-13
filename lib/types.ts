/**
 * Type definitions for the Community Event Impact Predictor
 */

export interface EventDetails {
  eventType: string
  location: string
  date: string
  expectedAttendance?: number
  budget?: number
}

export interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  agent?: string
}

export interface ActualsData {
  attendance: number
  cost: number
  revenue?: number
  weather: string
  issues: string[]
  notes: string
  submitted_at?: string
}

export interface AgentPayload {
  location?: string
  date?: string
  eventType?: string
  expectedAttendance?: number
  budget?: number
  weatherAnalysis?: string
  currentEventsAnalysis?: string
  historicAnalysis?: string
  eventDetails?: EventDetails
}

export interface AgentResponse {
  success: boolean
  agent: string
  result: string
  timestamp: string
  error?: string
  message?: string
}

export interface WeatherData {
  temperature: number
  humidity: number
  conditions: string
  recommendations: string[]
}

export interface CurrentEventsData {
  competingEvents: Array<{
    title: string
    venue: string
    expectedAttendance: number
    time: string
  }>
  trafficConditions: {
    congestionLevel: string
    expectedTravelTime: string
    parkingAvailability: string
  }
}

export interface HistoricalData {
  averageAttendance: number
  averageBudget: number
  successRate: number
  bestWeather: string
  commonIssues: string[]
}

export interface ScoringData {
  overallScore: number
  scoreCategory: string
  criticalIssues: string[]
  strengths: string[]
  recommendations: string[]
  riskAssessment: string[]
  successProbability: number
}

export type AgentType = 'weather' | 'currentEvents' | 'historicEvents' | 'organizerScoring'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          input_params: any
          actuals: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_params: any
          actuals?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_params?: any
          actuals?: any
          created_at?: string
          updated_at?: string
        }
      }
      agent_results: {
        Row: {
          id: string
          event_id: string
          agent_name: string
          response_text: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          agent_name: string
          response_text: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          agent_name?: string
          response_text?: string
          created_at?: string
        }
      }
    }
  }
}
