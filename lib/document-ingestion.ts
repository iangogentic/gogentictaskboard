import { prisma } from "@/lib/prisma";
import { embeddingService } from "@/lib/embeddings";
import { slackService } from "@/lib/slack";
import { GoogleDriveService } from "@/lib/google-drive";
import { Document } from "@prisma/client";

export class DocumentIngestionService {
  /**
   * Ingest a document from various sources
   */
  async ingestDocument(
    projectId: string,
    source: "slack" | "gdrive" | "upload" | "manual",
    title: string,
    content: string,
    sourceId?: string,
    url?: string,
    metadata?: any
  ): Promise<Document> {
    // Create or update document
    const document = await prisma.document.upsert({
      where: {
        projectId_source_sourceId: sourceId
          ? {
              projectId,
              source,
              sourceId,
            }
          : undefined,
      },
      create: {
        projectId,
        title,
        source,
        sourceId,
        url,
        content,
        metadata: metadata || {},
      },
      update: {
        title,
        content,
        url,
        metadata: metadata || {},
        updatedAt: new Date(),
      },
    });

    // Generate embeddings
    await embeddingService.processDocument(document.id, content);

    return document;
  }

  /**
   * Sync Slack messages for a project
   */
  async syncSlackMessages(projectId: string, userId: string): Promise<number> {
    try {
      // Get project's Slack channel
      const projectIntegration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
          key: "slackChannelId",
        },
      });

      if (!projectIntegration) {
        throw new Error("No Slack channel linked to this project");
      }

      const channelId = projectIntegration.value;

      // Get user's Slack credentials
      const userIntegration = await prisma.integrationCredential.findFirst({
        where: {
          userId,
          type: "slack",
        },
      });

      if (!userIntegration) {
        throw new Error("User has not connected Slack");
      }

      // Fetch recent messages
      const messages = await slackService.getChannelMessages(
        userId,
        channelId,
        100 // Last 100 messages
      );

      let ingestedCount = 0;

      for (const message of messages) {
        if (message.text && !message.bot_id) {
          // Only ingest non-bot messages
          await this.ingestDocument(
            projectId,
            "slack",
            `Slack: ${message.user} at ${new Date(parseFloat(message.ts) * 1000).toISOString()}`,
            message.text,
            message.ts,
            undefined,
            {
              user: message.user,
              channel: channelId,
              timestamp: message.ts,
              thread_ts: message.thread_ts,
            }
          );
          ingestedCount++;
        }
      }

      return ingestedCount;
    } catch (error) {
      console.error("Error syncing Slack messages:", error);
      throw error;
    }
  }

  /**
   * Sync Google Drive files for a project
   */
  async syncGoogleDriveFiles(
    projectId: string,
    userId: string
  ): Promise<number> {
    try {
      // Get project's Drive folder
      const projectIntegration = await prisma.projectIntegration.findFirst({
        where: {
          projectId,
          key: "gdriveFolderId",
        },
      });

      if (!projectIntegration) {
        throw new Error("No Google Drive folder linked to this project");
      }

      const folderId = projectIntegration.value;

      // List files in folder
      const files = await GoogleDriveService.getInstance().listFiles(
        userId,
        folderId
      );

      let ingestedCount = 0;

      for (const file of files.files) {
        // Only process text-based files
        if (
          file.mimeType?.includes("text") ||
          file.mimeType?.includes("document") ||
          file.mimeType?.includes("spreadsheet") ||
          file.mimeType === "application/pdf"
        ) {
          try {
            // Download file content
            const content = await GoogleDriveService.getInstance().downloadFile(
              userId,
              file.id!
            );

            let textContent = "";

            // Extract text based on mime type
            if (file.mimeType === "application/pdf" && content.data) {
              try {
                const pdfParse = await import("pdf-parse");
                const pdf = await pdfParse.default(Buffer.from(content.data));
                textContent = pdf.text;
              } catch (error) {
                console.error("Error parsing PDF:", error);
                textContent = "";
              }
            } else if (
              file.mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
              content.data
            ) {
              try {
                const mammoth = await import("mammoth");
                const result = await mammoth.extractRawText({
                  buffer: Buffer.from(content.data),
                });
                textContent = result.value;
              } catch (error) {
                console.error("Error parsing Word document:", error);
                textContent = "";
              }
            } else if (typeof content.data === "string") {
              textContent = content.data;
            }

            if (textContent) {
              await this.ingestDocument(
                projectId,
                "gdrive",
                file.name || "Untitled",
                textContent,
                file.id,
                file.webViewLink,
                {
                  mimeType: file.mimeType,
                  size: file.size,
                  modifiedTime: file.modifiedTime,
                  createdTime: file.createdTime,
                }
              );
              ingestedCount++;
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }

      return ingestedCount;
    } catch (error) {
      console.error("Error syncing Google Drive files:", error);
      throw error;
    }
  }

  /**
   * Ingest project data (tasks, updates, etc.)
   */
  async ingestProjectData(projectId: string): Promise<number> {
    let ingestedCount = 0;

    // Ingest project description
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        updates: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Ingest project overview
    const projectContent = `
Project: ${project.title}
Client: ${project.clientName}
Stage: ${project.stage}
Status: ${project.status}
Notes: ${project.notes || "No notes"}
    `.trim();

    await this.ingestDocument(
      projectId,
      "manual",
      `Project Overview: ${project.title}`,
      projectContent,
      `project_${projectId}`,
      undefined,
      { type: "project_overview" }
    );
    ingestedCount++;

    // Ingest tasks
    for (const task of project.tasks) {
      const taskContent = `
Task: ${task.title}
Status: ${task.status}
Due Date: ${task.dueDate ? task.dueDate.toISOString() : "Not set"}
Notes: ${task.notes || "No notes"}
Estimated Hours: ${task.estimatedHours || "Not estimated"}
Actual Hours: ${task.actualHours}
      `.trim();

      await this.ingestDocument(
        projectId,
        "manual",
        `Task: ${task.title}`,
        taskContent,
        `task_${task.id}`,
        undefined,
        { type: "task", taskId: task.id }
      );
      ingestedCount++;
    }

    // Ingest updates
    for (const update of project.updates) {
      await this.ingestDocument(
        projectId,
        "manual",
        `Update by ${update.author.name || update.author.email}`,
        update.body,
        `update_${update.id}`,
        undefined,
        {
          type: "update",
          updateId: update.id,
          authorId: update.authorId,
        }
      );
      ingestedCount++;
    }

    return ingestedCount;
  }

  /**
   * Full sync for a project
   */
  async syncProject(
    projectId: string,
    userId: string,
    sources: ("slack" | "gdrive" | "project")[] = ["project"]
  ): Promise<{
    total: number;
    slack?: number;
    gdrive?: number;
    project?: number;
  }> {
    const results: any = { total: 0 };

    if (sources.includes("project")) {
      results.project = await this.ingestProjectData(projectId);
      results.total += results.project;
    }

    if (sources.includes("slack")) {
      try {
        results.slack = await this.syncSlackMessages(projectId, userId);
        results.total += results.slack;
      } catch (error) {
        console.error("Slack sync failed:", error);
        results.slack = 0;
      }
    }

    if (sources.includes("gdrive")) {
      try {
        results.gdrive = await this.syncGoogleDriveFiles(projectId, userId);
        results.total += results.gdrive;
      } catch (error) {
        console.error("Google Drive sync failed:", error);
        results.gdrive = 0;
      }
    }

    return results;
  }

  /**
   * Delete all documents for a project
   */
  async deleteProjectDocuments(projectId: string): Promise<void> {
    const documents = await prisma.document.findMany({
      where: { projectId },
    });

    for (const doc of documents) {
      await embeddingService.deleteDocumentEmbeddings(doc.id);
    }

    await prisma.document.deleteMany({
      where: { projectId },
    });
  }
}

export const documentIngestionService = new DocumentIngestionService();
