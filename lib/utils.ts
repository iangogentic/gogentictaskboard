import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BRANCHES = {
  CORTEX: 'CORTEX',
  SOLUTIONS: 'SOLUTIONS',
  FISHER: 'FISHER',
} as const

export const PROJECT_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  BLOCKED: 'Blocked',
  DONE: 'Done',
} as const

export const TASK_STATUS = {
  TODO: 'Todo',
  DOING: 'Doing',
  REVIEW: 'Review',
  DONE: 'Done',
} as const

export const DELIVERABLE_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REVISIONS: 'Revisions',
} as const

export function getStatusColor(status: string) {
  switch (status) {
    case PROJECT_STATUS.NOT_STARTED:
    case TASK_STATUS.TODO:
      return 'bg-gray-100 text-gray-800'
    case PROJECT_STATUS.IN_PROGRESS:
    case TASK_STATUS.DOING:
      return 'bg-blue-100 text-blue-800'
    case PROJECT_STATUS.REVIEW:
    case TASK_STATUS.REVIEW:
      return 'bg-yellow-100 text-yellow-800'
    case PROJECT_STATUS.BLOCKED:
      return 'bg-red-100 text-red-800'
    case PROJECT_STATUS.DONE:
    case TASK_STATUS.DONE:
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getBranchColor(branch: string) {
  switch (branch) {
    case BRANCHES.CORTEX:
      return 'bg-purple-100 text-purple-800'
    case BRANCHES.SOLUTIONS:
      return 'bg-indigo-100 text-indigo-800'
    case BRANCHES.FISHER:
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}