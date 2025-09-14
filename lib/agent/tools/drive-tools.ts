import { AgentTool, ToolResult } from "../types";
import { GoogleDriveService } from "@/lib/google-drive";

export const createDriveFolderTool: AgentTool = {
  name: "create_drive_folder",
  description: "Create a folder in Google Drive",
  parameters: {
    userId: { type: "string", required: true },
    folderName: { type: "string", required: true },
    parentFolderId: { type: "string", required: false },
    projectId: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const googleDrive = GoogleDriveService.getInstance();

      if (params.projectId) {
        const result = await googleDrive.createProjectFolderStructure(
          params.userId,
          params.projectId,
          params.folderName
        );

        return {
          success: true,
          data: result,
          metadata: {
            folderId: result.rootFolder.id,
            projectId: params.projectId,
          },
        };
      } else {
        const folder = await googleDrive.createFolder(
          params.userId,
          params.folderName,
          params.parentFolderId
        );

        return {
          success: true,
          data: folder,
          metadata: { folderId: folder.id },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const uploadFileTool: AgentTool = {
  name: "upload_file",
  description: "Upload a file to Google Drive",
  parameters: {
    userId: { type: "string", required: true },
    fileName: { type: "string", required: true },
    mimeType: { type: "string", required: true },
    content: { type: "string", required: true },
    folderId: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const googleDrive = GoogleDriveService.getInstance();
      const file = await googleDrive.uploadFile(
        params.userId,
        params.fileName,
        params.mimeType,
        Buffer.from(params.content),
        params.folderId
      );

      return {
        success: true,
        data: file,
        metadata: {
          fileId: file.id,
          webViewLink: file.webViewLink,
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

export const searchDriveFilesTool: AgentTool = {
  name: "search_drive_files",
  description: "Search for files in Google Drive",
  parameters: {
    userId: { type: "string", required: true },
    query: { type: "string", required: true },
    mimeType: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const googleDrive = GoogleDriveService.getInstance();
      const files = await googleDrive.searchFiles(
        params.userId,
        params.query,
        params.mimeType
      );

      return {
        success: true,
        data: files,
        metadata: {
          count: files.length,
          query: params.query,
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
