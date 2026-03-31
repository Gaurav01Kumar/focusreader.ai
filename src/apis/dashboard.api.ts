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
         const { getToken } = useAuth();
        const response = await apiRequest.post(getBaseDomain() + "recent", payload,{
            headers: {
                Authorization: `Bearer ${getToken}`,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}
    public async getRecentFiles() {
    try {
        const { getToken } = useAuth();
        const response = await apiRequest.get(getBaseDomain() + "recent",{
            headers: {
                Authorization: `Bearer ${getToken}`,
            },
        });
        return response;
    } catch (error) {
        return error
    }
}
    public async deleteRecentFile(id: string) {
    try {
        const { getToken } = useAuth();
        const response = await apiRequest.delete(getBaseDomain() + "recent/" + id,{
            headers: {
                Authorization: `Bearer ${getToken}`,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}
    public async createFolder(payload: any) {
    try {
        const { getToken } = useAuth();
        const response = await apiRequest.post(getBaseDomain() + "folders", payload,{
            headers: {
                Authorization: `Bearer ${getToken}`,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}
    
    public async getFolders() {
    try {
        const { getToken } = useAuth();
        const response = await apiRequest.get(getBaseDomain() + "folders",{
            headers: {
                Authorization: `Bearer ${getToken}`,
            },
        });
        return response;
    } catch (error) {
        return error;
    }
}
    public async deleteFolder(id: string) {
    try {
        const { getToken } = useAuth();
        const response = await apiRequest.delete(getBaseDomain() + "folders/" + id,{
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