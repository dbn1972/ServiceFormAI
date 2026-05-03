/**
 * Audit API Service
 * Handles audit log retrieval for officer/admin views
 */

import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';

export interface AuditLogEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: string | null;
  tenant_id: string | null;
  ip_address: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  success: boolean;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

class AuditService {
  async getLogs(params?: {
    actorId?: string;
    eventType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    return apiService.get(API_ENDPOINTS.audit.logs, params as Record<string, any>);
  }
}

export const auditService = new AuditService();
