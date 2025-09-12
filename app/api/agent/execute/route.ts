export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, logAuditAction } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await requireAuth(req)
  
  if ('status' in session) {
    return session // Return error
  }

  try {
    const { plan, projectId } = await req.json()

    const results = []
    
    for (const step of plan.steps) {
      try {
        // Execute the step based on the tool call
        const result = await executeStep(step, session.user.id, projectId)
        results.push({ stepId: step.id, success: true, result })
        
        // Log successful execution
        await logAuditAction(
          session.user.id,
          step.action,
          step.target,
          result.id,
          step.toolCall,
          'executed'
        )
      } catch (error: any) {
        results.push({ stepId: step.id, success: false, error: error.message })
        
        // Log failed execution
        await logAuditAction(
          session.user.id,
          step.action,
          step.target,
          undefined,
          step.toolCall,
          'failed',
          error.message
        )
      }
    }

    const successCount = results.filter(r => r.success).length
    const message = successCount === plan.steps.length
      ? 'All actions completed successfully!'
      : `Completed ${successCount} of ${plan.steps.length} actions.`

    return NextResponse.json({
      message,
      results,
    })
  } catch (error) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute plan' },
      { status: 500 }
    )
  }
}

async function executeStep(step: any, userId: string, projectId?: string): Promise<any> {
  if (!step.toolCall) {
    throw new Error('No tool call defined for step')
  }

  const { tool, action, parameters } = step.toolCall

  switch (tool) {
    case 'task_tools':
      return await executeTaskTool(action, parameters, userId)
    case 'project_tools':
      return await executeProjectTool(action, parameters, userId)
    case 'update_tools':
      return await executeUpdateTool(action, parameters, userId)
    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

async function executeTaskTool(action: string, params: any, userId: string) {
  switch (action) {
    case 'create':
      const task = await prisma.task.create({
        data: {
          projectId: params.projectId,
          title: params.title,
          status: params.status || 'Todo',
          assigneeId: params.assigneeId || userId,
        },
      })
      return { id: task.id, type: 'task', ...task }
      
    case 'update':
      const updatedTask = await prisma.task.update({
        where: { id: params.taskId },
        data: {
          status: params.status,
          assigneeId: params.assigneeId,
        },
      })
      return { id: updatedTask.id, type: 'task', ...updatedTask }
      
    default:
      throw new Error(`Unknown task action: ${action}`)
  }
}

async function executeProjectTool(action: string, params: any, userId: string) {
  switch (action) {
    case 'update_status':
      const project = await prisma.project.update({
        where: { id: params.projectId },
        data: {
          status: params.status,
        },
      })
      return { id: project.id, type: 'project', ...project }
      
    default:
      throw new Error(`Unknown project action: ${action}`)
  }
}

async function executeUpdateTool(action: string, params: any, userId: string) {
  switch (action) {
    case 'create':
      const update = await prisma.update.create({
        data: {
          projectId: params.projectId,
          authorId: userId,
          body: params.body || 'Status update',
        },
      })
      return { id: update.id, type: 'update', ...update }
      
    default:
      throw new Error(`Unknown update action: ${action}`)
  }
}