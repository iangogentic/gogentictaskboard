import { format } from 'date-fns'

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle null/undefined
        if (value === null || value === undefined) return ''
        // Handle dates
        if (value instanceof Date) return format(value, 'yyyy-MM-dd')
        // Handle arrays
        if (Array.isArray(value)) return `"${value.join('; ')}"`
        // Handle objects
        if (typeof value === 'object') return `"${JSON.stringify(value)}"`
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function prepareProjectsForExport(projects: any[]) {
  return projects.map(project => ({
    'Project Title': project.title,
    'Branch': project.branch,
    'Status': project.status,
    'Project Manager': project.pm?.name || '',
    'Developers': project.developers?.map((d: any) => d.name).join('; ') || '',
    'Client Name': project.clientName || '',
    'Client Email': project.clientEmail || '',
    'Start Date': project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
    'Target Delivery': project.targetDelivery ? format(new Date(project.targetDelivery), 'yyyy-MM-dd') : '',
    'Total Tasks': project.tasks?.length || 0,
    'Completed Tasks': project.tasks?.filter((t: any) => t.status === 'Done').length || 0,
    'Progress %': project.tasks?.length > 0 
      ? Math.round((project.tasks.filter((t: any) => t.status === 'Done').length / project.tasks.length) * 100)
      : 0,
    'Notes': project.notes || '',
    'Created At': project.createdAt ? format(new Date(project.createdAt), 'yyyy-MM-dd') : '',
    'Last Updated': project.lastUpdatedAt ? format(new Date(project.lastUpdatedAt), 'yyyy-MM-dd') : ''
  }))
}

export function prepareTasksForExport(tasks: any[]) {
  return tasks.map(task => ({
    'Task Title': task.title,
    'Project': task.project?.title || '',
    'Status': task.status,
    'Assignee': task.assignee?.name || 'Unassigned',
    'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    'Estimated Hours': task.estimatedHours || '',
    'Actual Hours': task.actualHours || 0,
    'Notes': task.notes || '',
    'Created At': task.createdAt ? format(new Date(task.createdAt), 'yyyy-MM-dd') : '',
    'Updated At': task.updatedAt ? format(new Date(task.updatedAt), 'yyyy-MM-dd') : ''
  }))
}

export function prepareTimeEntriesForExport(entries: any[]) {
  return entries.map(entry => ({
    'Date': entry.date ? format(new Date(entry.date), 'yyyy-MM-dd') : '',
    'Task': entry.task?.title || '',
    'Project': entry.task?.project?.title || '',
    'User': entry.user?.name || '',
    'Hours': entry.hours,
    'Description': entry.description || '',
    'Created At': entry.createdAt ? format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm') : ''
  }))
}

export function prepareActivityForExport(updates: any[]) {
  return updates.map(update => ({
    'Date': update.createdAt ? format(new Date(update.createdAt), 'yyyy-MM-dd HH:mm') : '',
    'Project': update.project?.title || '',
    'Author': update.author?.name || '',
    'Activity': update.body || ''
  }))
}