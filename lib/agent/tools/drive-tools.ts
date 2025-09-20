import { z } from "zod";
import { ToolDefinition } from "../tool-registry";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

// Schemas for Google Drive tools
const uploadFileSchema = z.object({
  fileName: z.string().describe("Name of the file to upload"),
  content: z
    .string()
    .describe("File content (base64 encoded for binary files)"),
  mimeType: z
    .string()
    .describe("MIME type of the file (e.g., text/plain, application/pdf)"),
  folderId: z.string().optional().describe("Optional folder ID to upload to"),
  description: z.string().optional().describe("Optional file description"),
});

const downloadFileSchema = z.object({
  fileId: z.string().describe("Google Drive file ID to download"),
});

const createFolderSchema = z.object({
  name: z.string().describe("Folder name"),
  parentId: z.string().optional().describe("Parent folder ID"),
});

const shareFileSchema = z.object({
  fileId: z.string().describe("File or folder ID to share"),
  email: z.string().describe("Email address to share with"),
  role: z.enum(["reader", "writer", "commenter"]).default("reader"),
  notify: z.boolean().optional().default(true),
});

const searchFilesSchema = z.object({
  query: z
    .string()
    .describe("Search query (e.g., 'name contains \"project\"')"),
  folderId: z.string().optional().describe("Folder ID to search within"),
  limit: z.number().optional().default(10),
});

const listFilesSchema = z.object({
  folderId: z.string().optional().describe("Folder ID to list files from"),
  pageSize: z.number().optional().default(20),
  pageToken: z.string().optional(),
});

const moveFileSchema = z.object({
  fileId: z.string().describe("File ID to move"),
  newParentId: z.string().describe("New parent folder ID"),
  oldParentId: z.string().optional().describe("Current parent folder ID"),
});

const deleteFileSchema = z.object({
  fileId: z.string().describe("File or folder ID to delete"),
});

export const driveTools: ToolDefinition[] = [
  {
    name: "uploadToDrive",
    description: "Upload a file to Google Drive",
    schema: uploadFileSchema,
    mutates: true,
    scopes: ["integration:drive", "file:write"],
    handler: async (ctx, input) => {
      try {
        const drive = GoogleDriveService.getInstance();

        // Handle base64 content if needed
        const buffer = input.content.includes("base64,")
          ? Buffer.from(input.content.split("base64,")[1], "base64")
          : Buffer.from(input.content);

        const file = await drive.uploadFile(
          ctx.userId,
          input.fileName,
          input.mimeType,
          buffer,
          input.folderId
        );

        // Log the upload if we have a projectId
        if (ctx.projectId) {
          await prisma.document.create({
            data: {
              id: `gdrive_${file.id}`,
              projectId: ctx.projectId,
              title: input.fileName,
              source: "google_drive",
              sourceId: file.id,
              url: `https://drive.google.com/file/d/${file.id}`,
              updatedAt: new Date(),
              metadata: {
                driveFileId: file.id,
                folderId: input.folderId,
                uploadedBy: ctx.userId,
              },
            },
          });
        }

        return {
          success: true,
          fileId: file.id,
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          message: `File "${input.fileName}" uploaded successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to upload file to Google Drive",
        };
      }
    },
  },

  {
    name: "downloadFromDrive",
    description: "Download a file from Google Drive",
    schema: downloadFileSchema,
    mutates: false,
    scopes: ["integration:drive", "file:read"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        const result = await drive.downloadFile(ctx.userId, input.fileId);

        return {
          success: true,
          fileName: result.metadata.name,
          mimeType: result.metadata.mimeType,
          content: result.data.toString("base64"),
          size: result.data.length,
          message: `File downloaded successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to download file",
        };
      }
    },
  },

  {
    name: "createDriveFolder",
    description: "Create a folder in Google Drive",
    schema: createFolderSchema,
    mutates: true,
    scopes: ["integration:drive", "file:write"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        const folder = await drive.createFolder(
          ctx.userId,
          input.name,
          input.parentId
        );

        // Store folder reference if it's for a project
        if (ctx.projectId) {
          await prisma.projectIntegration.upsert({
            where: {
              projectId_key: {
                projectId: ctx.projectId,
                key: "google_drive_folder",
              },
            },
            update: {
              value: folder.id,
              metadata: {
                folderId: folder.id,
                folderName: input.name,
              },
              updatedAt: new Date(),
            },
            create: {
              id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              projectId: ctx.projectId,
              key: "google_drive_folder",
              value: folder.id,
              metadata: {
                folderId: folder.id,
                folderName: input.name,
              },
              updatedAt: new Date(),
            },
          });
        }

        return {
          success: true,
          folderId: folder.id,
          webViewLink: folder.webViewLink,
          message: `Folder "${input.name}" created successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to create folder",
        };
      }
    },
  },

  {
    name: "shareDriveFile",
    description: "Share a Google Drive file or folder with someone",
    schema: shareFileSchema,
    mutates: true,
    scopes: ["integration:drive", "file:share"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        await drive.shareFile(
          ctx.userId,
          input.fileId,
          input.email,
          input.role
        );
        // Note: notify parameter is not supported by the current GoogleDriveService implementation

        return {
          success: true,
          message: `Shared with ${input.email} as ${input.role}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to share file",
        };
      }
    },
  },

  {
    name: "searchDriveFiles",
    description: "Search for files in Google Drive",
    schema: searchFilesSchema,
    mutates: false,
    scopes: ["integration:drive", "file:read"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        const files = await drive.searchFiles(
          ctx.userId,
          input.query,
          input.limit
        );

        return {
          success: true,
          files: files.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
            size: f.size,
            webViewLink: f.webViewLink,
          })),
          count: files.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to search files",
        };
      }
    },
  },

  {
    name: "listDriveFiles",
    description: "List files and folders in Google Drive",
    schema: listFilesSchema,
    mutates: false,
    scopes: ["integration:drive", "file:read"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        const files = await drive.listFiles(ctx.userId, input.folderId);

        // Note: Pagination is not currently supported by GoogleDriveService
        // We'll slice the results based on pageSize for now
        const startIndex = 0;
        const endIndex = input.pageSize || 20;
        const paginatedFiles = files.slice(startIndex, endIndex);

        return {
          success: true,
          files: paginatedFiles.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
            size: f.size,
            isFolder: f.mimeType === "application/vnd.google-apps.folder",
          })),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to list files",
        };
      }
    },
  },

  // TODO: Implement moveFile in GoogleDriveService
  // {
  //   name: "moveDriveFile",
  //   description: "Move a file or folder to a different location in Google Drive",
  //   schema: moveFileSchema,
  //   mutates: true,
  //   scopes: ["integration:drive", "file:write"],
  //   handler: async (ctx, input) => {
  //     try {
  //       const integration = await prisma.integrationCredential.findFirst({
  //         where: {
  //           userId: ctx.userId,
  //           type: "google_drive",
  //         }
  //       });

  //       if (!integration) {
  //         throw new Error("Google Drive not connected");
  //       }

  //       const drive = GoogleDriveService.getInstance();
  //       const file = await drive.moveFile(
  //         ctx.userId,
  //         input.fileId,
  //         input.newParentId,
  //         input.oldParentId
  //       );

  //       return {
  //         success: true,
  //         fileId: file.id,
  //         message: `File moved successfully`
  //       };
  //     } catch (error: any) {
  //       return {
  //         success: false,
  //         error: error.message || "Failed to move file"
  //       };
  //     }
  //   }
  // },

  {
    name: "deleteDriveFile",
    description: "Delete a file or folder from Google Drive",
    schema: deleteFileSchema,
    mutates: true,
    scopes: ["integration:drive", "file:delete"],
    handler: async (ctx, input) => {
      try {
        const integration = await prisma.integrationCredential.findFirst({
          where: {
            userId: ctx.userId,
            type: "google_drive",
          },
        });

        if (!integration) {
          throw new Error("Google Drive not connected");
        }

        const drive = GoogleDriveService.getInstance();
        await drive.deleteFile(ctx.userId, input.fileId);

        // Remove from database if tracked
        await prisma.document.deleteMany({
          where: {
            metadata: {
              path: ["driveFileId"],
              equals: input.fileId,
            },
          },
        });

        return {
          success: true,
          message: "File deleted successfully",
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to delete file",
        };
      }
    },
  },
];
