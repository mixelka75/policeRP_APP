// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  User, 
  UserCreate, 
  UserUpdate,
  DiscordAuthResponse,
  DiscordStatusResponse,
  UserRefreshResponse,
  TokenRefreshResponse,
  UserRoleCheckResponse,
  UserSearchResponse,
  UserStatisticsResponse,
  RoleCheckAllResponse,
  RoleStatusResponse,
  RoleSyncIssuesResponse,
  SecurityLogResponse,
  Passport,
  PassportCreate,
  PassportUpdate,
  PassportEmergencyUpdate,
  PassportEmergencyResponse,
  PassportSkinResponse,
  PlayerSkinResponse,
  Fine,
  FineCreate,
  FineUpdate,
  PaymentCreate,
  PaymentResponse,
  Payment,
  Log,
  ApiError
} from '@/types';
import { isTokenExpired } from '@/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 15000, // Increased timeout for production
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();

    // Новые методы Discord авторизации
    this.getDiscordLoginUrl = this.getDiscordLoginUrl.bind(this);
    this.refreshUserData = this.refreshUserData.bind(this);
    this.getDiscordStatus = this.getDiscordStatus.bind(this);
    this.checkUserRoles = this.checkUserRoles.bind(this);
    this.activateUser = this.activateUser.bind(this);
    this.deactivateUser = this.deactivateUser.bind(this);
    this.searchUsersByMinecraft = this.searchUsersByMinecraft.bind(this);
    this.searchUsersByDiscord = this.searchUsersByDiscord.bind(this);
    this.getUserStatistics = this.getUserStatistics.bind(this);
    this.checkAllRoles = this.checkAllRoles.bind(this);
    this.getRoleStatus = this.getRoleStatus.bind(this);
    this.getRoleSyncIssues = this.getRoleSyncIssues.bind(this);
    this.getSecurityLogs = this.getSecurityLogs.bind(this);
    this.exportLogs = this.exportLogs.bind(this);
    this.getPassportSkin = this.getPassportSkin.bind(this);
    this.getSkinByDiscordId = this.getSkinByDiscordId.bind(this);
    this.getAvatarByNickname = this.getAvatarByNickname.bind(this);

    // Методы для платежей
    this.createPayment = this.createPayment.bind(this);
    this.getPayments = this.getPayments.bind(this);
    this.getPayment = this.getPayment.bind(this);

    // Старые методы (привязываем к контексту)
    this.login = this.login.bind(this);
    this.loginJson = this.loginJson.bind(this);
    this.getMe = this.getMe.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getPassports = this.getPassports.bind(this);
    this.getPassport = this.getPassport.bind(this);
    this.createPassport = this.createPassport.bind(this);
    this.updatePassport = this.updatePassport.bind(this);
    this.deletePassport = this.deletePassport.bind(this);
    this.updatePassportEmergency = this.updatePassportEmergency.bind(this);
    this.getEmergencyPassports = this.getEmergencyPassports.bind(this);
    this.getFines = this.getFines.bind(this);
    this.getFine = this.getFine.bind(this);
    this.createFine = this.createFine.bind(this);
    this.updateFine = this.updateFine.bind(this);
    this.deleteFine = this.deleteFine.bind(this);
    this.getLogs = this.getLogs.bind(this);
    this.getMyLogs = this.getMyLogs.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.getMyPassport = this.getMyPassport.bind(this);
    this.getMyFines = this.getMyFines.bind(this);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (token && isTokenExpired(token)) {
          this.clearAuthData();
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Only clear auth data and redirect for specific endpoints
          const isAuthEndpoint = error.config?.url?.includes('/auth/me') || 
                                 error.config?.url?.includes('/auth/refresh');
          
          if (isAuthEndpoint) {
            this.clearAuthData();
            if (window.location.pathname !== '/login' && !window.location.pathname.includes('/auth/callback')) {
              window.location.href = '/login';
            }
          }
          
          return Promise.reject({
            detail: 'Сессия истекла. Пожалуйста, войдите в систему заново.',
            code: 'SESSION_EXPIRED'
          });
        }
        
        if (error.response?.status === 403) {
          // Не очищаем данные автоматически для callback процесса
          // Только для обычных API запросов
          const isCallbackFlow = window.location.pathname.includes('/auth/callback') || 
                                window.location.pathname.includes('/login');
          
          if (!isCallbackFlow) {
            this.clearAuthData();
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          
          return Promise.reject({
            detail: (error.response?.data as any)?.detail || 'У вас нет прав доступа к системе',
            code: 'ACCESS_DENIED',
            status: 403
          });
        }
        
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      return {
        detail: 'Сессия истекла. Пожалуйста, войдите в систему заново.',
        code: 'SESSION_EXPIRED'
      };
    }

    if (error.response?.status === 403) {
      return {
        detail: (error.response?.data as any)?.detail || 'У вас нет прав доступа к системе',
        code: 'ACCESS_DENIED',
        status: 403
      };
    }

    if (error.response?.data) {
      return error.response.data as ApiError;
    }

    // More specific error messages
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
      return {
        detail: 'Превышено время ожидания запроса. Проверьте соединение с сервером.',
        code: error.code,
      };
    }

    if (error.code === 'ERR_NETWORK') {
      return {
        detail: 'Ошибка сети. Проверьте подключение к интернету.',
        code: error.code,
      };
    }

    return {
      detail: error.message || 'Произошла неизвестная ошибка',
      code: error.code,
    };
  }

  // ✅ НОВЫЕ ЭНДПОИНТЫ DISCORD АВТОРИЗАЦИИ

  async getDiscordLoginUrl(): Promise<DiscordAuthResponse> {
    try {
      const response = await this.axiosInstance.get<DiscordAuthResponse>('/auth/discord/login');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async refreshUserData(): Promise<UserRefreshResponse> {
    try {
      const response = await this.axiosInstance.post<UserRefreshResponse>('/auth/refresh');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async refreshToken(): Promise<TokenRefreshResponse> {
    try {
      const response = await this.axiosInstance.post<TokenRefreshResponse>('/auth/refresh-token');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getDiscordStatus(): Promise<DiscordStatusResponse> {
    try {
      const response = await this.axiosInstance.get<DiscordStatusResponse>('/auth/discord/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ✅ НОВЫЕ ЭНДПОИНТЫ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ

  async checkUserRoles(userId: number): Promise<UserRoleCheckResponse> {
    try {
      const response = await this.axiosInstance.post<UserRoleCheckResponse>(`/users/${userId}/check-roles`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async activateUser(userId: number): Promise<User> {
    try {
      const response = await this.axiosInstance.post<User>(`/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deactivateUser(userId: number): Promise<User> {
    try {
      const response = await this.axiosInstance.post<User>(`/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async searchUsersByMinecraft(query: string): Promise<UserSearchResponse> {
    try {
      const response = await this.axiosInstance.get<UserSearchResponse>('/users/search/minecraft', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async searchUsersByDiscord(query: string): Promise<UserSearchResponse> {
    try {
      const response = await this.axiosInstance.get<UserSearchResponse>('/users/search/discord', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getUserStatistics(): Promise<UserStatisticsResponse> {
    try {
      const response = await this.axiosInstance.get<UserStatisticsResponse>('/users/statistics');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ✅ НОВЫЕ ЭНДПОИНТЫ УПРАВЛЕНИЯ РОЛЯМИ

  async checkAllRoles(): Promise<RoleCheckAllResponse> {
    try {
      const response = await this.axiosInstance.post<RoleCheckAllResponse>('/roles/check-all');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getRoleStatus(): Promise<RoleStatusResponse> {
    try {
      const response = await this.axiosInstance.get<RoleStatusResponse>('/roles/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getRoleSyncIssues(): Promise<RoleSyncIssuesResponse> {
    try {
      const response = await this.axiosInstance.get<RoleSyncIssuesResponse>('/roles/sync-issues');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ✅ НОВЫЕ ЭНДПОИНТЫ ЛОГОВ

  async getSecurityLogs(days: number = 7): Promise<SecurityLogResponse> {
    try {
      const response = await this.axiosInstance.get<SecurityLogResponse>('/logs/security', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async exportLogs(format: string = 'json', days: number = 30): Promise<Blob> {
    try {
      const response = await this.axiosInstance.get('/logs/export', {
        params: { format, days },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ❌ УСТАРЕВШИЕ МЕТОДЫ (сохранены для обратной совместимости, но не используются)

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await this.axiosInstance.post<AuthResponse>(
        '/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async loginJson(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(
        '/auth/login-json',
        credentials
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async createUser(userData: UserCreate): Promise<User> {
    try {
      const response = await this.axiosInstance.post<User>('/users/', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async updateUser(id: number, userData: UserUpdate): Promise<User> {
    try {
      const response = await this.axiosInstance.put<User>(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deleteUser(id: number): Promise<User> {
    try {
      const response = await this.axiosInstance.delete<User>(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ✅ СОХРАНЕННЫЕ МЕТОДЫ

  async getMe(): Promise<User> {
    try {
      const response = await this.axiosInstance.get<{user: User, message: string}>('/auth/me');
      return response.data.user;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getUsers(skip: number = 0, limit: number = 100): Promise<User[]> {
    try {
      const response = await this.axiosInstance.get<User[]>('/users/', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getPassports(
    skipOrParams: number | { skip?: number; limit?: number; search?: string; city?: string; emergency_only?: boolean } = 0,
    limit: number = 100,
    search?: string,
    city?: string,
    emergency_only?: boolean
  ): Promise<Passport[]> {
    try {
      let params: any;
      
      // Поддерживаем и старый формат (параметры по отдельности), и новый (объект)
      if (typeof skipOrParams === 'object') {
        params = {
          skip: skipOrParams.skip || 0,
          limit: skipOrParams.limit || 100,
          search: skipOrParams.search,
          city: skipOrParams.city,
          emergency_only: skipOrParams.emergency_only,
        };
      } else {
        params = { skip: skipOrParams, limit, search, city, emergency_only };
      }

      const response = await this.axiosInstance.get<Passport[]>('/passports/', {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getPassport(id: number): Promise<Passport> {
    try {
      const response = await this.axiosInstance.get<Passport>(`/passports/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async createPassport(passportData: PassportCreate): Promise<Passport> {
    try {
      const response = await this.axiosInstance.post<Passport>('/passports/', passportData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async updatePassport(id: number, passportData: PassportUpdate): Promise<Passport> {
    try {
      const response = await this.axiosInstance.put<Passport>(`/passports/${id}`, passportData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deletePassport(id: number): Promise<Passport> {
    try {
      const response = await this.axiosInstance.delete<Passport>(`/passports/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async updatePassportEmergency(
    passportId: number,
    emergencyData: PassportEmergencyUpdate
  ): Promise<PassportEmergencyResponse> {
    try {
      const response = await this.axiosInstance.post<PassportEmergencyResponse>(
        `/passports/${passportId}/emergency`,
        emergencyData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getEmergencyPassports(skip: number = 0, limit: number = 100): Promise<Passport[]> {
    try {
      const response = await this.axiosInstance.get<Passport[]>('/passports/emergency', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getFines(skip: number = 0, limit: number = 100, passportId?: number): Promise<Fine[]> {
    try {
      const response = await this.axiosInstance.get<Fine[]>('/fines/', {
        params: { skip, limit, passport_id: passportId },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getFine(id: number): Promise<Fine> {
    try {
      const response = await this.axiosInstance.get<Fine>(`/fines/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async createFine(fineData: FineCreate): Promise<Fine> {
    try {
      const response = await this.axiosInstance.post<Fine>('/fines/', fineData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async updateFine(id: number, fineData: FineUpdate): Promise<Fine> {
    try {
      const response = await this.axiosInstance.put<Fine>(`/fines/${id}`, fineData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async deleteFine(id: number): Promise<Fine> {
    try {
      const response = await this.axiosInstance.delete<Fine>(`/fines/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getLogs(
    page: number = 0, 
    pageSize: number = 20, 
    searchTerm?: string,
    selectedAction?: string
  ): Promise<{logs: Log[], pagination: any}> {
    try {
      const params: any = { 
        page, 
        page_size: pageSize 
      };

      // Добавляем параметры поиска если они есть
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (selectedAction && selectedAction.trim() && selectedAction !== '') {
        params.action = selectedAction;
      }

      const response = await this.axiosInstance.get<{logs: Log[], pagination: any}>('/logs/', {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getMyLogs(skip: number = 0, limit: number = 100): Promise<Log[]> {
    try {
      const response = await this.axiosInstance.get<Log[]>('/logs/my', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async healthCheck(): Promise<{ status: string; database: string; version: string }> {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getPassportSkin(passportId: number): Promise<PassportSkinResponse> {
    try {
      const response = await this.axiosInstance.get<PassportSkinResponse>(`/passports/${passportId}/skin`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getSkinByDiscordId(discordId: string): Promise<PlayerSkinResponse> {
    try {
      const response = await this.axiosInstance.get<PlayerSkinResponse>(`/passports/skin/by-discord/${discordId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getAvatarByNickname(nickname: string): Promise<PlayerSkinResponse> {
    try {
      const response = await this.axiosInstance.get<PlayerSkinResponse>(`/passports/avatar/by-nickname/${nickname}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getMyPassport(): Promise<Passport> {
    try {
      const response = await this.axiosInstance.get<Passport>('/passports/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getMyFines(skip: number = 0, limit: number = 100): Promise<Fine[]> {
    try {
      const response = await this.axiosInstance.get<Fine[]>('/fines/me', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // ✅ МЕТОДЫ ДЛЯ РАБОТЫ С ПЛАТЕЖАМИ

  async createPayment(paymentData: PaymentCreate): Promise<PaymentResponse> {
    try {
      const response = await this.axiosInstance.post<PaymentResponse>('/payments/create', paymentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getPayments(): Promise<Payment[]> {
    try {
      const response = await this.axiosInstance.get<Payment[]>('/payments/');
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async getPayment(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await this.axiosInstance.get<PaymentResponse>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}

export const apiService = new ApiService();
export default apiService;