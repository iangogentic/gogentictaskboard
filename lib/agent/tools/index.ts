import { AgentTool, ToolResult } from "../types";
import { createProjectTool } from "./project-tools";
import { createTaskTool, updateTaskTool, listTasksTool } from "./task-tools";
import { createUpdateTool, listUpdatesTool } from "./update-tools";
import { searchTool } from "./search-tools";
import { sendSlackMessageTool, linkSlackChannelTool } from "./slack-tools";
import {
  createDriveFolderTool,
  uploadFileTool,
  searchDriveFilesTool,
} from "./drive-tools";
import { analyzeTool, summarizeTool, generateTool } from "./ai-tools";
import { getRAGTools } from "./rag-tools";

// Registry of all available tools
export const toolRegistry: Map<string, AgentTool> = new Map();

// Register all tools
export function registerTools() {
  // Project tools
  toolRegistry.set("create_project", createProjectTool);

  // Task tools
  toolRegistry.set("create_task", createTaskTool);
  toolRegistry.set("update_task", updateTaskTool);
  toolRegistry.set("list_tasks", listTasksTool);

  // Update tools
  toolRegistry.set("create_update", createUpdateTool);
  toolRegistry.set("list_updates", listUpdatesTool);

  // Search tools
  toolRegistry.set("search", searchTool);

  // Slack tools
  toolRegistry.set("send_slack_message", sendSlackMessageTool);
  toolRegistry.set("link_slack_channel", linkSlackChannelTool);

  // Google Drive tools
  toolRegistry.set("create_drive_folder", createDriveFolderTool);
  toolRegistry.set("upload_file", uploadFileTool);
  toolRegistry.set("search_drive_files", searchDriveFilesTool);

  // AI tools
  toolRegistry.set("analyze", analyzeTool);
  toolRegistry.set("summarize", summarizeTool);
  toolRegistry.set("generate", generateTool);

  // RAG tools
  const ragTools = getRAGTools();
  for (const tool of ragTools) {
    toolRegistry.set(tool.name, tool as any);
  }
}

// Get a tool by name
export function getTool(name: string): AgentTool | undefined {
  return toolRegistry.get(name);
}

// Get all tools
export function getAllTools(): AgentTool[] {
  return Array.from(toolRegistry.values());
}

// Get tools by category
export function getToolsByCategory(category: string): AgentTool[] {
  return getAllTools().filter((tool) => {
    // Tool categorization logic
    if (category === "project" && tool.name.includes("project")) return true;
    if (category === "task" && tool.name.includes("task")) return true;
    if (
      category === "integration" &&
      (tool.name.includes("slack") || tool.name.includes("drive"))
    )
      return true;
    if (
      category === "ai" &&
      (tool.name.includes("analyze") ||
        tool.name.includes("summarize") ||
        tool.name.includes("generate"))
    )
      return true;
    return false;
  });
}

// Initialize tools on startup
registerTools();
