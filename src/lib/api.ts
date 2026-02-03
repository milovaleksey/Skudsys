/**
 * API Service для взаимодействия с backend
 * Основан на REST API endpoints из /API_ENDPOINTS.md
 */

// Конфигурация API
// Если VITE_API_BASE_URL пустой или не задан, используем относительный путь (для Nginx proxy)
// Иначе используем полный URL (для прямого подключения)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = API_BASE_URL ? `${API_BASE_URL}/${API_VERSION}` : `/${API_VERSION}`;

// Типы
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
  authType?: 'local' | 'sso';
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    authType: 'local' | 'sso';
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
  };
}

// Утилита для работы с токенами
class TokenManager {
  private static TOKEN_KEY = 'auth_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('🔑 Getting token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }

  static setToken(token: string): void {
    console.log('💾 Saving token:', token ? `${token.substring(0, 20)}...` : 'null');
    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('✅ Token saved to localStorage');
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    console.log('💾 Saving refresh token');
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    console.log('🗑️ Clearing all tokens');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// Базовый класс для API запросов
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = TokenManager.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🌐 Making request to:', endpoint, 'with token');
    } else {
      console.log('🌐 Making request to:', endpoint, 'without token');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Если токен истёк, пытаемся обновить (но не для auth endpoints)
        if (response.status === 401 && token && !endpoint.includes('/auth/')) {
          console.log('⚠️ Got 401, attempting token refresh...');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('✅ Token refreshed, retrying request...');
            // Повторяем запрос с новым токеном
            return this.request<T>(endpoint, options);
          }
        }

        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'Произошла ошибка при выполнении запроса',
          },
        };
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Не удалось подключиться к серверу',
          details: error,
        },
      };
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setToken(data.data.token);
        return true;
      }

      TokenManager.clearTokens();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.clearTokens();
      return false;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Экземпляр API клиента
const apiClient = new ApiClient(API_URL);

// API методы для авторизации
export const authApi = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout');
    TokenManager.clearTokens();
    return response;
  },

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const refreshToken = TokenManager.getRefreshToken();
    return apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
  },

  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return apiClient.get<LoginResponse['user']>('/auth/me');
  },
};

// API методы для пользователей
export const usersApi = {
  async getAll(params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) {
    return apiClient.get('/users', params);
  },

  async getById(id: number) {
    return apiClient.get(`/users/${id}`);
  },

  async create(data: any) {
    return apiClient.post('/users', data);
  },

  async update(id: number, data: any) {
    return apiClient.put(`/users/${id}`, data);
  },

  async delete(id: number) {
    return apiClient.delete(`/users/${id}`);
  },

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    return apiClient.post(`/users/${id}/change-password`, { oldPassword, newPassword });
  },
};

// API методы для ролей
export const rolesApi = {
  async getAll() {
    return apiClient.get('/roles');
  },

  async getById(id: number) {
    return apiClient.get(`/roles/${id}`);
  },

  async create(data: any) {
    return apiClient.post('/roles', data);
  },

  async update(id: number, data: any) {
    return apiClient.put(`/roles/${id}`, data);
  },

  async delete(id: number) {
    return apiClient.delete(`/roles/${id}`);
  },
};

// API методы для студентов
export const studentsApi = {
  async getAll(params?: { page?: number; limit?: number; search?: string; faculty?: string; course?: number }) {
    return apiClient.get('/students', params);
  },

  async getById(id: number) {
    return apiClient.get(`/students/${id}`);
  },

  async getStatistics() {
    return apiClient.get('/students/statistics');
  },
};

// API методы для сотрудников
export const employeesApi = {
  async getAll(params?: { page?: number; limit?: number; search?: string; department?: string; position?: string }) {
    return apiClient.get('/employees', params);
  },

  async getById(id: number) {
    return apiClient.get(`/employees/${id}`);
  },

  async getStatistics() {
    return apiClient.get('/employees/statistics');
  },
};

// API методы для логов доступа
export const accessLogsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    level?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return apiClient.get('/access-logs', params);
  },

  async create(data: any) {
    return apiClient.post('/access-logs', data);
  },

  async getStatistics(dateFrom?: string, dateTo?: string) {
    return apiClient.get('/access-logs/statistics', { dateFrom, dateTo });
  },
};

// API методы для парковки
export const parkingApi = {
  async getAllLots() {
    return apiClient.get('/parking/lots');
  },

  async getLotById(id: number) {
    return apiClient.get(`/parking/lots/${id}`);
  },

  async getRecords(lotId?: number, params?: { page?: number; limit?: number; search?: string }) {
    const endpoint = lotId ? `/parking/lots/${lotId}/records` : '/parking/records';
    return apiClient.get(endpoint, params);
  },

  async getStatistics() {
    return apiClient.get('/parking/statistics');
  },
};

// API методы для хранилища вещей
export const storageApi = {
  async getAllItems(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    return apiClient.get('/storage', params);
  },

  async getById(id: number) {
    return apiClient.get(`/storage/${id}`);
  },

  async create(data: any) {
    return apiClient.post('/storage', data);
  },

  async update(id: number, data: any) {
    return apiClient.put(`/storage/${id}`, data);
  },

  async delete(id: number) {
    return apiClient.delete(`/storage/${id}`);
  },

  async getStatistics() {
    return apiClient.get('/storage/statistics');
  },
};

// API методы для аналитики
export const analyticsApi = {
  async getDashboard() {
    return apiClient.get('/analytics/dashboard');
  },

  async getAccessTrends(period: 'day' | 'week' | 'month' | 'year' = 'week') {
    return apiClient.get('/analytics/access-trends', { period });
  },

  async getParkingTrends(period: 'day' | 'week' | 'month' | 'year' = 'week') {
    return apiClient.get('/analytics/parking-trends', { period });
  },

  async getCustomReport(params: any) {
    return apiClient.post('/analytics/custom-report', params);
  },
};

// API методы для журнала аудита
export const auditLogsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    return apiClient.get('/audit-logs', params);
  },

  async getFilters() {
    return apiClient.get('/audit-logs/filters');
  }
};

// Экспорт утилит
export { TokenManager };

// Проверка здоровья API
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
}

// Экспорт базового URL для других нужд
export { API_BASE_URL, API_VERSION, API_URL };