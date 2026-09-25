import { BaseApiClient } from './client';

export interface NotificationItem {
  id: string;
  type: 'PROFILE' | 'SECURITY' | 'CLEARANCE' | 'ASSIGNMENT';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export class NotificationApi extends BaseApiClient {
  async getNotifications(): Promise<NotificationResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/notifications`, { headers });
    return this.handleResponse<NotificationResponse>(res);
  }

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers,
    });
    return this.handleResponse<{ success: boolean }>(res);
  }

  async markAllAsRead(): Promise<{ success: boolean }> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/notifications/mark-all-read`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse<{ success: boolean }>(res);
  }
}

export const notificationApi = new NotificationApi();
