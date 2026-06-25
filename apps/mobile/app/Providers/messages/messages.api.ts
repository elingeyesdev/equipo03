import axios from 'axios';
import { Env } from '../geolocation/config/environment';
import { AuthService } from '../auth/AuthService';
import { attach401Guard } from '../auth/axios401Guard';
import { attachOfflineInterceptor } from '../offline/offlineInterceptor';

const messagesClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

messagesClient.interceptors.request.use(
  async (config) => {
    const raw = await AuthService.getToken();
    if (!raw) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${raw.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(messagesClient);
attachOfflineInterceptor(messagesClient);

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type UserProfile = {
  firstName: string;
  lastName:  string;
  avatarUrl?: string;
};

export type ConversationUser = {
  id:       number;
  profile?: UserProfile;
};

export type Conversation = {
  id:        number;
  clientId:  number;
  trainerId: number;
  client:    ConversationUser;
  trainer:   ConversationUser;
  createdAt: string;
};

export type DirectMessage = {
  id:             number;
  conversationId: number;
  senderId:       number;
  content:        string;
  readAt:         string | null;
  createdAt:      string;
};

// ── Desempaquetado seguro — soporta respuestas envueltas por interceptores globales
// de NestJS ({ data: <payload> }) y respuestas directas sin envoltura.
const unwrap = <T>(res: { data: any }): T => res.data?.data ?? res.data;

// ── API ───────────────────────────────────────────────────────────────────────

export const messagesApi = {
  getInbox: async (): Promise<Conversation[]> => {
    const res = await messagesClient.get('/api/messages/conversations');
    const payload = unwrap<Conversation[]>(res);
    return Array.isArray(payload) ? payload : [];
  },

  startConversation: async (targetUserId: number): Promise<Conversation> => {
    const res = await messagesClient.post('/api/messages/conversations', { targetUserId });
    return unwrap<Conversation>(res);
  },

  getHistory: async (conversationId: number): Promise<DirectMessage[]> => {
    const res = await messagesClient.get(`/api/messages/conversations/${conversationId}`);
    const payload = unwrap<DirectMessage[]>(res);
    return Array.isArray(payload) ? payload : [];
  },

  sendMessage: async (conversationId: number, content: string): Promise<DirectMessage> => {
    const res = await messagesClient.post('/api/messages', { conversationId, content });
    return unwrap<DirectMessage>(res);
  },

  markAsRead: async (conversationId: number): Promise<{ updated: number }> => {
    const res = await messagesClient.patch(`/api/messages/conversations/${conversationId}/read`);
    return unwrap<{ updated: number }>(res);
  },

  deleteConversation: async (conversationId: number): Promise<{ message: string }> => {
    const res = await messagesClient.delete(`/api/messages/conversations/${conversationId}`);
    return unwrap<{ message: string }>(res);
  },
};
