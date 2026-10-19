import { apiClient } from './client';
import {
  User,
  Company,
  Document,
  Transaction,
  GLCode,
  Reconciliation,
  Anomaly,
  Investigation,
  AuditLog,
  DashboardStats,
  Pagination
} from '@/types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient<{ user: User; company: Company; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: any) =>
    apiClient<{ user: User; company: Company; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => apiClient<void>('/auth/logout', { method: 'POST' }),
  me: () => apiClient<User>('/auth/me'),
};

export const companyApi = {
  get: () => apiClient<Company>('/company'),
  update: (data: Partial<Company>) =>
    apiClient<Company>('/company', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const documentApi = {
  list: (params?: { type?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<Document[]>(`/documents${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiClient<Document>(`/documents/${id}`),
  upload: (formData: FormData) =>
    apiClient<any>('/documents', {
      method: 'POST',
      body: formData,
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/documents/${id}`, { method: 'DELETE' }),
};

export const bankStatementApi = {
  upload: (formData: FormData) =>
    apiClient<any>('/bank-statements', {
      method: 'POST',
      body: formData,
    }),
  list: () => apiClient<Document[]>('/bank-statements'),
  getById: (id: string) => apiClient<Document>(`/bank-statements/${id}`),
};

export const transactionApi = {
  list: (params?: any) => {
    const query = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach((k) => {
        if (params[k] !== undefined && params[k] !== '') {
          query.append(k, String(params[k]));
        }
      });
    }
    return apiClient<Transaction[]>(`/transactions${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getById: (id: string) => apiClient<Transaction>(`/transactions/${id}`),
  create: (data: any) =>
    apiClient<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiClient<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
  bulkApprove: (ids: string[]) =>
    apiClient<{ message: string }>('/transactions/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

export const glApi = {
  list: (activeOnly = false) =>
    apiClient<GLCode[]>(`/gl-codes${activeOnly ? '?active=true' : ''}`),
  getById: (id: string) => apiClient<GLCode>(`/gl-codes/${id}`),
  create: (data: any) =>
    apiClient<GLCode>('/gl-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiClient<GLCode>(`/gl-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiClient<{ message: string }>(`/gl-codes/${id}`, { method: 'DELETE' }),
};

export const reconciliationApi = {
  run: () => apiClient<any>('/reconciliation/run', { method: 'POST' }),
  list: (status?: string) =>
    apiClient<Reconciliation[]>(`/reconciliation${status ? `?status=${status}` : ''}`),
  getById: (id: string) => apiClient<Reconciliation>(`/reconciliation/${id}`),
  approve: (id: string, notes?: string) =>
    apiClient<Reconciliation>(`/reconciliation/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  reject: (id: string, reason?: string) =>
    apiClient<Reconciliation>(`/reconciliation/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const anomalyApi = {
  list: (params?: { status?: string; severity?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<Anomaly[]>(`/anomalies${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiClient<Anomaly>(`/anomalies/${id}`),
  resolve: (id: string, notes?: string) =>
    apiClient<Anomaly>(`/anomalies/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  dismiss: (id: string, reason?: string) =>
    apiClient<Anomaly>(`/anomalies/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const investigationApi = {
  list: (status?: string) =>
    apiClient<Investigation[]>(`/investigations${status ? `?status=${status}` : ''}`),
  getById: (id: string) => apiClient<Investigation>(`/investigations/${id}`),
  create: (anomalyId: string) =>
    apiClient<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify({ anomalyId }),
    }),
  update: (id: string, data: any) =>
    apiClient<Investigation>(`/investigations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const reviewApi = {
  getQueue: () => apiClient<any>('/review-queue/queue'),
  submitDecision: (payload: {
    itemType: string;
    itemId: string;
    action: string;
    notes?: string;
  }) =>
    apiClient<any>('/review-queue/decision', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const dashboardApi = {
  getStats: () => apiClient<DashboardStats>('/dashboard/stats'),
};

export const reportApi = {
  getReconciliation: () => apiClient<any>('/reports/reconciliation'),
  getAnomalies: () => apiClient<any>('/reports/anomalies'),
  getGLMapping: () => apiClient<any[]>('/reports/gl-mapping'),
  getExportCSVUrl: (type: string) => `http://localhost:5000/api/reports/export-csv?type=${type}`,
};

export const auditApi = {
  list: (params?: { entity?: string; action?: string; userId?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient<AuditLog[]>(`/audit-logs${query ? `?${query}` : ''}`);
  },
};

export const userApi = {
  list: () => apiClient<User[]>('/users'),
  create: (data: any) =>
    apiClient<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiClient<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
