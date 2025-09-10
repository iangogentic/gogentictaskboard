export interface ProjectTemplate {
  id: string
  name: string
  description: string
  branch: string
  category: 'development' | 'marketing' | 'education' | 'client' | 'internal'
  icon: string
  defaultTasks: {
    title: string
    status: 'Todo' | 'Doing' | 'Review' | 'Done'
    notes?: string
    daysFromStart?: number // Due date relative to project start
  }[]
  defaultDeliverables?: {
    title: string
    status: string
  }[]
  estimatedDuration: number // In days
  notes?: string
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Full-stack web application with frontend and backend',
    branch: 'CORTEX',
    category: 'development',
    icon: '🌐',
    estimatedDuration: 60,
    defaultTasks: [
      { title: 'Requirements gathering', status: 'Todo', daysFromStart: 3 },
      { title: 'System architecture design', status: 'Todo', daysFromStart: 7 },
      { title: 'Database schema design', status: 'Todo', daysFromStart: 10 },
      { title: 'Setup development environment', status: 'Todo', daysFromStart: 5 },
      { title: 'Backend API development', status: 'Todo', daysFromStart: 20 },
      { title: 'Frontend UI development', status: 'Todo', daysFromStart: 25 },
      { title: 'Integration testing', status: 'Todo', daysFromStart: 45 },
      { title: 'User acceptance testing', status: 'Todo', daysFromStart: 50 },
      { title: 'Deployment setup', status: 'Todo', daysFromStart: 55 },
      { title: 'Production launch', status: 'Todo', daysFromStart: 60 }
    ],
    defaultDeliverables: [
      { title: 'Technical Requirements Document', status: 'Draft' },
      { title: 'System Architecture Diagram', status: 'Draft' },
      { title: 'API Documentation', status: 'Draft' },
      { title: 'User Manual', status: 'Draft' },
      { title: 'Deployment Guide', status: 'Draft' }
    ],
    notes: 'Standard web application development template with full lifecycle'
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application',
    description: 'iOS and Android mobile application development',
    branch: 'SOLUTIONS',
    category: 'development',
    icon: '📱',
    estimatedDuration: 90,
    defaultTasks: [
      { title: 'Mobile app requirements', status: 'Todo', daysFromStart: 3 },
      { title: 'UI/UX design mockups', status: 'Todo', daysFromStart: 10 },
      { title: 'Setup React Native environment', status: 'Todo', daysFromStart: 7 },
      { title: 'Implement authentication', status: 'Todo', daysFromStart: 15 },
      { title: 'Core features development', status: 'Todo', daysFromStart: 30 },
      { title: 'Push notifications setup', status: 'Todo', daysFromStart: 40 },
      { title: 'iOS testing and optimization', status: 'Todo', daysFromStart: 60 },
      { title: 'Android testing and optimization', status: 'Todo', daysFromStart: 65 },
      { title: 'App store submission', status: 'Todo', daysFromStart: 85 },
      { title: 'Launch and monitoring', status: 'Todo', daysFromStart: 90 }
    ],
    defaultDeliverables: [
      { title: 'App Design Mockups', status: 'Draft' },
      { title: 'iOS Build', status: 'Draft' },
      { title: 'Android Build', status: 'Draft' },
      { title: 'App Store Assets', status: 'Draft' }
    ]
  },
  {
    id: 'course-creation',
    name: 'Online Course',
    description: 'Educational course content creation and setup',
    branch: 'CORTEX',
    category: 'education',
    icon: '🎓',
    estimatedDuration: 45,
    defaultTasks: [
      { title: 'Course outline and curriculum', status: 'Todo', daysFromStart: 5 },
      { title: 'Learning objectives definition', status: 'Todo', daysFromStart: 7 },
      { title: 'Module 1 content creation', status: 'Todo', daysFromStart: 10 },
      { title: 'Module 2 content creation', status: 'Todo', daysFromStart: 15 },
      { title: 'Module 3 content creation', status: 'Todo', daysFromStart: 20 },
      { title: 'Video recording and editing', status: 'Todo', daysFromStart: 25 },
      { title: 'Quiz and assessment creation', status: 'Todo', daysFromStart: 30 },
      { title: 'Platform setup and configuration', status: 'Todo', daysFromStart: 35 },
      { title: 'Beta testing with students', status: 'Todo', daysFromStart: 40 },
      { title: 'Course launch', status: 'Todo', daysFromStart: 45 }
    ],
    defaultDeliverables: [
      { title: 'Course Curriculum', status: 'Draft' },
      { title: 'Video Lessons', status: 'Draft' },
      { title: 'Course Materials', status: 'Draft' },
      { title: 'Student Handbook', status: 'Draft' }
    ]
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Multi-channel marketing campaign planning and execution',
    branch: 'FISHER',
    category: 'marketing',
    icon: '📢',
    estimatedDuration: 30,
    defaultTasks: [
      { title: 'Campaign strategy development', status: 'Todo', daysFromStart: 3 },
      { title: 'Target audience research', status: 'Todo', daysFromStart: 5 },
      { title: 'Content calendar creation', status: 'Todo', daysFromStart: 7 },
      { title: 'Social media content creation', status: 'Todo', daysFromStart: 10 },
      { title: 'Email campaign setup', status: 'Todo', daysFromStart: 12 },
      { title: 'Landing page development', status: 'Todo', daysFromStart: 15 },
      { title: 'Ad creative design', status: 'Todo', daysFromStart: 18 },
      { title: 'Campaign launch', status: 'Todo', daysFromStart: 20 },
      { title: 'Performance monitoring', status: 'Todo', daysFromStart: 25 },
      { title: 'Results analysis and report', status: 'Todo', daysFromStart: 30 }
    ],
    defaultDeliverables: [
      { title: 'Campaign Strategy Document', status: 'Draft' },
      { title: 'Content Calendar', status: 'Draft' },
      { title: 'Creative Assets', status: 'Draft' },
      { title: 'Performance Report', status: 'Draft' }
    ]
  },
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description: 'New client onboarding and setup process',
    branch: 'FISHER',
    category: 'client',
    icon: '🤝',
    estimatedDuration: 14,
    defaultTasks: [
      { title: 'Initial client meeting', status: 'Todo', daysFromStart: 1 },
      { title: 'Gather requirements', status: 'Todo', daysFromStart: 2 },
      { title: 'Contract preparation', status: 'Todo', daysFromStart: 3 },
      { title: 'Account setup', status: 'Todo', daysFromStart: 5 },
      { title: 'Access credentials creation', status: 'Todo', daysFromStart: 6 },
      { title: 'Kickoff meeting', status: 'Todo', daysFromStart: 7 },
      { title: 'Training session', status: 'Todo', daysFromStart: 10 },
      { title: 'Documentation handover', status: 'Todo', daysFromStart: 12 },
      { title: 'Follow-up check-in', status: 'Todo', daysFromStart: 14 }
    ],
    defaultDeliverables: [
      { title: 'Service Agreement', status: 'Draft' },
      { title: 'Onboarding Checklist', status: 'Draft' },
      { title: 'Welcome Package', status: 'Draft' }
    ]
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Third-party API integration project',
    branch: 'SOLUTIONS',
    category: 'development',
    icon: '🔌',
    estimatedDuration: 21,
    defaultTasks: [
      { title: 'API documentation review', status: 'Todo', daysFromStart: 2 },
      { title: 'Authentication setup', status: 'Todo', daysFromStart: 4 },
      { title: 'Data mapping design', status: 'Todo', daysFromStart: 6 },
      { title: 'Integration development', status: 'Todo', daysFromStart: 10 },
      { title: 'Error handling implementation', status: 'Todo', daysFromStart: 14 },
      { title: 'Testing and validation', status: 'Todo', daysFromStart: 18 },
      { title: 'Production deployment', status: 'Todo', daysFromStart: 21 }
    ],
    defaultDeliverables: [
      { title: 'Integration Documentation', status: 'Draft' },
      { title: 'API Mapping Document', status: 'Draft' }
    ]
  },
  {
    id: 'data-migration',
    name: 'Data Migration',
    description: 'Database or system data migration project',
    branch: 'SOLUTIONS',
    category: 'development',
    icon: '💾',
    estimatedDuration: 28,
    defaultTasks: [
      { title: 'Data audit and assessment', status: 'Todo', daysFromStart: 3 },
      { title: 'Migration strategy planning', status: 'Todo', daysFromStart: 5 },
      { title: 'Schema mapping', status: 'Todo', daysFromStart: 8 },
      { title: 'Migration scripts development', status: 'Todo', daysFromStart: 12 },
      { title: 'Test migration run', status: 'Todo', daysFromStart: 18 },
      { title: 'Data validation', status: 'Todo', daysFromStart: 20 },
      { title: 'Production migration', status: 'Todo', daysFromStart: 25 },
      { title: 'Post-migration verification', status: 'Todo', daysFromStart: 28 }
    ],
    defaultDeliverables: [
      { title: 'Migration Plan', status: 'Draft' },
      { title: 'Data Mapping Document', status: 'Draft' },
      { title: 'Migration Report', status: 'Draft' }
    ]
  },
  {
    id: 'internal-tool',
    name: 'Internal Tool',
    description: 'Internal productivity or automation tool',
    branch: 'CORTEX',
    category: 'internal',
    icon: '🔧',
    estimatedDuration: 14,
    defaultTasks: [
      { title: 'Tool requirements gathering', status: 'Todo', daysFromStart: 2 },
      { title: 'Technical design', status: 'Todo', daysFromStart: 4 },
      { title: 'Prototype development', status: 'Todo', daysFromStart: 7 },
      { title: 'User feedback collection', status: 'Todo', daysFromStart: 10 },
      { title: 'Final implementation', status: 'Todo', daysFromStart: 12 },
      { title: 'Team training', status: 'Todo', daysFromStart: 14 }
    ],
    defaultDeliverables: [
      { title: 'Tool Documentation', status: 'Draft' },
      { title: 'User Guide', status: 'Draft' }
    ]
  }
]