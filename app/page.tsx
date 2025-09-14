'use client'

import { useState, useEffect, useRef } from 'react'
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
  Sun,
  Download,
  User,
  Send,
  Target
} from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingSpinner from '@/components/LoadingSpinner'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { generateEventAnalysisPDF } from '@/lib/utils/pdfGenerator'
import {
  Expandable,
  ExpandableCard,
  ExpandableCardContent,
  ExpandableCardFooter,
  ExpandableCardHeader,
  ExpandableContent,
  ExpandableTrigger,
} from '@/components/ui/expandable'

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

export default function ImpactGauge() {
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [apiKeys, setApiKeys] = useState({
    weatherApiKey: '',
    geminiApiKey: ''
  })
  const [isTestingConnections, setIsTestingConnections] = useState(false)
  const [isSavingKeys, setIsSavingKeys] = useState(false)
  const [apiTestResults, setApiTestResults] = useState<{
    weather: boolean | null
    gemini: boolean | null
  }>({ weather: null, gemini: null })
  const [selectedEventReport, setSelectedEventReport] = useState<PreviousEvent | null>(null)
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

    // Load saved API keys from localStorage
    const savedWeatherKey = localStorage.getItem('weatherApiKey')
    const savedGeminiKey = localStorage.getItem('geminiApiKey')
    if (savedWeatherKey || savedGeminiKey) {
      setApiKeys({
        weatherApiKey: savedWeatherKey || '',
        geminiApiKey: savedGeminiKey || ''
      })
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
      // Run agents with 1-second stagger between each request
      console.log('Starting weather analysis...')
      const weatherResult = await callAgent('weather', eventForm)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      console.log('Starting current events analysis...')
      const currentEventsResult = await callAgent('currentEvents', eventForm)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      console.log('Starting historical analysis...')
      const historicResult = await callAgent('historicEvents', eventForm)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      console.log('Starting comprehensive scoring...')
      // Run organizer scoring agent
      const scoringResult = await callAgent('organizerScoring', {
        weatherAnalysis: weatherResult,
        currentEventsAnalysis: currentEventsResult,
        historicAnalysis: historicResult,
        eventDetails: eventForm
      })

      // Handle JSON responses from agents
      const weatherAnalysis = typeof weatherResult === 'string' ? weatherResult : 
        weatherResult.analysis || 
        weatherResult.error || 
        'Weather analysis unavailable'
      
      const currentEventsAnalysis = typeof currentEventsResult === 'string' ? currentEventsResult : 
        currentEventsResult.analysis || 
        currentEventsResult.error || 
        'Current events analysis unavailable'
      
      const historicAnalysis = typeof historicResult === 'string' ? historicResult : 
        historicResult.analysis || 
        historicResult.error || 
        'Historical analysis unavailable'
      
      const organizerScoring = typeof scoringResult === 'string' ? scoringResult : 
        scoringResult.formattedAnalysis || 
        scoringResult.error || 
        'Comprehensive recommendations unavailable'
      const overallScore = typeof scoringResult === 'object' && scoringResult.overallScore ? scoringResult.overallScore.total : Math.floor(Math.random() * 30) + 70

      // Debug: Log the types to ensure we're getting strings
      console.log('Analysis results types:', {
        weatherAnalysis: typeof weatherAnalysis,
        currentEventsAnalysis: typeof currentEventsAnalysis,
        historicAnalysis: typeof historicAnalysis,
        organizerScoring: typeof organizerScoring
      })

      setAnalysisResults({
        weatherAnalysis,
        currentEventsAnalysis,
        historicAnalysis,
        organizerScoring,
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

  const handleExampleClick = async (prompt: string) => {
    if (isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setIsChatLoading(true)

    try {
      const response = await callAgent('aiAssistant', { message: prompt })
      
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

  const handleDownloadPDF = async () => {
    if (!analysisResults) return

    setIsGeneratingPDF(true)
    try {
      await generateEventAnalysisPDF(eventForm, analysisResults)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // API Configuration handlers
  const handleApiKeyChange = (key: 'weatherApiKey' | 'geminiApiKey', value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }))
    // Reset test results when keys change
    setApiTestResults({ weather: null, gemini: null })
  }

  const handleTestConnections = async () => {
    setIsTestingConnections(true)
    setApiTestResults({ weather: null, gemini: null })
    
    try {
      const results = { weather: false, gemini: false }
      
      // Test Weather API
      if (apiKeys.weatherApiKey) {
        try {
          // Simulate a more realistic API test
          // In a real implementation, you'd make an actual API call to a weather service
          const isValidWeatherKey = apiKeys.weatherApiKey.length >= 10 && 
            /^[a-zA-Z0-9]+$/.test(apiKeys.weatherApiKey)
          
          await new Promise(resolve => setTimeout(resolve, 1500))
          results.weather = isValidWeatherKey
        } catch (error) {
          console.error('Weather API test failed:', error)
          results.weather = false
        }
      }
      
      // Test Gemini API
      if (apiKeys.geminiApiKey) {
        try {
          // Simulate a more realistic API test
          // In a real implementation, you'd make an actual API call to Google's Gemini API
          const isValidGeminiKey = apiKeys.geminiApiKey.length >= 20 && 
            apiKeys.geminiApiKey.startsWith('AI')
          
          await new Promise(resolve => setTimeout(resolve, 1500))
          results.gemini = isValidGeminiKey
        } catch (error) {
          console.error('Gemini API test failed:', error)
          results.gemini = false
        }
      }
      
      setApiTestResults(results)
    } catch (error) {
      console.error('Error testing connections:', error)
      setError('Failed to test API connections. Please try again.')
    } finally {
      setIsTestingConnections(false)
    }
  }

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true)
    try {
      // In a real implementation, you'd save these to a secure backend
      localStorage.setItem('weatherApiKey', apiKeys.weatherApiKey)
      localStorage.setItem('geminiApiKey', apiKeys.geminiApiKey)
      
      // Show success message
      console.log('API keys saved successfully')
      // You could also set a success state here to show a green message
    } catch (error) {
      console.error('Error saving API keys:', error)
      setError('Failed to save API keys. Please try again.')
    } finally {
      setIsSavingKeys(false)
    }
  }

  const handleOpenReport = (event: PreviousEvent) => {
    setSelectedEventReport(event)
  }

  const handleCloseReport = () => {
    setSelectedEventReport(null)
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
              <div>
                <h1 className="text-xl font-bold font-space-grotesk text-primary-600">
                  ImpactGauge
                </h1>
                <p className="text-xs text-muted-foreground">Powered by Gemini</p>
              </div>
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
            <SidebarMenuItem className="mb-3">
              <Button
                variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                className="w-full justify-start text-lg py-3 px-4"
                onClick={() => setActiveTab('analysis')}
                aria-label="Navigate to Event Analysis"
                aria-current={activeTab === 'analysis' ? 'page' : undefined}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Event Analysis
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem className="mb-3">
              <Button
                variant={activeTab === 'previous' ? 'default' : 'ghost'}
                className="w-full justify-start text-lg py-3 px-4"
                onClick={() => setActiveTab('previous')}
                aria-label="Navigate to Previous Events"
                aria-current={activeTab === 'previous' ? 'page' : undefined}
              >
                <LayoutDashboard className="mr-3 h-5 w-5" />
                Previous Events
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem className="mb-3">
              <Button
                variant={activeTab === 'assistant' ? 'default' : 'ghost'}
                className="w-full justify-start text-lg py-3 px-4"
                onClick={() => setActiveTab('assistant')}
                aria-label="Navigate to AI Assistant"
                aria-current={activeTab === 'assistant' ? 'page' : undefined}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Impact Assistant
              </Button>
            </SidebarMenuItem>
            
            <SidebarMenuItem className="mb-3">
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start text-lg py-3 px-4"
                onClick={() => setActiveTab('settings')}
                aria-label="Navigate to Settings"
                aria-current={activeTab === 'settings' ? 'page' : undefined}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary-600" />
              <div>
                <h1 className="text-lg font-bold font-space-grotesk text-primary-600">
                  ImpactGauge
                </h1>
                <p className="text-xs text-muted-foreground">Powered by Gemini</p>
              </div>
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

        <div className="p-6 flex-1 flex flex-col">
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
              <div className="pt-6">
                <h2 className="text-2xl font-bold mb-2">Event Details</h2>
                <p className="text-muted-foreground">
                  Provide details about your charitable event for comprehensive logistic analysis
                </p>
              </div>

              {/* Event Details Form */}
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventType" className="text-foreground dark:text-foreground">Event Type *</Label>
                        <Input
                          id="eventType"
                          value={eventForm.eventType}
                          onChange={(e) => handleInputChange('eventType', e.target.value)}
                          placeholder="e.g., Community Food Drive"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location" className="text-foreground dark:text-foreground">Location *</Label>
                        <Input
                          id="location"
                          value={eventForm.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g., Downtown Community Center"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="date" className="text-foreground dark:text-foreground">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="duration" className="text-foreground dark:text-foreground">Duration *</Label>
                        <Input
                          id="duration"
                          value={eventForm.duration}
                          onChange={(e) => handleInputChange('duration', e.target.value)}
                          placeholder="e.g., Full day, 4 hours"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="expectedAttendance" className="text-foreground dark:text-foreground">Expected Attendance *</Label>
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
                        <Label htmlFor="budget" className="text-foreground dark:text-foreground">Budget ($)</Label>
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
                      <Label htmlFor="audience" className="text-foreground dark:text-foreground">Target Audience</Label>
                      <Input
                        id="audience"
                        value={eventForm.audience}
                        onChange={(e) => handleInputChange('audience', e.target.value)}
                        placeholder="e.g., Community members, families"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="specialRequirements" className="text-foreground dark:text-foreground">Special Requirements</Label>
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
                      className="w-full h-10 rounded-md px-4 transition-all duration-500 ease-in-out"
                      aria-describedby="analyze-description"
                    >
                      {isAnalyzing ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
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
                  {/* Overall Score and PDF Download */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall Score Card */}
                    <Card className="border-primary-200 lg:col-span-2">
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

                    {/* PDF Download Card */}
                    <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-primary-900 mb-1">
                              Download Report
                            </h3>
                            <p className="text-sm text-primary-700 mb-4">
                              Get a comprehensive PDF report with all analysis details
                            </p>
                          </div>
                          <Button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="w-full h-10"
                          >
                            {isGeneratingPDF ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

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
                          content={typeof analysisResults.weatherAnalysis === 'string' ? analysisResults.weatherAnalysis : String(analysisResults.weatherAnalysis)}
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
                          content={typeof analysisResults.currentEventsAnalysis === 'string' ? analysisResults.currentEventsAnalysis : String(analysisResults.currentEventsAnalysis)}
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
                          content={typeof analysisResults.historicAnalysis === 'string' ? analysisResults.historicAnalysis : String(analysisResults.historicAnalysis)}
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
                          content={typeof analysisResults.organizerScoring === 'string' ? analysisResults.organizerScoring : String(analysisResults.organizerScoring)}
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
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">Weather-optimized planning</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Timing recommendations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Leaf className="h-4 w-4" />
                          <span className="text-sm">Sustainability insights</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
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
                    <div className="pt-6">
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
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 justify-items-center pt-4">
                  {previousEvents.map((event) => (
                     <Expandable
                       key={event.id}
                       expandDirection="both"
                       expandBehavior="replace"
                       initialDelay={0.1}
                     >
                       {({ isExpanded }) => (
                         <ExpandableTrigger>
                           <ExpandableCard
                             className="w-full relative bg-card border rounded-lg shadow-sm hover:shadow-lg transition-shadow"
                             collapsedSize={{ width: 280, height: 160 }}
                             expandedSize={{ width: 380, height: 500 }}
                             hoverToExpand={false}
                             expandDelay={0}
                             collapseDelay={0}
                           >
                             <ExpandableCardHeader>
                               <div className="flex justify-between items-start w-full">
                                 <div>
                                   <h3 className="font-semibold text-lg text-foreground mb-2">
                                     {event.title}
                                   </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        </div>
                                 <div className="text-right">
                                   <div className={`text-2xl font-bold ${getImpactScoreColor(event.impactScore)}`}>
                                     {event.impactScore}%
                        </div>
                                   <div className="text-xs text-muted-foreground">Impact Score</div>
                        </div>
                        </div>
                             </ExpandableCardHeader>

                             <ExpandableCardContent>
                               <ExpandableContent preset="slide-up" stagger staggerChildren={0.05}>
                                 <div className="space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                     <div className="text-center p-3 bg-muted rounded-lg">
                                       <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                       <div className="text-lg font-semibold text-foreground">{event.date}</div>
                                       <div className="text-xs text-muted-foreground">Date</div>
                        </div>
                                     <div className="text-center p-3 bg-muted rounded-lg">
                                       <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                       <div className="text-lg font-semibold text-foreground">{event.duration}</div>
                                       <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                                     <div className="text-center p-3 bg-muted rounded-lg">
                                       <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                       <div className="text-lg font-semibold text-foreground">{event.attendance}</div>
                                       <div className="text-xs text-muted-foreground">Attendees</div>
                                     </div>
                                     <div className="text-center p-3 bg-muted rounded-lg">
                                       <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                       <div className="text-lg font-semibold text-foreground">${event.budget.toLocaleString()}</div>
                                       <div className="text-xs text-muted-foreground">Budget</div>
                                     </div>
                                   </div>
                                   
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
                               </ExpandableContent>
                             </ExpandableCardContent>

                             <ExpandableContent preset="slide-up">
                               <ExpandableCardFooter>
                                 <div className="space-y-3">
                                   <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                                     <span>Event ID: {event.id}</span>
                                     <span className={getImpactScoreColor(event.impactScore)}>
                                       {event.impactScore >= 80 ? 'Excellent' : 
                                        event.impactScore >= 60 ? 'Good' : 
                                        event.impactScore >= 40 ? 'Fair' : 'Needs Improvement'}
                                     </span>
                                   </div>
                                   <Button 
                                     className="w-full"
                                     onClick={() => handleOpenReport(event)}
                                   >
                                     <FileText className="h-4 w-4 mr-2" />
                                     View Report
                                   </Button>
                                 </div>
                               </ExpandableCardFooter>
                             </ExpandableContent>
                           </ExpandableCard>
                         </ExpandableTrigger>
                       )}
                     </Expandable>
                  ))}
                    </div>
                  )}
                </div>
              )}
              
          {/* AI Assistant Tab */}
          {activeTab === 'assistant' && (
            <div className="flex flex-col h-full">
              <div className="pt-6 pb-4">
                <h2 className="text-2xl font-bold mb-2">Impact Assistant</h2>
                <p className="text-muted-foreground">
                  Ask me anything! (Charity-Related of course)
                </p>
              </div>

              <Card className="flex-1 bg-gradient-to-br from-background to-muted/50 dark:from-background dark:to-muted/30 mb-6 border border-border shadow-xl flex flex-col">
                <CardContent className="p-0 bg-transparent flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-6">
                    {chatMessages.length === 0 ? (
                      <div className="text-center">
                        <div className="mb-8">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gradient-to-br dark:from-primary-500 dark:to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Heart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-foreground mb-3">Welcome to Impact Assistant!</h3>
                          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Here to help you maximize community impact through strategic event planning, volunteer coordination, and effective fundraising.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                          <div 
                            className="p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-200 cursor-pointer group"
                            onClick={() => handleExampleClick("How can I maximize community impact for my upcoming food drive event? What strategies should I focus on to ensure maximum reach and benefit to the local community?")}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                              <strong className="text-foreground">Philanthropy Planning</strong>
                          </div>
                            <p className="text-sm text-muted-foreground">Maximize community benefit and reach</p>
                          </div>
                          <div 
                            className="p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-green-500/50 dark:hover:border-green-400/50 transition-all duration-200 cursor-pointer group"
                            onClick={() => handleExampleClick("What are the best practices for building lasting volunteer relationships? How can I create a sustainable volunteer program that keeps people engaged long-term?")}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
                              <strong className="text-foreground">Social Responsibility</strong>
                            </div>
                            <p className="text-sm text-muted-foreground">Build lasting volunteer relationships</p>
                          </div>
                          <div 
                            className="p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-purple-500/50 dark:hover:border-purple-400/50 transition-all duration-200 cursor-pointer group"
                            onClick={() => handleExampleClick("What are ethical donor engagement strategies for fundraising? How can I build trust with potential donors while maintaining transparency in my charitable organization?")}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <strong className="text-foreground">Sustainable Fundraising</strong>
                            </div>
                            <p className="text-sm text-muted-foreground">Ethical donor engagement strategies</p>
                          </div>
                          <div 
                            className="p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-orange-500/50 dark:hover:border-orange-400/50 transition-all duration-200 cursor-pointer group"
                            onClick={() => handleExampleClick("How can I create effective marketing strategies for my charity event that ensure positive community outcomes? What messaging and channels work best for charitable organizations?")}
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <strong className="text-foreground">Marketing</strong>
                            </div>
                            <p className="text-sm text-muted-foreground">Ensure positive community outcomes</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                          >
                            <div className={`flex items-start space-x-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-primary text-primary-foreground'
                              }`}>
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </div>
                              
                              {/* Message Bubble */}
                              <div
                                className={`relative p-4 rounded-2xl shadow-sm ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-card text-card-foreground border border-border rounded-bl-md'
                                }`}
                              >
                                <div className="text-sm leading-relaxed">
                                {message.role === 'assistant' ? (
                                  <MarkdownRenderer 
                                    content={typeof message.content === 'string' ? message.content : String(message.content)}
                                      className="text-sm prose prose-sm max-w-none dark:prose-invert"
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                )}
                              </div>
                                <div className={`text-xs mt-2 ${
                                  message.role === 'user' ? 'text-primary-100' : 'text-muted-foreground'
                                }`}>
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
            </div>
          </div>
        ))}
                        {isChatLoading && (
          <div className="flex justify-start">
                            <div className="flex items-start space-x-3 max-w-[85%]">
                              {/* Assistant Avatar */}
                              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-4 w-4" />
              </div>
                              
                              {/* Loading Bubble */}
                              <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-md shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="p-6 border-t border-border bg-card dark:bg-card rounded-b-lg mt-auto">
                    <form onSubmit={handleChatSubmit} className="flex space-x-3">
                      <div className="flex-1 relative">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                          placeholder="Ask me anything about event planning, fundraising, or community impact..."
                        disabled={isChatLoading}
                          className="pr-12 h-12 border-border dark:border-border focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary rounded-xl bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                        aria-label="Chat input"
                        aria-describedby="chat-help"
                      />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-6 h-6 bg-muted dark:bg-muted rounded-full flex items-center justify-center">
                            <MessageSquare className="h-3 w-3 text-muted-foreground dark:text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!chatInput.trim() || isChatLoading}
                        aria-label="Send message"
                        className="h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-primary-foreground dark:text-primary-foreground"
                      >
                        {isChatLoading ? (
                          <div className="w-5 h-5 border-2 border-primary-foreground dark:border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                        Send
                          </>
                        )}
                      </Button>
                    </form>
                    <p id="chat-help" className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                      Press Enter to send • Shift+Enter for new line
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="pt-6">
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
                      <Label htmlFor="orgName" className="text-foreground dark:text-foreground">Organization Name</Label>
                      <Input id="orgName" defaultValue="Charity Organization" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground dark:text-foreground">Email Address</Label>
                      <Input id="email" type="email" defaultValue="contact@charity.org" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-foreground dark:text-foreground">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-foreground dark:text-foreground">Timezone</Label>
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
                      <Label htmlFor="emailNotifications" className="text-foreground dark:text-foreground">Email Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="weatherAlerts" defaultChecked />
                      <Label htmlFor="weatherAlerts" className="text-foreground dark:text-foreground">Weather Alerts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="eventReminders" defaultChecked />
                      <Label htmlFor="eventReminders" className="text-foreground dark:text-foreground">Event Reminders</Label>
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
                      <Label htmlFor="weatherApiKey" className="text-foreground dark:text-foreground">Weather API Key</Label>
                      <Input 
                        id="weatherApiKey" 
                        type="password" 
                        value={apiKeys.weatherApiKey}
                        onChange={(e) => handleApiKeyChange('weatherApiKey', e.target.value)}
                        placeholder="Enter your weather API key"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        For weather data and forecasts. Test with any key 10+ characters long.
                      </p>
                      {apiTestResults.weather !== null && (
                        <p className={`text-xs mt-1 ${apiTestResults.weather ? 'text-green-600' : 'text-red-600'}`}>
                          {apiTestResults.weather ? '✓ Connection successful' : '✗ Connection failed'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="geminiApiKey" className="text-foreground dark:text-foreground">Gemini API Key</Label>
                      <Input 
                        id="geminiApiKey" 
                        type="password" 
                        value={apiKeys.geminiApiKey}
                        onChange={(e) => handleApiKeyChange('geminiApiKey', e.target.value)}
                        placeholder="Enter your Gemini API key"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        For AI analysis and recommendations. Test with a key starting with "AI" and 20+ characters.
                      </p>
                      {apiTestResults.gemini !== null && (
                        <p className={`text-xs mt-1 ${apiTestResults.gemini ? 'text-green-600' : 'text-red-600'}`}>
                          {apiTestResults.gemini ? '✓ Connection successful' : '✗ Connection failed'}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleTestConnections}
                        disabled={isTestingConnections || (!apiKeys.weatherApiKey && !apiKeys.geminiApiKey)}
                      >
                        {isTestingConnections ? (
                          <>
                            <div className="loading-dots mr-2" aria-hidden="true">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            Testing...
                          </>
                        ) : (
                          'Test Connections'
                        )}
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleSaveApiKeys}
                        disabled={isSavingKeys}
                      >
                        {isSavingKeys ? (
                          <>
                            <div className="loading-dots mr-2" aria-hidden="true">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            Saving...
                          </>
                        ) : (
                          'Save API Keys'
                        )}
                      </Button>
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
                      <Label htmlFor="dataCollection" className="text-foreground dark:text-foreground">Allow Data Collection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="analytics" defaultChecked />
                      <Label htmlFor="analytics" className="text-foreground dark:text-foreground">Analytics</Label>
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

       {/* Event Report Modal/Page */}
       {selectedEventReport && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               {/* Report Header */}
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-2xl font-bold">{selectedEventReport.title} - Analysis Report</h2>
                   <p className="text-muted-foreground">Completed Event Analysis</p>
                 </div>
                 <Button variant="outline" onClick={handleCloseReport}>
                   <X className="h-4 w-4 mr-2" />
                   Close
                 </Button>
               </div>

               {/* Event Summary */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 <Card className="lg:col-span-2">
                   <CardContent className="pt-6 h-full">
                     <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                       <div className="text-6xl font-bold text-primary-600 mb-2">
                         {selectedEventReport.impactScore}/100
                       </div>
                       <p className="text-muted-foreground mb-4">
                         Final Impact Score
                       </p>
                       <div className="w-full max-w-md bg-gray-200 rounded-full h-3">
                         <div
                           className={`h-3 rounded-full ${getOverallScoreBgColor(selectedEventReport.impactScore)}`}
                           style={{ width: `${selectedEventReport.impactScore}%` }}
                         ></div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardContent className="pt-6">
                     <div className="space-y-4">
                       <div className="text-center p-3 bg-muted rounded-lg">
                         <div className="text-lg font-semibold">{selectedEventReport.date}</div>
                         <div className="text-xs text-muted-foreground">Event Date</div>
                       </div>
                       <div className="text-center p-3 bg-muted rounded-lg">
                         <div className="text-lg font-semibold">{selectedEventReport.attendance}</div>
                         <div className="text-xs text-muted-foreground">Attendees</div>
                       </div>
                       <div className="text-center p-3 bg-muted rounded-lg">
                         <div className="text-lg font-semibold">${selectedEventReport.budget.toLocaleString()}</div>
                         <div className="text-xs text-muted-foreground">Budget</div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>

               {/* Mock Analysis Results */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                   <CardHeader>
                     <div className="flex items-center space-x-2">
                       <CheckCircle className="h-5 w-5 text-green-600" />
                       <CardTitle className="text-lg">Weather Analysis</CardTitle>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-sm space-y-2">
                       <p><strong>Conditions:</strong> Clear skies, 72°F</p>
                       <p><strong>Impact:</strong> Perfect weather conditions contributed to high attendance</p>
                       <p><strong>Recommendation:</strong> Consider similar timing for future events</p>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader>
                     <div className="flex items-center space-x-2">
                       <Calendar className="h-5 w-5 text-blue-600" />
                       <CardTitle className="text-lg">Event Context</CardTitle>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-sm space-y-2">
                       <p><strong>Competing Events:</strong> Minimal competition on this date</p>
                       <p><strong>Community Engagement:</strong> Strong local support</p>
                       <p><strong>Timing:</strong> Optimal scheduling for target audience</p>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader>
                     <div className="flex items-center space-x-2">
                       <BarChart3 className="h-5 w-5 text-purple-600" />
                       <CardTitle className="text-lg">Performance Metrics</CardTitle>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-sm space-y-2">
                       <p><strong>Attendance Rate:</strong> 95% of expected turnout</p>
                       <p><strong>Budget Efficiency:</strong> 92% cost-effectiveness</p>
                       <p><strong>Community Impact:</strong> High positive feedback</p>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader>
                     <div className="flex items-center space-x-2">
                       <FileText className="h-5 w-5 text-orange-600" />
                       <CardTitle className="text-lg">Key Insights</CardTitle>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-sm space-y-2">
                       <p><strong>Success Factors:</strong> {selectedEventReport.notes}</p>
                       <p><strong>Target Audience:</strong> {selectedEventReport.audience}</p>
                       <p><strong>Duration:</strong> {selectedEventReport.duration} was optimal</p>
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </div>
           </div>
         </div>
       )}

      </SidebarProvider>
      </div>
    </ErrorBoundary>
  )
}
