import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "../handlers/api.request";
import { Folder, RecentFile } from "../types";
import { getBaseDomain } from "../utils";

export class DashboardApi {
  private static instance: DashboardApi;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = getBaseDomain();
  }

  public static getInstance(): DashboardApi {
    if (!DashboardApi.instance) {
      DashboardApi.instance = new DashboardApi();
    }
    return DashboardApi.instance;
  }

  public async handleOpenNewFile(payload: any) {
    try {
      const response = await apiRequest.post(
        getBaseDomain() + "recent",
        payload,
      );
      return response;
    } catch (error) {
      return error;
    }
  }
  public async getRecentFiles() {
    try {
      const response = await apiRequest.get(getBaseDomain() + "recent");
      return response;
    } catch (error) {
      return error;
    }
  }
  public async deleteRecentFile(id: string) {
    try {
      const response = await apiRequest.delete(
        getBaseDomain() + "recent/" + id,
      );
      return response;
    } catch (error) {
      return error;
    }
  }
  public async createFolder(payload: any) {
    try {
      const response = await apiRequest.post(
        getBaseDomain() + "folders",
        payload,
      );
      return response;
    } catch (error) {
      return error;
    }
  }

  public async getFolders() {
    try {
      const response = await apiRequest.get(getBaseDomain() + "folders");
      return response;
    } catch (error) {
      return error;
    }
  }
  public async deleteFolder(id: string) {
    try {
      const response = await apiRequest.delete(
        getBaseDomain() + "folders/" + id,
      );
      return response;
    } catch (error) {
      return error;
    }
  }
  public async getNotesByFolder(folderid: string) {
    try {
      const response = await apiRequest.get(
        getBaseDomain() + "notes?folderId=" + folderid,
      );
      return response;
    } catch (error) {
      return error;
    }
  }
}
