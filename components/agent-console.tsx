'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Bot, Send, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface AgentMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  status?: 'pending' | 'executing' | 'completed' | 'failed'
  plan?: AgentPlan
}

interface AgentPlan {
  steps: AgentStep[]
  approved: boolean
}

interface AgentStep {
  id: string
  action: string
  target: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: any
}

interface AgentConsoleProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

export default function AgentConsole({ isOpen, onClose, projectId }: AgentConsoleProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call agent API to get plan
      const response = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          projectId,
        }),
      })

      if (!response.ok) throw new Error('Failed to get agent plan')

      const data = await response.json()
      
      const agentMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: data.summary,
        timestamp: new Date(),
        status: 'pending',
        plan: data.plan,
      }

      setMessages(prev => [...prev, agentMessage])
      setCurrentPlan(data.plan)
    } catch (error) {
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Failed to process your request. Please try again.',
        timestamp: new Date(),
        status: 'failed',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovePlan = async () => {
    if (!currentPlan) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: currentPlan,
          projectId,
        }),
      })

      if (!response.ok) throw new Error('Failed to execute plan')

      const data = await response.json()
      
      const completionMessage: AgentMessage = {
        id: Date.now().toString(),
        type: 'agent',
        content: data.message,
        timestamp: new Date(),
        status: 'completed',
      }

      setMessages(prev => [...prev, completionMessage])
      setCurrentPlan(null)
    } catch (error) {
      const errorMessage: AgentMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Failed to execute the plan. Please try again.',
        timestamp: new Date(),
        status: 'failed',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectPlan = () => {
    setCurrentPlan(null)
    const rejectMessage: AgentMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Plan rejected. Feel free to refine your request.',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, rejectMessage])
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Operations Agent</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Hi! I can help you manage projects, tasks, and more.</p>
            <p className="text-xs mt-2">Try: "Create a new task for the current project"</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-gray-50 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                
                {message.plan && !message.plan.approved && (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-xs font-medium text-gray-700 mb-2">Planned Actions:</p>
                    <ul className="space-y-1">
                      {message.plan.steps.map(step => (
                        <li key={step.id} className="text-xs text-gray-600 flex items-start">
                          <span className="mr-1">•</span>
                          <span>{step.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.status && (
                  <div className="mt-2 flex items-center text-xs">
                    {message.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {message.status === 'executing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {message.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
                    {message.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1 text-red-500" />}
                    <span className="capitalize">{message.status}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Plan Approval */}
      {currentPlan && !currentPlan.approved && (
        <div className="p-4 border-t bg-amber-50">
          <p className="text-sm font-medium text-amber-900 mb-2">Review Plan</p>
          <div className="flex space-x-2">
            <button
              onClick={handleApprovePlan}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Approve & Execute
            </button>
            <button
              onClick={handleRejectPlan}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to do something..."
            disabled={isLoading || (currentPlan && !currentPlan.approved)}
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || (currentPlan && !currentPlan.approved)}
            className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}