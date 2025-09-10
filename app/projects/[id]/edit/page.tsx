'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'
import { BRANCHES, PROJECT_STATUS } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
}

interface Project {
  id: string
  title: string
  branch: string
  pmId: string
  developers: User[]
  clientName: string
  clientEmail: string
  status: string
  startDate: string | null
  targetDelivery: string | null
  notes: string | null
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    branch: '',
    pmId: '',
    developerIds: [] as string[],
    clientName: '',
    clientEmail: '',
    status: '',
    startDate: '',
    targetDelivery: '',
    notes: ''
  })

  useEffect(() => {
    params.then(p => setProjectId(p.id))
  }, [params])

  useEffect(() => {
    if (projectId) {
      fetchProjectAndUsers()
    }
  }, [projectId])

  const fetchProjectAndUsers = async () => {
    if (!projectId) return
    try {
      const [projectRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch('/api/users')
      ])

      if (!projectRes.ok) throw new Error('Failed to fetch project')
      if (!usersRes.ok) throw new Error('Failed to fetch users')

      const projectData = await projectRes.json()
      const usersData = await usersRes.json()

      setProject(projectData)
      setUsers(usersData)

      // Populate form with existing data
      setFormData({
        title: projectData.title,
        branch: projectData.branch,
        pmId: projectData.pmId,
        developerIds: projectData.developers.map((d: User) => d.id),
        clientName: projectData.clientName || '',
        clientEmail: projectData.clientEmail || '',
        status: projectData.status,
        startDate: projectData.startDate ? new Date(projectData.startDate).toISOString().split('T')[0] : '',
        targetDelivery: projectData.targetDelivery ? new Date(projectData.targetDelivery).toISOString().split('T')[0] : '',
        notes: projectData.notes || ''
      })
    } catch (err) {
      setError('Failed to load project data')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          targetDelivery: formData.targetDelivery ? new Date(formData.targetDelivery).toISOString() : null,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      router.push(`/projects/${projectId}`)
    } catch (err) {
      setError('Failed to update project. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleDeveloper = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      developerIds: prev.developerIds.includes(userId)
        ? prev.developerIds.filter(id => id !== userId)
        : [...prev.developerIds, userId]
    }))
  }

  if (!project || users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={projectId ? `/projects/${projectId}` : '/'}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </Link>
            <h1 className="text-xl font-semibold">Edit Project</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
              Branch
            </label>
            <select
              id="branch"
              required
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">Select branch</option>
              {Object.entries(BRANCHES).map(([key, value]) => (
                <option key={key} value={value}>{value.charAt(0) + value.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            >
              {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="pm" className="block text-sm font-medium text-gray-700">
            Project Manager
          </label>
          <select
            id="pm"
            required
            value={formData.pmId}
            onChange={(e) => setFormData({ ...formData, pmId: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
          >
            <option value="">Select PM</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Developers
          </label>
          <div className="space-y-2">
            {users.map(user => (
              <label key={user.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.developerIds.includes(user.id)}
                  onChange={() => toggleDeveloper(user.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">
              Client Email
            </label>
            <input
              type="email"
              id="clientEmail"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="targetDelivery" className="block text-sm font-medium text-gray-700">
              Target Delivery
            </label>
            <input
              type="date"
              id="targetDelivery"
              value={formData.targetDelivery}
              onChange={(e) => setFormData({ ...formData, targetDelivery: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={projectId ? `/projects/${projectId}` : '/'}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}