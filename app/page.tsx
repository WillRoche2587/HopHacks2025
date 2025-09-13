'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarTrigger 
} from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Heart,
  CheckCircle,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Leaf,
  Users,
  MapPin,
  DollarSign,
  X,
  AlertCircle,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingSpinner from '@/components/LoadingSpinner'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Types
interface EventFormData {
  eventType: string
  location: string
  date: string
  duration: string
  expectedAttendance: number
  budget: number
  audience: string
  specialRequirements: string
}

interface AnalysisResults {
  weatherAnalysis: string
  currentEventsAnalysis: string
  historicAnalysis: string
  organizerScoring: string
  overallScore: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PreviousEvent {
  id: string
  title: string
  location: string
  date: string
  duration: string
  attendance: number
  budget: number
  audience: string
  notes: string
  impactScore: number
}

export default function CharityAI() {
  // State management
  const [activeTab, setActiveTab] = useState<'analysis' | 'previous' | 'assistant' | 'settings'>('analysis')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [eventForm, setEventForm] = useState<EventFormData>({
    eventType: '',
    location: '',
    date: '',
    duration: '',
    expectedAttendance: 0,
    budget: 0,
    audience: '',
    specialRequirements: ''
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [previousEvents, setPreviousEvents] = useState<PreviousEvent[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize user session and dark mode
  useEffect(() => {
    const initializeUser = async () => {
      // Use mock user ID for now (bypassing Supabase)
      setUserId('mock-user-id')
    }

    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode))
    }

    initializeUser()
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Load previous events
  useEffect(() => {
    const loadPreviousEvents = async () => {
      try {
        setIsLoadingEvents(true)
        setError(null)
        
        // Use mock data for now (bypassing Supabase)
        const mockEvents: PreviousEvent[] = [
          {
            id: '1',
            title: 'Community Food Drive',
            location: 'Downtown Community Center',
            date: '2024-01-15',
            duration: '4 hours',
            attendance: 150,
            budget: 5000,
            audience: 'Community members',
            notes: 'Successfully collected 500+ food items',
            impactScore: 92
          },
          {
            id: '2',
            title: 'Volunteer Cleanup Day',
            location: 'Riverside Park',
            date: '2024-03-10',
            duration: '3 hours',
            attendance: 75,
            budget: 2000,
            audience: 'Volunteers and families',
            notes: 'Cleaned 2 miles of riverbank',
            impactScore: 85
          },
          {
            id: '3',
            title: 'Environmental Awareness Walk',
            location: 'Central Park',
            date: '2024-04-22',
            duration: '2 hours',
            attendance: 120,
            budget: 3000,
            audience: 'Environmental activists',
            notes: 'Raised awareness about climate change',
            impactScore: 78
          },
          {
            id: '4',
            title: 'Youth Sports Tournament',
            location: 'Community Sports Complex',
            date: '2024-05-18',
            duration: '6 hours',
            attendance: 45,
            budget: 4500,
            audience: 'Youth and families',
            notes: 'Lower than expected turnout due to competing events',
            impactScore: 62
          },
          {
            id: '5',
            title: 'Senior Center Bingo Night',
            location: 'Sunset Senior Center',
            date: '2024-06-12',
            duration: '3 hours',
            attendance: 25,
            budget: 800,
            audience: 'Senior citizens',
            notes: 'Poor weather affected attendance significantly',
            impactScore: 45
          },
          {
            id: '6',
            title: 'Book Drive for Schools',
            location: 'Local Library',
            date: '2024-07-08',
            duration: '4 hours',
            attendance: 35,
            budget: 1200,
            audience: 'Parents and educators',
            notes: 'Limited promotion led to minimal participation',
            impactScore: 38
          }
        ]
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setPreviousEvents(mockEvents)
      } catch (error) {
        console.error('Error loading previous events:', error)
        setError('Failed to load previous events. Please try again.')
      } finally {
        setIsLoadingEvents(false)
      }
    }

    loadPreviousEvents()
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Form handlers
  const handleInputChange = (field: keyof EventFormData, value: string | number) => {
    setEventForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)
    setError(null)

    try {
      // Run all agents in parallel
      const [weatherResult, currentEventsResult, historicResult] = await Promise.all([
        callAgent('weather', eventForm),
        callAgent('currentEvents', eventForm),
        callAgent('historicEvents', eventForm)
      ])

      // Run organizer scoring agent
      const scoringResult = await callAgent('organizerScoring', {
        weatherAnalysis: weatherResult,
        currentEventsAnalysis: currentEventsResult,
        historicAnalysis: historicResult,
        eventDetails: eventForm
      })

      // Calculate overall score (mock for now)
      const overallScore = Math.floor(Math.random() * 30) + 70

      setAnalysisResults({
        weatherAnalysis: weatherResult,
        currentEventsAnalysis: currentEventsResult,
        historicAnalysis: historicResult,
        organizerScoring: scoringResult,
        overallScore
      })

      // Save event to database
      await saveEventToDatabase(eventForm)

    } catch (error) {
      console.error('Error processing analysis:', error)
      setError('Failed to analyze event. Please check your connection and try again.')
    } finally {
      setIsAnalyzing(false)
    }
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
          eventId: 'current-event',
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

  const saveEventToDatabase = async (eventData: EventFormData) => {
    // Skip database save for now (bypassing Supabase)
    console.log('Event data (mock save):', eventData)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await callAgent('aiAssistant', { message: chatInput })
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error in chat:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit(e as any)
    }
  }

  const getImpactScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getImpactScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getOverallScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <ErrorBoundary>
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-background`}>
      <SidebarProvider>
      {/* Sidebar Navigation */}
      <Sidebar className="hidden lg:block">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold font-space-grotesk text-primary-600">
                CharityAI
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="flex items-center space-x-1"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button
                variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('analysis')}
                aria-label="Navigate to Event Analysis"
                aria-current={activeTab === 'analysis' ? 'page' : undefined}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Event Analysis
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <Button
                variant={activeTab === 'previous' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('previous')}
                aria-label="Navigate to Previous Events"
                aria-current={activeTab === 'previous' ? 'page' : undefined}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Previous Events
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <Button
                variant={activeTab === 'assistant' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('assistant')}
                aria-label="Navigate to AI Assistant"
                aria-current={activeTab === 'assistant' ? 'page' : undefined}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
                aria-label="Navigate to Settings"
                aria-current={activeTab === 'settings' ? 'page' : undefined}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary-600" />
              <h1 className="text-lg font-bold font-space-grotesk text-primary-600">
                CharityAI
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="flex items-center space-x-1"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <SidebarTrigger className="lg:hidden">
                <BarChart3 className="h-5 w-5" />
              </SidebarTrigger>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setError(null)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </Alert>
          )}

          {/* Event Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Event Details Title */}
              <div>
                <h2 className="text-2xl font-bold mb-2">Event Details</h2>
                <p className="text-muted-foreground">
                  Provide details about your charitable event for comprehensive AI analysis
                </p>
              </div>

              {/* Event Details Form */}
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventType">Event Type *</Label>
                        <Input
                          id="eventType"
                          value={eventForm.eventType}
                          onChange={(e) => handleInputChange('eventType', e.target.value)}
                          placeholder="e.g., Community Food Drive"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={eventForm.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g., Downtown Community Center"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                          id="duration"
                          value={eventForm.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                          placeholder="e.g., Full day, 4 hours"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="expectedAttendance">Expected Attendance *</Label>
                        <Input
                          id="expectedAttendance"
                          type="number"
                          value={eventForm.expectedAttendance || ''}
                          onChange={(e) => handleInputChange('expectedAttendance', parseInt(e.target.value) || 0)}
                          placeholder="e.g., 250"
                          min="1"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="budget">Budget ($)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={eventForm.budget || ''}
                          onChange={(e) => handleInputChange('budget', parseInt(e.target.value) || 0)}
                          placeholder="e.g., 15000"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="audience">Target Audience</Label>
                      <Input
                        id="audience"
                        value={eventForm.audience}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        placeholder="e.g., Community members, families"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="specialRequirements">Special Requirements</Label>
                      <Textarea
                        id="specialRequirements"
                        value={eventForm.specialRequirements}
                        onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                        placeholder="e.g., Volunteer coordination"
                        rows={2}
                      />
      </div>

                    <Button 
                      type="submit" 
                      disabled={isAnalyzing} 
                      className="w-full"
                      aria-describedby="analyze-description"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="loading-dots mr-2" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                          <span aria-live="polite">Analyzing...</span>
                        </>
                      ) : (
                        'Analyze Event'
                      )}
                    </Button>
                    <p id="analyze-description" className="sr-only">
                      Submit your event details for comprehensive AI analysis including weather, current events, historical data, and recommendations.
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResults && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card className="border-primary-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary-600 mb-2">
                          {analysisResults.overallScore}/100
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Based on comprehensive AI analysis
                        </p>
                        {/* Score Chart */}
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Overall Score</span>
                          <span className={getOverallScoreColor(analysisResults.overallScore)}>
                            {analysisResults.overallScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getOverallScoreBgColor(analysisResults.overallScore)}`}
                            style={{ width: `${analysisResults.overallScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Agent Results Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weather Analysis */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-lg">Weather Analysis</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer 
                          content={analysisResults.weatherAnalysis}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>

                    {/* Current Events Analysis */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">Current Events Analysis</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer 
                          content={analysisResults.currentEventsAnalysis}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>

                    {/* Historical Analysis */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <CardTitle className="text-lg">Historical Analysis</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer 
                          content={analysisResults.historicAnalysis}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>

                    {/* Comprehensive Recommendations */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <CardTitle className="text-lg">Comprehensive Recommendations</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <MarkdownRenderer 
                          content={analysisResults.organizerScoring}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>
            </div>
          </div>
        )}

              {/* Default Insights */}
              {!analysisResults && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Quick Insights</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-primary-600" />
                          <span className="text-sm">Weather-optimized planning</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-primary-600" />
                          <span className="text-sm">Timing recommendations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Leaf className="h-4 w-4 text-primary-600" />
                          <span className="text-sm">Sustainability insights</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-primary-600" />
                          <span className="text-sm">Community engagement</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <span>What You'll Get</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Comprehensive analysis covering weather conditions, competing events, 
                          historical patterns, and actionable recommendations to maximize your 
                          charitable event's impact and success.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                  )}
                </div>
              )}

          {/* Previous Events Tab */}
          {activeTab === 'previous' && (
            <div className="space-y-6">
                    <div>
                <h2 className="text-2xl font-bold mb-2">Previous Events</h2>
                <p className="text-muted-foreground">
                  Review your past charitable events and their impact scores
                </p>
                    </div>

              {isLoadingEvents ? (
                <LoadingSpinner message="Loading previous events..." showSkeleton={true} />
              ) : previousEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Previous Events</h3>
                      <p>Start by analyzing your first charitable event to see it here.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previousEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{event.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event.attendance} attendees</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>${event.budget.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Audience:</strong> {event.audience}
                        </div>
                        {event.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {event.notes}
                    </div>
                  )}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Impact Score</span>
                            <span className={getImpactScoreColor(event.impactScore)}>
                              {event.impactScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getImpactScoreBgColor(event.impactScore)}`}
                              style={{ width: `${event.impactScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                    </div>
                  )}
                </div>
              )}
              
          {/* AI Assistant Tab */}
          {activeTab === 'assistant' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">AI Assistant</h2>
                <p className="text-muted-foreground">
                  Ask me anything about charitable event planning
                </p>
              </div>

              <Card className="h-[600px]">
                <CardHeader className="bg-muted">
                  <CardTitle>CharityAI Assistant</CardTitle>
                  <CardDescription>
                    Ask me anything about charitable event planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-6">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Welcome to CharityAI Assistant!</h3>
                          <p className="text-sm">
                            I can help you with event planning, volunteer management, fundraising strategies, and more.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="p-3 bg-muted rounded-lg">
                            <strong>Event Planning</strong>
                            <p className="text-xs mt-1">Logistics, timelines, checklists</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <strong>Volunteer Management</strong>
                            <p className="text-xs mt-1">Recruitment, coordination, retention</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <strong>Fundraising</strong>
                            <p className="text-xs mt-1">Strategies, donor engagement</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <strong>Marketing</strong>
                            <p className="text-xs mt-1">Promotion, social media, outreach</p>
              </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <div className="text-sm">
                                {message.role === 'assistant' ? (
                                  <MarkdownRenderer 
                                    content={message.content}
                                    className="text-sm"
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                )}
                              </div>
                              <p className="text-xs opacity-60 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
            </div>
          </div>
        ))}
                        {isChatLoading && (
          <div className="flex justify-start">
                            <div className="bg-muted text-muted-foreground p-3 rounded-lg">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
                              <p className="text-xs opacity-60 mt-1">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="p-6 border-t">
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me about event planning..."
                        disabled={isChatLoading}
                        className="flex-1"
                        aria-label="Chat input"
                        aria-describedby="chat-help"
                      />
                      <Button 
                        type="submit" 
                        disabled={!chatInput.trim() || isChatLoading}
                        aria-label="Send message"
                      >
                        Send
                      </Button>
                    </form>
                    <p id="chat-help" className="sr-only">
                      Type your question and press Enter or click Send to get AI assistance with event planning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Settings</h2>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input id="orgName" defaultValue="Charity Organization" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="contact@charity.org" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" defaultValue="UTC-5 (EST)" />
                    </div>
                    <Button className="w-full">Save Changes</Button>
                  </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="emailNotifications" defaultChecked />
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="weatherAlerts" defaultChecked />
                      <Label htmlFor="weatherAlerts">Weather Alerts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="eventReminders" defaultChecked />
                      <Label htmlFor="eventReminders">Event Reminders</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* API Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="weatherApiKey">Weather API Key</Label>
                      <Input id="weatherApiKey" type="password" defaultValue="••••••••••••••••" />
                      <p className="text-xs text-muted-foreground mt-1">
                        For weather data and forecasts
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                      <Input id="geminiApiKey" type="password" defaultValue="••••••••••••••••" />
                      <p className="text-xs text-muted-foreground mt-1">
                        For AI analysis and recommendations
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">Test Connections</Button>
                      <Button className="flex-1">Save API Keys</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Data & Privacy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="dataCollection" defaultChecked />
                      <Label htmlFor="dataCollection">Allow Data Collection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="analytics" defaultChecked />
                      <Label htmlFor="analytics">Analytics</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">Export Data</Button>
                      <Button variant="destructive" className="flex-1">Delete Account</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      </SidebarProvider>
      </div>
    </ErrorBoundary>
  )
}
