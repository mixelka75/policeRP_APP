// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  User, 
  UserCreate, 
  UserUpdate,
  Passport,
  PassportCreate,
  PassportUpdate,
  PassportEmergencyUpdate,
  PassportEmergencyResponse,
  Fine,
  FineCreate,
  FineUpdate,
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
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();

    // Привязываем методы к контексту класса
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
    // ✨ НОВЫЕ методы для ЧС
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
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
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
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError;
    }
    return {
      detail: error.message || 'Произошла ошибка сети',
      code: error.code,
    };
  }

  // Auth endpoints
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

  // User endpoints
  async getMe(): Promise<User> {
    try {
      const response = await this.axiosInstance.get<User>('/users/me');
      return response.data;
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

  // ✨ ОБНОВЛЕННЫЕ Passport endpoints
  async getPassports(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    city?: string,
    emergency_only?: boolean
  ): Promise<Passport[]> {
    try {
      const response = await this.axiosInstance.get<Passport[]>('/passports/', {
        params: { skip, limit, search, city, emergency_only },
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

  // ✨ НОВЫЕ методы для работы с ЧС
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

  // Fine endpoints
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

  // Log endpoints
  async getLogs(skip: number = 0, limit: number = 100): Promise<Log[]> {
    try {
      const response = await this.axiosInstance.get<Log[]>('/logs/', {
        params: { skip, limit },
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

  // Health check
  async healthCheck(): Promise<{ status: string; database: string; version: string }> {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}

export const apiService = new ApiService();
export default apiService;