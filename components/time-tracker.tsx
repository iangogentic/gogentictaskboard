'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Save, Clock, Calendar, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import type { Task, User, TimeEntry } from '@prisma/client'

type TaskWithTimeEntries = Task & {
  assignee: User | null
  timeEntries: (TimeEntry & { user: User })[]
}

interface TimeTrackerProps {
  task: TaskWithTimeEntries
  currentUser: User
}

export default function TimeTracker({ task, currentUser }: TimeTrackerProps) {
  const router = useRouter()
  const [isTracking, setIsTracking] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // in seconds
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [manualHours, setManualHours] = useState('')
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    if (isTracking) {
      startTimeRef.current = new Date()
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isTracking])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartStop = () => {
    if (isTracking) {
      // Stop tracking and save
      handleSaveTime()
    } else {
      // Start tracking
      setIsTracking(true)
    }
  }

  const handleSaveTime = async () => {
    if (currentTime === 0 && !manualHours) return

    const hours = currentTime > 0 ? currentTime / 3600 : parseFloat(manualHours)
    if (isNaN(hours) || hours <= 0) return

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          userId: currentUser.id,
          hours,
          description: description || `Worked on: ${task.title}`,
          date: new Date(entryDate).toISOString()
        })
      })

      if (response.ok) {
        setIsTracking(false)
        setCurrentTime(0)
        setManualHours('')
        setDescription('')
        setShowAddEntry(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save time entry:', error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return

    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete time entry:', error)
    }
  }

  const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const remainingHours = task.estimatedHours ? Math.max(0, task.estimatedHours - totalHours) : null

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-600" />
          Time Tracking
        </h3>
        <button
          onClick={() => setShowAddEntry(!showAddEntry)}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4 inline mr-1" />
          Manual Entry
        </button>
      </div>

      {/* Timer */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-mono font-bold text-gray-900">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isTracking ? 'Tracking time...' : 'Click to start tracking'}
            </div>
          </div>
          <button
            onClick={handleStartStop}
            className={`p-3 rounded-full ${
              isTracking 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTracking ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
        </div>
        
        {isTracking && (
          <div className="mt-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        )}
      </div>

      {/* Manual Entry Form */}
      {showAddEntry && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours
              </label>
              <input
                type="number"
                step="0.25"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="e.g., 2.5"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddEntry(false)
                  setManualHours('')
                  setDescription('')
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTime}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <Save className="h-4 w-4 inline mr-1" />
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-lg font-bold text-gray-900">{totalHours.toFixed(1)}</div>
          <div className="text-xs text-gray-600">Hours Logged</div>
        </div>
        {task.estimatedHours && (
          <>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">{task.estimatedHours}</div>
              <div className="text-xs text-gray-600">Estimated</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className={`text-lg font-bold ${remainingHours! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {remainingHours!.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Remaining</div>
            </div>
          </>
        )}
      </div>

      {/* Time Entries */}
      {task.timeEntries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Entries</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {task.timeEntries.map(entry => (
              <div key={entry.id} className="flex items-start justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{entry.user.name}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{entry.hours}h</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{format(new Date(entry.date), 'MMM d')}</span>
                  </div>
                  {entry.description && (
                    <div className="text-gray-600 text-xs mt-1">{entry.description}</div>
                  )}
                </div>
                {entry.userId === currentUser.id && (
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-gray-400 hover:text-red-600 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}