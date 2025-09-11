'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, RefreshCw, Calendar, Users, Mail, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { getStatusColor, getBranchColor } from '@/lib/utils'
import TaskBoardWithBulk from './task-board-with-bulk'
import DeliverablesList from './deliverables-list'
import type { Project, User, Task, Update, Deliverable } from '@prisma/client'

type ProjectWithRelations = Project & {
  pm: User
  developers: User[]
  tasks: (Task & { assignee: User | null })[]
  updates: (Update & { author: User })[]
  deliverables: Deliverable[]
}

interface ProjectDetailProps {
  project: ProjectWithRelations
  users: User[]
}

export default function ProjectDetail({ project, users }: ProjectDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'activity' | 'deliverables'>('overview')
  const [showCopied, setShowCopied] = useState(false)
  const [addingUpdate, setAddingUpdate] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [selectedAuthorId, setSelectedAuthorId] = useState(users[0]?.id || '')

  const copyClientLink = () => {
    const link = `${window.location.origin}/share/${project.clientShareToken}`
    navigator.clipboard.writeText(link)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  const regenerateToken = async () => {
    const response = await fetch(`/api/projects/${project.id}/regenerate-token`, {
      method: 'POST',
    })
    if (response.ok) {
      router.refresh()
    }
  }

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return

    try {
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          authorId: selectedAuthorId,
          body: updateText,
        }),
      })

      if (response.ok) {
        setUpdateText('')
        setAddingUpdate(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add update:', error)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-bg shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted hover:text-fg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
              <div className="border-l pl-4">
                <h1 className="text-xl font-semibold">{project.title}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center px-3 py-1.5 border border-border shadow-sm text-sm font-medium rounded-md text-fg bg-bg hover:bg-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBranchColor(project.branch)}`}>
                {project.branch}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {(['overview', 'tasks', 'activity', 'deliverables'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-indigo-500 text-brand'
                      : 'border-transparent text-muted hover:text-fg hover:border-border'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted mb-3">Project Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-muted" />
                        <span className="text-muted">PM:</span>
                        <span className="ml-2 font-medium">{project.pm.name}</span>
                      </div>
                      <div className="flex items-start text-sm">
                        <Users className="h-4 w-4 mr-2 text-muted mt-0.5" />
                        <span className="text-muted">Developers:</span>
                        <div className="ml-2">
                          {project.developers.map(dev => (
                            <span key={dev.id} className="font-medium block">{dev.name}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-muted" />
                        <span className="text-muted">Client:</span>
                        <span className="ml-2 font-medium">{project.clientName} ({project.clientEmail})</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted mb-3">Timeline</h3>
                    <div className="space-y-3">
                      {project.startDate && (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted" />
                          <span className="text-muted">Start:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(project.startDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      {project.targetDelivery && (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted" />
                          <span className="text-muted">Target:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(project.targetDelivery), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted" />
                        <span className="text-muted">Last Updated:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(project.lastUpdatedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {project.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted mb-2">Notes</h3>
                    <p className="text-sm text-fg bg-bg p-3 rounded">{project.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted mb-3">Client Share Link</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${project.clientShareToken}`}
                      className="flex-1 px-3 py-2 text-sm bg-bg border rounded-md"
                    />
                    <button
                      onClick={copyClientLink}
                      className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-fg bg-bg hover:bg-bg"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {showCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={regenerateToken}
                      className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-fg bg-bg hover:bg-bg"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <TaskBoardWithBulk project={project} users={users} />
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Activity Feed</h3>
                  <button 
                    onClick={() => setAddingUpdate(!addingUpdate)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Update
                  </button>
                </div>

                {addingUpdate && (
                  <div className="bg-bg border rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-fg">Author:</label>
                        <select
                          value={selectedAuthorId}
                          onChange={(e) => setSelectedAuthorId(e.target.value)}
                          className="flex-1 text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        placeholder="Write your update..."
                        rows={3}
                        className="w-full text-sm px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setAddingUpdate(false)
                            setUpdateText('')
                          }}
                          className="px-3 py-1.5 text-sm text-muted hover:text-fg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddUpdate}
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Post Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {project.updates.length === 0 ? (
                    <p className="text-muted text-sm">No updates yet.</p>
                  ) : (
                    project.updates.map(update => (
                      <div key={update.id} className="bg-bg rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="h-8 w-8 rounded-full bg-border flex items-center justify-center text-xs font-medium text-fg">
                              {update.author.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{update.author.name}</span>
                                <span className="text-xs text-muted">
                                  {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm text-fg mt-1">{update.body}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'deliverables' && (
              <DeliverablesList 
                projectId={project.id} 
                deliverables={project.deliverables} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}