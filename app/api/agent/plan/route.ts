export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, logAuditAction } from '@/lib/auth-middleware'

interface ToolCall {
  tool: string
  action: string
  parameters: any
}

interface AgentStep {
  id: string
  action: string
  target: string
  description: string
  status: 'pending'
  toolCall?: ToolCall
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  
  if ('status' in session) {
    return session // Return error
  }

  try {
    const { message, projectId } = await req.json()

    // Parse the user's intent
    const intent = analyzeIntent(message)
    
    // Generate a plan based on the intent
    const plan = await generatePlan(intent, projectId)

    // Log the planned action
    await logAuditAction(
      session.user.id,
      'agent_plan',
      'agent_action',
      undefined,
      { message, plan },
      'planned'
    )

    return NextResponse.json({
      summary: `I'll help you ${intent.summary}. Here's what I'll do:`,
      plan: {
        steps: plan,
        approved: false,
      },
    })
  } catch (error) {
    console.error('Agent plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    )
  }
}

function analyzeIntent(message: string): any {
  const lowerMessage = message.toLowerCase()
  
  // Simple intent detection (would be replaced with proper NLP)
  if (lowerMessage.includes('create') && lowerMessage.includes('task')) {
    return {
      type: 'create_task',
      summary: 'create a new task',
    }
  } else if (lowerMessage.includes('update') && lowerMessage.includes('status')) {
    return {
      type: 'update_status',
      summary: 'update the project status',
    }
  } else if (lowerMessage.includes('add') && lowerMessage.includes('update')) {
    return {
      type: 'add_update',
      summary: 'add a project update',
    }
  } else if (lowerMessage.includes('assign')) {
    return {
      type: 'assign_task',
      summary: 'assign a task to someone',
    }
  } else {
    return {
      type: 'general',
      summary: 'help with that',
    }
  }
}

async function generatePlan(intent: any, projectId?: string): Promise<AgentStep[]> {
  const steps: AgentStep[] = []

  switch (intent.type) {
    case 'create_task':
      steps.push({
        id: '1',
        action: 'create',
        target: 'task',
        description: 'Create a new task in the current project',
        status: 'pending',
        toolCall: {
          tool: 'task_tools',
          action: 'create',
          parameters: {
            projectId,
            title: 'New Task',
            status: 'Todo',
          },
        },
      })
      steps.push({
        id: '2',
        action: 'notify',
        target: 'team',
        description: 'Notify the team about the new task',
        status: 'pending',
        toolCall: {
          tool: 'notification_tools',
          action: 'send',
          parameters: {
            type: 'task_created',
          },
        },
      })
      break
      
    case 'update_status':
      steps.push({
        id: '1',
        action: 'update',
        target: 'project',
        description: 'Update the project status',
        status: 'pending',
        toolCall: {
          tool: 'project_tools',
          action: 'update_status',
          parameters: {
            projectId,
          },
        },
      })
      steps.push({
        id: '2',
        action: 'create',
        target: 'update',
        description: 'Log the status change',
        status: 'pending',
        toolCall: {
          tool: 'update_tools',
          action: 'create',
          parameters: {
            projectId,
            type: 'status_change',
          },
        },
      })
      break
      
    case 'add_update':
      steps.push({
        id: '1',
        action: 'create',
        target: 'update',
        description: 'Add a new project update',
        status: 'pending',
        toolCall: {
          tool: 'update_tools',
          action: 'create',
          parameters: {
            projectId,
          },
        },
      })
      break
      
    default:
      steps.push({
        id: '1',
        action: 'analyze',
        target: 'request',
        description: 'Analyze your request to determine the best action',
        status: 'pending',
      })
  }

  return steps
}