'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Rocket, Search } from 'lucide-react'
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/lib/project-templates'

export default function NewProjectFromTemplatePage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredTemplates = PROJECT_TEMPLATES.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📚' },
    { id: 'development', name: 'Development', icon: '💻' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'client', name: 'Client', icon: '🤝' },
    { id: 'internal', name: 'Internal', icon: '🔧' }
  ]

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      // Store template in sessionStorage to use in new project form
      sessionStorage.setItem('selectedTemplate', JSON.stringify(selectedTemplate))
      router.push('/projects/new')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/projects/new"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Choose a Template</h1>
        </div>
        <p className="text-gray-600">Start your project faster with a pre-configured template</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    selectedCategory === category.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Template Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Branch:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.branch}</span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.estimatedDuration} days</span>
                </div>
                <div>
                  <span className="text-gray-500">Tasks:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.defaultTasks.length}</span>
                </div>
                {selectedTemplate.defaultDeliverables && (
                  <div>
                    <span className="text-gray-500">Deliverables:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.defaultDeliverables.length}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSelectTemplate}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Use This Template
              </button>
            </div>
          )}
        </div>

        {/* Template Grid */}
        <div className="lg:col-span-3">
          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No templates found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-indigo-500 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.branch === 'CORTEX' ? 'bg-purple-100 text-purple-800' :
                      template.branch === 'SOLUTIONS' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {template.branch}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.defaultTasks.length} tasks</span>
                    <span>{template.estimatedDuration} days</span>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Included Tasks:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {template.defaultTasks.slice(0, 5).map((task, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            • {task.title}
                          </div>
                        ))}
                        {template.defaultTasks.length > 5 && (
                          <div className="text-xs text-gray-400">
                            ...and {template.defaultTasks.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/projects/new"
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Start from scratch instead
        </Link>
        {selectedTemplate && (
          <button
            onClick={handleSelectTemplate}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Continue with {selectedTemplate.name}
          </button>
        )}
      </div>
    </div>
  )
}