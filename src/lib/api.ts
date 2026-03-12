/**
 * API Service для взаимодействия с backend
 * Основан на REST API endpoints из /API_ENDPOINTS.md
 */

// Конфигурация API
// Если VITE_API_URL задан, используем его полностью
// Иначе используем относительный путь /v1 (для Nginx proxy на том же домене)
const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Если задан полный URL - используем его как есть
    console.log('🌐 Using API URL from env:', apiUrl);
    return apiUrl;
  }
  
  // Иначе используем относительный путь
  console.log('🌐 Using relative API URL: /v1');
  return '/v1';
};

const API_URL = getApiUrl();

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
      const url = `${this.baseUrl}${endpoint}`;
      console.log('🌐 Full URL:', url);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response content-type:', response.headers.get('content-type'));

      // Проверяем, что получили JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Got non-JSON response! Content-Type:', contentType);
        const text = await response.text();
        console.error('❌ Response body preview:', text.substring(0, 200));
        
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: `Сервер вернул ${contentType || 'неизвестный тип'} вместо JSON. Проверьте что backend запущен и доступен по адресу: ${this.baseUrl}`,
            details: {
              url,
              status: response.status,
              contentType,
              preview: text.substring(0, 200)
            },
          },
        };
      }

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

// Экспортируем как api для удобства использования
export const api = apiClient;

/**
 * Универсальная функция для выполнения API запросов
 * Используется в хуках и компонентах для прямых запросов
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const token = TokenManager.getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: data.message || 'Произошла ошибка при выполнении запроса',
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

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/change-password', passwordData);
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
// Configuration comes from MQTT, only read operations available
export const storageApi = {
  // Get all storage systems
  async getAllSystems() {
    return apiClient.get('/storage/systems');
  },

  // Get storage system by ID
  async getSystemById(id: number) {
    return apiClient.get(`/storage/systems/${id}`);
  },

  // Get storage statistics
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

  // СКУД Аналитика
  async getTimeSeries(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/time-series', { dateFrom, dateTo });
  },

  async getHourly(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/hourly', { dateFrom, dateTo });
  },

  async getTopLocations(dateFrom: string, dateTo: string, limit?: number) {
    return apiClient.get('/skud/analytics/top-locations', { dateFrom, dateTo, limit });
  },

  async getStatistics(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/statistics', { dateFrom, dateTo });
  },

  async getWeekdayPattern(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/weekday-pattern', { dateFrom, dateTo });
  },

  async getLocationsComparison(dateFrom: string, dateTo: string, limit?: number) {
    return apiClient.get('/skud/analytics/locations-comparison', { dateFrom, dateTo, limit });
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

// API методы для MQTT
export const mqttApi = {
  async getCards() {
    return apiClient.get('/mqtt/cards');
  },

  async getValues() {
    return apiClient.get('/mqtt/values');
  },

  async getStatus() {
    return apiClient.get('/mqtt/status');
  },

  async publish(topic: string, message: string, retain = false) {
    return apiClient.post('/mqtt/publish', { topic, message, retain });
  },
};

// API методы для SKUD (поиск по идентификатору, проходы, местоположение)
export const skudApi = {
  async searchByIdentifier(query: string) {
    return apiClient.get('/skud/search', { query });
  },

  async getPassesReport(params?: {
    startDate?: string;
    endDate?: string;
    personType?: 'student' | 'employee' | 'guest';
    accessPointId?: number;
    direction?: 'in' | 'out';
    limit?: number;
    offset?: number;
  }) {
    return apiClient.get('/skud/passes', params);
  },

  async getPersonLocation(query: string) {
    return apiClient.get('/skud/location', { query });
  },

  async getLocationByFio(lastName: string, firstName: string, middleName?: string) {
    return apiClient.get('/skud/location/by-fio', { 
      lastName, 
      firstName, 
      middleName: middleName || '' 
    });
  },

  async getLocationByUpn(upn: string) {
    return apiClient.get('/skud/location/by-upn', { upn });
  },

  async getPassesByFio(lastName: string, firstName: string, middleName: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/passes/by-fio', { 
      lastName, 
      firstName, 
      middleName: middleName || '',
      dateFrom,
      dateTo
    });
  },

  async getPassesByUpn(upn: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/passes/by-upn', { 
      upn,
      dateFrom,
      dateTo
    });
  },

  // ===== ОТЧЕТЫ ПО СТУДЕНТАМ =====
  async getStudentsPassesByFio(lastName: string, firstName: string, middleName: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/students-passes/by-fio', { 
      lastName, 
      firstName, 
      middleName: middleName || '',
      dateFrom,
      dateTo
    });
  },

  async getStudentsPassesByUpn(upn: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/students-passes/by-upn', { 
      upn,
      dateFrom,
      dateTo
    });
  },

  // ===== ОТЧЕТЫ ПО СОТРУДНИКАМ =====
  async getEmployeesPassesByFio(lastName: string, firstName: string, middleName: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/employees-passes/by-fio', { 
      lastName, 
      firstName, 
      middleName: middleName || '',
      dateFrom,
      dateTo
    });
  },

  async getEmployeesPassesByUpn(upn: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/employees-passes/by-upn', { 
      upn,
      dateFrom,
      dateTo
    });
  },

  // ===== ОТЧЕТЫ ПО ИНОСТРАННЫМ СТУДЕНТАМ =====
  async getForeignStudentsPassesByFio(lastName: string, firstName: string, middleName: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/foreign-students-passes/by-fio', { 
      lastName, 
      firstName, 
      middleName: middleName || '',
      dateFrom,
      dateTo
    });
  },

  async getForeignStudentsPassesByUpn(upn: string, dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/foreign-students-passes/by-upn', { 
      upn,
      dateFrom,
      dateTo
    });
  },

  async getForeignStudentsMissing(country: string, daysThreshold: number) {
    return apiClient.get('/foreign-students/missing', {
      country,
      daysThreshold: daysThreshold.toString()
    });
  },

  async getAccessPoints() {
    return apiClient.get('/skud/access-points');
  },

  // ===== АНАЛИТИКА =====
  async getPassesTimeSeries(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/time-series', {
      dateFrom,
      dateTo
    });
  },

  async getPassesHourly(dateFrom: string, dateTo: string) {
    return apiClient.get('/skud/analytics/hourly', {
      dateFrom,
      dateTo
    });
  },

  async getTopLocations(dateFrom: string, dateTo: string, limit: number = 10) {
    return apiClient.get('/skud/analytics/top-locations', {
      dateFrom,
      dateTo,
      limit: limit.toString()
    });
  },
};

// Экспорт утилит
export { TokenManager };

// Проверка здоровья API
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
}

// Экспорт базового URL для других нужд
export { API_URL };