'use client'

import { useState, useEffect } from 'react'
import { format, isToday, isTomorrow, isPast, addDays, startOfDay } from 'date-fns'
import { 
  Clock, Calendar, AlertCircle, CheckCircle, PlayCircle, 
  PauseCircle, Timer, Coffee, Target, TrendingUp, Plus,
  ChevronRight, MoreHorizontal, Flag
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-states'
import { cn } from '@/lib/utils'

interface MyWorkClientProps {
  tasks: any[]
  projects: any[]
  currentUser: any
  timeEntries: any[]
  todayMinutes: number
  activeTimer: any
}

export function MyWorkClient({ 
  tasks, 
  projects, 
  currentUser,
  timeEntries,
  todayMinutes,
  activeTimer
}: MyWorkClientProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(activeTimer?.taskId || null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [selectedBucket, setSelectedBucket] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today')

  // Timer effect (simplified - would need backend support)
  useEffect(() => {
    if (activeTaskId) {
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTaskId])

  // Categorize tasks into buckets
  const buckets = {
    today: tasks.filter(t => {
      if (t.status === 'DONE') return false
      if (!t.dueDate) return t.status === 'DOING'
      return isToday(new Date(t.dueDate)) || (isPast(new Date(t.dueDate)) && t.status !== 'DONE')
    }),
    upcoming: tasks.filter(t => {
      if (t.status === 'DONE') return false
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return !isPast(due) && !isToday(due) && due <= addDays(new Date(), 7)
    }),
    overdue: tasks.filter(t => {
      if (t.status === 'DONE') return false
      if (!t.dueDate) return false
      return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
    }),
    all: tasks.filter(t => t.status !== 'DONE')
  }

  const completedToday = tasks.filter(t => 
    t.status === 'DONE' && 
    t.updatedAt && isToday(new Date(t.updatedAt))
  )

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleStartTimer = async (taskId: string) => {
    setActiveTaskId(taskId)
    // API call to start timer
    await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, userId: currentUser.id })
    })
  }

  const handleStopTimer = async () => {
    // Would need to save time entry to database
    setActiveTaskId(null)
    setTimerSeconds(0)
  }

  const handleSnooze = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const newDate = addDays(new Date(), 1)
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate })
      })
      window.location.reload()
    }
  }

  const getPriorityColor = (task: any) => {
    if (task.priority === 'HIGH') return 'text-red-600 bg-red-50'
    if (task.priority === 'MEDIUM') return 'text-amber-600 bg-amber-50'
    return 'text-gray-600 bg-gray-50'
  }

  const TaskCard = ({ task }: { task: any }) => (
    <div className={cn(
      'group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all',
      activeTaskId === task.id && 'ring-2 ring-blue-500 bg-blue-50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link 
            href={`/projects/${task.projectId}`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600"
          >
            {task.title}
          </Link>
          <div className="flex items-center gap-3 mt-2">
            {task.project.portfolio && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: task.project.portfolio.color ? `${task.project.portfolio.color}20` : '#f3f4f6',
                  color: task.project.portfolio.color || '#6b7280'
                }}
              >
                {task.project.portfolio.name}
              </span>
            )}
            <span className="text-xs text-gray-500">{task.project.title}</span>
            {task.dueDate && (
              <span className={cn(
                'text-xs flex items-center gap-1',
                isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) 
                  ? 'text-red-600' 
                  : 'text-gray-500'
              )}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            {task.priority && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                getPriorityColor(task)
              )}>
                <Flag className="w-3 h-3" />
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {activeTaskId === task.id ? (
            <button
              onClick={handleStopTimer}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Stop timer"
            >
              <PauseCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleStartTimer(task.id)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Start timer"
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}
          <div className="relative group/menu">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover/menu:block z-10">
              <button
                onClick={() => handleSnooze(task.id)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Snooze to tomorrow
              </button>
              <Link
                href={`/projects/${task.projectId}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View in project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Timer */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Work</h1>
            <p className="text-gray-600 mt-1">
              Focus on what matters today, {currentUser.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Today's Time */}
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Today's time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatMinutes(todayMinutes)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Active Timer */}
            {activeTaskId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-xs text-blue-600">Timer running</p>
                    <p className="text-lg font-mono font-semibold text-blue-900">
                      {formatTime(timerSeconds)}
                    </p>
                  </div>
                  <button
                    onClick={handleStopTimer}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <PauseCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Breakdown */}
        {projects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Projects by Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(new Set(projects.map(p => p.portfolio?.id).filter(Boolean))).map(portfolioId => {
                const portfolio = projects.find(p => p.portfolio?.id === portfolioId)?.portfolio
                if (!portfolio) return null
                const portfolioProjects = projects.filter(p => p.portfolio?.id === portfolioId)
                const portfolioTasks = tasks.filter(t => t.project.portfolio?.id === portfolioId)
                
                return (
                  <div key={portfolioId} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: portfolio.color || '#6b7280' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{portfolio.name}</p>
                      <p className="text-xs text-gray-500">
                        {portfolioProjects.length} projects • {portfolioTasks.length} tasks
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{buckets.today.length}</p>
              </div>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{buckets.upcoming.length}</p>
              </div>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{buckets.overdue.length}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{completedToday.length}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Bucket Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(['today', 'upcoming', 'overdue', 'all'] as const).map(bucket => (
            <button
              key={bucket}
              onClick={() => setSelectedBucket(bucket)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                selectedBucket === bucket
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              )}
            >
              <span className="flex items-center gap-2">
                {bucket === 'today' && <Target className="w-4 h-4" />}
                {bucket === 'upcoming' && <Calendar className="w-4 h-4" />}
                {bucket === 'overdue' && <AlertCircle className="w-4 h-4" />}
                {bucket === 'all' && <Clock className="w-4 h-4" />}
                {bucket.charAt(0).toUpperCase() + bucket.slice(1)}
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  bucket === 'overdue' && buckets[bucket].length > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                )}>
                  {buckets[bucket].length}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {buckets[selectedBucket].length === 0 ? (
            <EmptyState
              type="tasks"
              title={`No ${selectedBucket} tasks`}
              description={
                selectedBucket === 'today' 
                  ? "You're all caught up! Check upcoming tasks or take a break."
                  : selectedBucket === 'overdue'
                  ? "Great! No overdue tasks."
                  : "No tasks in this category."
              }
            />
          ) : (
            buckets[selectedBucket].map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Quick Add Task */}
        <button className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}