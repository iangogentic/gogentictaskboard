import { AgentTool, ToolResult } from "../types";
import { SlackService } from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export const sendSlackMessageTool: AgentTool = {
  name: "send_slack_message",
  description: "Send a message to a Slack channel or user",
  parameters: {
    channel: { type: "string", required: true },
    text: { type: "string", required: true },
    blocks: { type: "array", required: false },
    threadTs: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const slackService = SlackService.getInstance();
      await slackService.sendMessage({
        channel: params.channel,
        text: params.text,
        blocks: params.blocks,
        threadTs: params.threadTs,
      });

      return {
        success: true,
        data: { messageSent: true },
        metadata: { channel: params.channel },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const linkSlackChannelTool: AgentTool = {
  name: "link_slack_channel",
  description: "Link a project to a Slack channel for updates",
  parameters: {
    projectId: { type: "string", required: true },
    channelId: { type: "string", required: true },
    channelName: { type: "string", required: true },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const slackService = SlackService.getInstance();
      await slackService.linkProjectToChannel(
        params.projectId,
        params.channelId,
        params.channelName
      );

      return {
        success: true,
        data: { linked: true },
        metadata: {
          projectId: params.projectId,
          channelId: params.channelId,
          channelName: params.channelName,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
