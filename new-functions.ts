// New functions to add to chat-v2/route.ts

// 1. Add these function definitions to the functions array (after search_content):

export const newFunctionDefinitions = [
  {
    name: "get_users",
    description: "Get list of users in the system",
    parameters: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: "Filter by user role",
          enum: ["admin", "manager", "developer", "viewer"],
        },
        limit: {
          type: "number",
          description: "Maximum number of users to return",
        },
      },
    },
  },
  {
    name: "create_project",
    description: "Create a new project",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Project title",
        },
        clientName: {
          type: "string",
          description: "Client name",
        },
        clientEmail: {
          type: "string",
          description: "Client email address",
        },
        startDate: {
          type: "string",
          description: "Project start date (ISO format)",
        },
        targetDelivery: {
          type: "string",
          description: "Target delivery date (ISO format)",
        },
        status: {
          type: "string",
          description: "Initial project status",
          enum: ["active", "on-hold", "planning"],
        },
        notes: {
          type: "string",
          description: "Project notes or description",
        },
      },
      required: ["title", "clientName"],
    },
  },
  {
    name: "update_project",
    description: "Update an existing project",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to update",
        },
        updates: {
          type: "object",
          description: "Fields to update",
          properties: {
            title: { type: "string" },
            status: {
              type: "string",
              enum: ["active", "completed", "on-hold", "cancelled"],
            },
            health: {
              type: "string",
              enum: ["green", "yellow", "red"],
            },
            notes: { type: "string" },
            targetDelivery: { type: "string" },
          },
        },
      },
      required: ["projectId", "updates"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID for the task",
        },
        title: {
          type: "string",
          description: "Task title",
        },
        status: {
          type: "string",
          description: "Initial task status",
          enum: ["todo", "in-progress", "completed", "blocked"],
        },
        assigneeId: {
          type: "string",
          description: "User ID to assign the task to",
        },
        dueDate: {
          type: "string",
          description: "Task due date (ISO format)",
        },
        estimatedHours: {
          type: "number",
          description: "Estimated hours for the task",
        },
        notes: {
          type: "string",
          description: "Task notes or description",
        },
      },
      required: ["projectId", "title"],
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "Task ID to update",
        },
        updates: {
          type: "object",
          description: "Fields to update",
          properties: {
            title: { type: "string" },
            status: {
              type: "string",
              enum: ["todo", "in-progress", "completed", "blocked"],
            },
            assigneeId: { type: "string" },
            dueDate: { type: "string" },
            actualHours: { type: "number" },
            notes: { type: "string" },
          },
        },
      },
      required: ["taskId", "updates"],
    },
  },
  {
    name: "add_project_update",
    description: "Add an update/comment to a project",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to add update to",
        },
        content: {
          type: "string",
          description: "Update content/message",
        },
        type: {
          type: "string",
          description: "Type of update",
          enum: ["progress", "blocker", "milestone", "general"],
        },
      },
      required: ["projectId", "content"],
    },
  },
];

// 2. Add these case statements to the callFunction switch (before default):

export const newFunctionImplementations = `
      case "get_users": {
        const where: any = {};
        if (args.role) where.role = args.role;
        const limit = args.limit || 20;

        const users = await prisma.user.findMany({
          where,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                projects: true,
                pmProjects: true,
                tasks: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });

        return JSON.stringify({
          success: true,
          data: users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            stats: {
              projectsInvolved: user._count.projects,
              projectsManaging: user._count.pmProjects,
              tasksAssigned: user._count.tasks,
            },
            joinedAt: user.createdAt,
          })),
          count: users.length,
        });
      }

      case "create_project": {
        // For now, we'll create projects without auth
        // Later we can add: const userId = await getCurrentUserId();

        const project = await prisma.project.create({
          data: {
            title: args.title,
            clientName: args.clientName,
            clientEmail: args.clientEmail || "",
            startDate: args.startDate ? new Date(args.startDate) : new Date(),
            targetDelivery: args.targetDelivery
              ? new Date(args.targetDelivery)
              : null,
            status: args.status || "active",
            notes: args.notes || "",
            // For now, assign to first available PM or admin
            pmId: (await prisma.user.findFirst({
              where: { OR: [{ role: "admin" }, { role: "manager" }] },
              select: { id: true }
            }))?.id || "",
            health: "green",
            stage: "discovery",
          },
          include: {
            pm: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return JSON.stringify({
          success: true,
          data: project,
          message: \`Project "\${project.title}" created successfully\`,
        });
      }

      case "update_project": {
        const { projectId, updates } = args;

        const updateData: any = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.status) updateData.status = updates.status;
        if (updates.health) updateData.health = updates.health;
        if (updates.notes) updateData.notes = updates.notes;
        if (updates.targetDelivery)
          updateData.targetDelivery = new Date(updates.targetDelivery);

        updateData.lastUpdatedAt = new Date();

        const project = await prisma.project.update({
          where: { id: projectId },
          data: updateData,
          include: {
            pm: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return JSON.stringify({
          success: true,
          data: project,
          message: \`Project "\${project.title}" updated successfully\`,
        });
      }

      case "create_task": {
        const task = await prisma.task.create({
          data: {
            projectId: args.projectId,
            title: args.title,
            status: args.status || "todo",
            assigneeId: args.assigneeId || null,
            dueDate: args.dueDate ? new Date(args.dueDate) : null,
            estimatedHours: args.estimatedHours || 0,
            actualHours: 0,
            notes: args.notes || "",
            order: 999, // Put at end
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return JSON.stringify({
          success: true,
          data: task,
          message: \`Task "\${task.title}" created successfully\`,
        });
      }

      case "update_task": {
        const { taskId, updates } = args;

        const updateData: any = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.status) updateData.status = updates.status;
        if (updates.assigneeId !== undefined)
          updateData.assigneeId = updates.assigneeId;
        if (updates.dueDate)
          updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
        if (updates.actualHours !== undefined)
          updateData.actualHours = updates.actualHours;
        if (updates.notes) updateData.notes = updates.notes;

        updateData.updatedAt = new Date();

        const task = await prisma.task.update({
          where: { id: taskId },
          data: updateData,
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Update project's lastUpdatedAt
        await prisma.project.update({
          where: { id: task.projectId },
          data: { lastUpdatedAt: new Date() },
        });

        return JSON.stringify({
          success: true,
          data: task,
          message: \`Task "\${task.title}" updated successfully\`,
        });
      }

      case "add_project_update": {
        // For now, use first admin/manager as author
        const author = await prisma.user.findFirst({
          where: { OR: [{ role: "admin" }, { role: "manager" }] },
          select: { id: true }
        });

        const update = await prisma.update.create({
          data: {
            projectId: args.projectId,
            authorId: author?.id || "",
            body: args.content,
            type: args.type || "general",
          },
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                title: true,
              },
            },
          },
        });

        // Update project's lastUpdatedAt
        await prisma.project.update({
          where: { id: args.projectId },
          data: { lastUpdatedAt: new Date() },
        });

        return JSON.stringify({
          success: true,
          data: update,
          message: \`Update added to project "\${update.project.title}"\`,
        });
      }
`;
