'use client'

import { useState, useEffect } from 'react'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

interface AgentHealthCheck {
  agentName: string
  status: HealthStatus
  dependencies: {
    geminiApi: HealthStatus
    weatherApi?: HealthStatus
    mapsApi?: HealthStatus
    supabase?: HealthStatus
  }
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded'
  agents: AgentHealthCheck[]
  timestamp: string
}

export default function HealthCheckDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (data.success) {
        setSystemHealth(data.data)
        setLastChecked(new Date())
      } else {
        setError(data.message || 'Failed to fetch health status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'degraded': return '⚠️'
      case 'unhealthy': return '❌'
      default: return '❓'
    }
  }

  if (loading && !systemHealth) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Health Check</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Checking system health...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">System Health Check</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Health Check Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchHealthStatus}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">System Health Check</h2>
        <div className="flex items-center space-x-4">
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealthStatus}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overall System Status */}
      {systemHealth && (
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon(systemHealth.overall)}</span>
            <div>
              <h3 className="text-lg font-medium">Overall System Status</h3>
              <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.overall)}`}>
                {systemHealth.overall.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Agent Health Status */}
      {systemHealth && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Agent Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.agents.map((agent) => (
              <div key={agent.agentName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize">{agent.agentName}</h4>
                  <span className="text-lg">{getStatusIcon(agent.status.status)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agent.status.status)}`}>
                      {agent.status.status}
                    </span>
                  </div>
                  
                  {agent.status.responseTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Response Time:</span>
                      <span className="text-sm">{agent.status.responseTime}ms</span>
                    </div>
                  )}
                  
                  {agent.status.error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {agent.status.error}
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                <div className="mt-3 pt-3 border-t">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Dependencies:</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Gemini API:</span>
                      <span className="text-xs">{getStatusIcon(agent.dependencies.geminiApi.status)}</span>
                    </div>
                    {agent.dependencies.weatherApi && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Weather API:</span>
                        <span className="text-xs">{getStatusIcon(agent.dependencies.weatherApi.status)}</span>
                      </div>
                    )}
                    {agent.dependencies.mapsApi && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Maps API:</span>
                        <span className="text-xs">{getStatusIcon(agent.dependencies.mapsApi.status)}</span>
                      </div>
                    )}
                    {agent.dependencies.supabase && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Supabase:</span>
                        <span className="text-xs">{getStatusIcon(agent.dependencies.supabase.status)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Information */}
      {systemHealth && (
        <div className="mt-6 pt-6 border-t">
          <div className="text-sm text-gray-500">
            <p>System checked at: {new Date(systemHealth.timestamp).toLocaleString()}</p>
            <p>Total agents: {systemHealth.agents.length}</p>
            <p>Healthy agents: {systemHealth.agents.filter(a => a.status.status === 'healthy').length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
