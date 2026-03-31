import { useAuth } from "@clerk/clerk-react";
import { apiRequest } from "../handlers/api.request";
import { Folder, RecentFile } from "../types";
import { getBaseDomain } from "../utils";

export class ReaderApi {
    private static instance: ReaderApi;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = getBaseDomain();
    }

    public static getInstance(): ReaderApi {
        if (!ReaderApi.instance) {
            ReaderApi.instance = new ReaderApi();
        }
        return ReaderApi.instance;
    }

    public async getRecentFileId(id: string) {
        try {
            const { getToken } = useAuth();
            const response = await apiRequest.get(getBaseDomain() + "recent/" + id, {
                headers: {
                    Authorization: `Bearer ${getToken}`,
                },
            });
            return response;
        } catch (error) {
            return error;
        }
    }
    public async saveNote(payload: any) {
        try {
            const { getToken } = useAuth();
            const response = await apiRequest.post(getBaseDomain() + "notes", payload, {
                headers: {
                    Authorization: `Bearer ${getToken}`,
                },
            });
            return response;
        } catch (error) {
            return error;
        }
    }
    public async getNotesByPdfId(id: string) {
        try {
            const { getToken } = useAuth();
            const response = await apiRequest.get(getBaseDomain() + "notes/by-pdf-id?fileId=" + id, {
                headers: {
                    Authorization: `Bearer ${getToken}`,
                },
            });
            return response;

        } catch (error) {
            return error;
        }
    }
    public async deleteNote(id: string) {
        try {
            const { getToken } = useAuth();
            const response = await apiRequest.delete(getBaseDomain() + "notes/" + id, {
                headers: {
                    Authorization: `Bearer ${getToken}`,
                },
            });
            return response;
        } catch (error) {
            return error;
        }
    }




}