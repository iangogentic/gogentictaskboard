import { z } from "zod";
import { ToolDefinition } from "../tool-registry";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

// Schemas for Slack tools
const sendMessageSchema = z.object({
  channel: z
    .string()
    .describe("Slack channel ID or name (e.g., #general or C1234567890)"),
  text: z.string().describe("Message text to send"),
  blocks: z
    .array(z.any())
    .optional()
    .describe("Optional Slack Block Kit blocks for rich formatting"),
  threadTs: z.string().optional().describe("Thread timestamp to reply to"),
});

const linkProjectSchema = z.object({
  projectId: z.string().describe("Project ID to link"),
  channelId: z.string().describe("Slack channel ID to link to"),
  notificationTypes: z
    .array(z.enum(["updates", "tasks", "dailySummary"]))
    .optional(),
});

const sendDailySummarySchema = z.object({
  userId: z.string().describe("User ID to send summary to"),
  projectId: z
    .string()
    .optional()
    .describe("Optional project ID to filter summary"),
});

const listChannelsSchema = z.object({
  types: z
    .string()
    .optional()
    .default("public_channel")
    .describe("Channel types: public_channel, private_channel, mpim, im"),
  limit: z
    .number()
    .optional()
    .default(20)
    .describe("Maximum number of channels to return"),
});

const getUserInfoSchema = z.object({
  email: z.string().optional().describe("Email to look up user by"),
  userId: z.string().optional().describe("Slack user ID"),
});

export const slackTools: ToolDefinition[] = [
  {
    name: "sendSlackMessage",
    description: "Send a message to a Slack channel or thread",
    schema: sendMessageSchema,
    mutates: true,
    scopes: ["integration:slack"],
    handler: async (ctx, input) => {
      try {
        const slack = SlackService.getInstance();

        // Ensure we have Slack integration
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "slack",
          },
        });

        if (!integration) {
          throw new Error("Slack integration not configured for this user");
        }

        await slack.sendMessage({
          channel: input.channel,
          text: input.text,
          blocks: input.blocks,
          threadTs: input.threadTs,
        });

        return {
          success: true,
          channel: input.channel,
          message: "Message sent successfully",
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to send Slack message",
        };
      }
    },
  },

  {
    name: "linkProjectToSlack",
    description: "Link a project to a Slack channel for notifications",
    schema: linkProjectSchema,
    mutates: true,
    scopes: ["integration:slack", "project:write"],
    handler: async (ctx, input) => {
      try {
        const slack = SlackService.getInstance();

        // Verify project exists
        const project = await prisma.project.findFirst({
          where: {
            id: input.projectId,
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        await slack.linkProjectToChannel(
          input.projectId,
          input.channelId,
          input.notificationTypes
        );

        // Store the integration link
        await prisma.projectIntegration.upsert({
          where: {
            projectId_key: {
              projectId: input.projectId,
              key: "slack_channel",
            },
          },
          update: {
            value: input.channelId,
            metadata: {
              channelId: input.channelId,
              notificationTypes: input.notificationTypes || [
                "updates",
                "tasks",
              ],
            },
            updatedAt: new Date(),
          },
          create: {
            id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            projectId: input.projectId,
            key: "slack_channel",
            value: input.channelId,
            metadata: {
              channelId: input.channelId,
              notificationTypes: input.notificationTypes || [
                "updates",
                "tasks",
              ],
            },
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Project linked to Slack channel ${input.channelId}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to link project to Slack",
        };
      }
    },
  },

  {
    name: "sendSlackDailySummary",
    description: "Send a daily work summary to a user via Slack DM",
    schema: sendDailySummarySchema,
    mutates: true,
    scopes: ["integration:slack"],
    handler: async (ctx, input) => {
      try {
        const slack = SlackService.getInstance();

        const targetUserId = input.userId || ctx.userId;

        // Get today's tasks and updates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const whereClause: any = {
          assigneeId: targetUserId,
          updatedAt: {
            gte: today,
          },
        };

        if (input.projectId) {
          whereClause.projectId = input.projectId;
        }

        const tasks = await prisma.task.findMany({
          where: whereClause,
          include: {
            project: true,
          },
        });

        // Build daily work summary
        const summary = {
          userId: targetUserId,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            projectTitle: t.project?.title || "Unknown Project",
            dueDate: t.dueDate || undefined,
          })),
          blockedTasks: tasks
            .filter((t) => t.status === "blocked")
            .map((t) => ({
              id: t.id,
              title: t.title,
              projectTitle: t.project?.title || "Unknown Project",
            })),
          completedToday: tasks.filter((t) => t.status === "completed").length,
          inProgress: tasks.filter((t) => t.status === "in-progress").length,
        };

        await slack.sendDailyWorkDM(targetUserId, summary);

        return {
          success: true,
          message: `Daily summary sent to user ${targetUserId}`,
          taskCount: tasks.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to send daily summary",
        };
      }
    },
  },

  {
    name: "listSlackChannels",
    description: "List available Slack channels",
    schema: listChannelsSchema,
    mutates: false,
    scopes: ["integration:slack"],
    handler: async (ctx, input) => {
      try {
        const slack = SlackService.getInstance();

        const channels = await slack.getChannels();

        return {
          success: true,
          channels: channels.map((ch) => ({
            id: ch.id,
            name: ch.name,
          })),
          count: channels.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to list Slack channels",
        };
      }
    },
  },
];
