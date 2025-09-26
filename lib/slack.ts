import { WebClient } from "@slack/web-api";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export interface SlackConfig {
  workspaceId?: string;
  botToken?: string;
  signingSecret?: string;
  appId?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  threadTs?: string;
}

export interface DailyWorkSummary {
  userId: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    projectTitle: string;
    dueDate?: Date;
  }>;
  blockedTasks: Array<{
    id: string;
    title: string;
    projectTitle: string;
  }>;
  completedToday: number;
  inProgress: number;
}

export class SlackService {
  private static instance: SlackService;
  private client: WebClient;

  private constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN);
  }

  static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  // Send a message to a Slack channel
  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      const result = await this.client.chat.postMessage({
        channel: message.channel,
        text: message.text,
        blocks: message.blocks,
        thread_ts: message.threadTs,
      });

      // Log the message
      await AuditLogger.logSuccess(
        "system",
        "slack_message",
        "integration" as any,
        result.ts,
        {
          channel: message.channel,
          messageTs: result.ts,
        }
      );
    } catch (error: any) {
      await AuditLogger.logFailure(
        "system",
        "slack_message",
        "integration" as any,
        error.message,
        undefined,
        { channel: message.channel }
      );
      throw error;
    }
  }

  // Send daily "My Work" DM to a user
  async sendDailyWorkDM(
    userId: string,
    summary: DailyWorkSummary
  ): Promise<void> {
    try {
      // Get user's Slack ID from integration credentials
      const userIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId,
          type: "slack",
        },
      });

      if (!userIntegration || !userIntegration.metadata) {
        console.log(`No Slack integration found for user ${userId}`);
        return;
      }

      const slackUserId = (userIntegration.metadata as any).slackUserId;
      if (!slackUserId) {
        console.log(`No Slack user ID found for user ${userId}`);
        return;
      }

      // Build the message blocks
      const blocks = this.buildDailyWorkBlocks(summary);

      // Open a DM channel with the user
      const dmChannel = await this.client.conversations.open({
        users: slackUserId,
      });

      if (!dmChannel.channel?.id) {
        throw new Error("Failed to open DM channel");
      }

      // Send the message
      await this.sendMessage({
        channel: dmChannel.channel.id,
        text: `Here's your daily work summary for today`,
        blocks,
      });
    } catch (error: any) {
      console.error(`Failed to send daily work DM to user ${userId}:`, error);
      throw error;
    }
  }

  // Build message blocks for daily work summary
  private buildDailyWorkBlocks(summary: DailyWorkSummary): any[] {
    const blocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 Your Daily Work Summary",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Completed Today:*\n${summary.completedToday} tasks`,
          },
          {
            type: "mrkdwn",
            text: `*In Progress:*\n${summary.inProgress} tasks`,
          },
        ],
      },
    ];

    // Add in-progress tasks
    if (summary.tasks.length > 0) {
      blocks.push({
        type: "divider",
      });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🚀 Your Active Tasks:*",
        },
      });

      summary.tasks.slice(0, 5).forEach((task) => {
        const dueText = task.dueDate
          ? ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`
          : "";
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `• *${task.title}*\n  _${task.projectTitle}_ • ${task.status}${dueText}`,
          },
        });
      });
    }

    // Add blocked tasks
    if (summary.blockedTasks.length > 0) {
      blocks.push({
        type: "divider",
      });
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🚧 Blocked Tasks:*",
        },
      });

      summary.blockedTasks.forEach((task) => {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `• *${task.title}*\n  _${task.projectTitle}_`,
          },
        });
      });
    }

    // Add action buttons
    blocks.push({
      type: "divider",
    });
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Dashboard",
            emoji: true,
          },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/my-work`,
          action_id: "view_dashboard",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Update Status",
            emoji: true,
          },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/projects`,
          action_id: "update_status",
        },
      ],
    });

    return blocks;
  }

  // Link a project to a Slack channel
  async linkProjectToChannel(
    projectId: string,
    channelId: string,
    channelName: string
  ): Promise<void> {
    try {
      // Store the channel ID in project integrations
      await prisma.projectIntegration.upsert({
        where: {
          projectId_key: {
            projectId,
            key: "slackChannelId",
          },
        },
        create: {
          id: `${projectId}_slackChannelId_${Date.now()}`,
          projectId,
          key: "slackChannelId",
          value: channelId,
          metadata: {
            channelName,
            linkedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
        update: {
          value: channelId,
          metadata: {
            channelName,
            linkedAt: new Date().toISOString(),
          },
        },
      });

      // Send a confirmation message to the channel
      await this.sendMessage({
        channel: channelId,
        text: `This channel has been linked to a project! I'll post updates here.`,
      });

      // Log the integration
      await AuditLogger.logSuccess(
        "system",
        "link_integration",
        "integration" as any,
        projectId,
        {
          type: "slack",
          channelId,
          channelName,
        }
      );
    } catch (error: any) {
      await AuditLogger.logFailure(
        "system",
        "link_integration",
        "integration" as any,
        error.message,
        projectId
      );
      throw error;
    }
  }

  // Send project update to linked Slack channel
  async sendProjectUpdate(
    projectId: string,
    update: {
      type:
        | "task_created"
        | "task_completed"
        | "status_changed"
        | "blocker"
        | "update";
      title: string;
      description: string;
      author: string;
      url?: string;
    }
  ): Promise<void> {
    try {
      // Get the linked Slack channel
      const integration = await prisma.projectIntegration.findUnique({
        where: {
          projectId_key: {
            projectId,
            key: "slackChannelId",
          },
        },
      });

      if (!integration) {
        console.log(`No Slack channel linked to project ${projectId}`);
        return;
      }

      // Build the message
      const emoji = this.getEmojiForUpdateType(update.type);
      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *${update.title}*\n${update.description}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `By ${update.author} • ${new Date().toLocaleString()}`,
            },
          ],
        },
      ];

      if (update.url) {
        blocks.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Portal",
                emoji: true,
              } as any,
              url: update.url,
              action_id: "view_in_portal",
            } as any,
          ],
        });
      }

      // Send the message
      await this.sendMessage({
        channel: integration.value,
        text: update.title,
        blocks,
      });
    } catch (error: any) {
      console.error(`Failed to send project update for ${projectId}:`, error);
    }
  }

  private getEmojiForUpdateType(type: string): string {
    switch (type) {
      case "task_created":
        return "✨";
      case "task_completed":
        return "✅";
      case "status_changed":
        return "🔄";
      case "blocker":
        return "🚧";
      case "update":
        return "📝";
      default:
        return "📌";
    }
  }

  // Get list of Slack channels
  async getChannels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const result = await this.client.conversations.list({
        types: "public_channel,private_channel",
        exclude_archived: true,
        limit: 100,
      });

      return (
        result.channels?.map((channel) => ({
          id: channel.id!,
          name: channel.name!,
        })) || []
      );
    } catch (error: any) {
      console.error("Failed to get Slack channels:", error);
      throw error;
    }
  }

  // Test Slack connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      return result.ok || false;
    } catch (error) {
      console.error("Slack connection test failed:", error);
      return false;
    }
  }

  // Send daily project update request to user
  async sendProjectUpdateRequest(
    userId: string,
    projects: Array<{
      id: string;
      title: string;
      notes: string | null;
      status: string;
      lastUpdatedAt: Date;
    }>,
    baseUrl: string
  ): Promise<void> {
    try {
      // Get user's Slack ID from integration credentials
      const userIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId,
          type: "slack",
        },
      });

      if (!userIntegration) {
        console.log(`No Slack integration found for user ${userId}`);
        return;
      }

      // Get Slack user ID - try multiple possible locations
      const metadata = userIntegration.metadata as any;
      const data = userIntegration.data as any;

      const slackUserId =
        metadata?.slackUserId ||
        data?.authedUser?.id ||
        data?.user?.id ||
        data?.user_id;

      if (!slackUserId) {
        console.log(`No Slack user ID found for user ${userId}`);
        return;
      }

      // Build the message blocks with clickable project links
      const blocks = this.buildProjectUpdateBlocks(projects, baseUrl);

      // Open a DM channel with the user
      const dmChannel = await this.client.conversations.open({
        users: slackUserId,
      });

      if (!dmChannel.channel?.id) {
        throw new Error("Failed to open DM channel");
      }

      // Send the message
      await this.sendMessage({
        channel: dmChannel.channel.id,
        text: `Daily Project Update Request - ${projects.length} projects need updates`,
        blocks,
      });

      console.log(
        `Sent project update request to user ${userId} for ${projects.length} projects`
      );
    } catch (error: any) {
      console.error(
        `Failed to send project update request to user ${userId}:`,
        error
      );
      throw error;
    }
  }

  // Build message blocks for project update request
  private buildProjectUpdateBlocks(
    projects: Array<{
      id: string;
      title: string;
      notes: string | null;
      status: string;
      lastUpdatedAt: Date;
    }>,
    baseUrl: string
  ): any[] {
    const blocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📋 Daily Project Update Request",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Good morning! Please provide status updates for your ${projects.length} active project${projects.length > 1 ? "s" : ""}:`,
        },
      },
      {
        type: "divider",
      },
    ];

    // Add each project as a clickable link
    projects.forEach((project, index) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - project.lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const statusEmoji = this.getStatusEmoji(project.status);
      const updateIndicator =
        daysSinceUpdate > 3 ? "🔴" : daysSinceUpdate > 1 ? "🟡" : "🟢";

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${index + 1}. ${statusEmoji} *<${baseUrl}/projects/${project.id}|${project.title}>*\n   Status: _${project.status}_ | Last updated: _${daysSinceUpdate} day${daysSinceUpdate !== 1 ? "s" : ""} ago_ ${updateIndicator}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Update",
            emoji: true,
          },
          url: `${baseUrl}/projects/${project.id}#update`,
          action_id: `update_project_${project.id}`,
        },
      });

      // Add notes if available
      if (project.notes) {
        blocks.push({
          type: "context",
          elements: [
            {
              type: "plain_text",
              text:
                project.notes.substring(0, 150) +
                (project.notes.length > 150 ? "..." : ""),
              emoji: false,
            },
          ],
        });
      }
    });

    // Add footer with action buttons
    blocks.push({
      type: "divider",
    });

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "_Click on any project name to view details or use the Update button to add a status update._",
      },
    });

    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📊 View All Projects",
            emoji: true,
          },
          url: `${baseUrl}/projects`,
          action_id: "view_all_projects",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "➕ Create New Project",
            emoji: true,
          },
          url: `${baseUrl}/projects/new`,
          action_id: "create_project",
        },
      ],
    });

    return blocks;
  }

  // Helper to get status emoji
  private getStatusEmoji(status: string): string {
    switch (status) {
      case "Not Started":
        return "📝";
      case "In Progress":
        return "🚀";
      case "Review":
        return "👀";
      case "Blocked":
        return "🚧";
      case "Done":
        return "✅";
      default:
        return "📌";
    }
  }
}

// Export singleton instance as slackService
export const slackService = SlackService.getInstance();
