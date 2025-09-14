'use client'

import { useState } from 'react'

interface ActualsFormProps {
  eventId: string
  onSuccess?: () => void
}

interface ActualsData {
  attendance: number
  cost: number
  revenue?: number
  weather: string
  issues: string[]
  notes: string
}

export default function ActualsForm({ eventId, onSuccess }: ActualsFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actuals, setActuals] = useState<ActualsData>({
    attendance: 0,
    cost: 0,
    revenue: 0,
    weather: '',
    issues: [],
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Mock submission - no database storage
      console.log('Mock actuals submission:', {
        eventId,
        actuals: {
          ...actuals,
          submitted_at: new Date().toISOString()
        }
      })

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reset form
      setActuals({
        attendance: 0,
        cost: 0,
        revenue: 0,
        weather: '',
        issues: [],
        notes: ''
      })

      setIsOpen(false)
      onSuccess?.()
      
      // Show success message
      alert('Actuals submitted successfully! Thank you for helping improve our predictions.')
    } catch (error) {
      console.error('Error submitting actuals:', error)
      alert('Error submitting actuals. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addIssue = (issue: string) => {
    if (issue.trim() && !actuals.issues.includes(issue.trim())) {
      setActuals(prev => ({
        ...prev,
        issues: [...prev.issues, issue.trim()]
      }))
    }
  }

  const removeIssue = (index: number) => {
    setActuals(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Submit Actual Results
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Submit Actual Event Results</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Attendance
            </label>
            <input
              type="number"
              value={actuals.attendance}
              onChange={(e) => setActuals(prev => ({ ...prev, attendance: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Cost ($)
            </label>
            <input
              type="number"
              value={actuals.cost}
              onChange={(e) => setActuals(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revenue ($) - Optional
            </label>
            <input
              type="number"
              value={actuals.revenue || ''}
              onChange={(e) => setActuals(prev => ({ ...prev, revenue: parseInt(e.target.value) || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weather Conditions
            </label>
            <input
              type="text"
              value={actuals.weather}
              onChange={(e) => setActuals(prev => ({ ...prev, weather: e.target.value }))}
              placeholder="e.g., sunny, cloudy, rainy, windy, stormy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issues Encountered
            </label>
            <div className="space-y-2">
              {actuals.issues.map((issue, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-100 rounded-lg">{issue}</span>
                  <button
                    type="button"
                    onClick={() => removeIssue(index)}
                    className="px-2 py-1 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add an issue..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIssue(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addIssue(input.value)
                    input.value = ''
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={actuals.notes}
              onChange={(e) => setActuals(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Any additional observations or notes about the event..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
