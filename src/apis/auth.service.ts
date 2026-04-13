import { apiRequest } from "../handlers/api.request";
import { getBaseDomain } from "../utils";

export class AuthApiService {
  private static instance: AuthApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = getBaseDomain();
  }

  public static getInstance(): AuthApiService {
    if (!AuthApiService.instance) {
      AuthApiService.instance = new AuthApiService();
    }
    return AuthApiService.instance;
  }
  async checkAuth() {
    try {
      const respone = await apiRequest.get(`${this.baseUrl}auth/me`);
      return respone;
    } catch (error) {
      return error;
    }
  }
  async logout() {
    try {
      const respone = await apiRequest.post(`${this.baseUrl}auth/logout`, {});
      return respone;
    } catch (error) {
      return error;
    }
  }
}
