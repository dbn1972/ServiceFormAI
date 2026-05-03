import { apiService } from './base.service';
import { API_ENDPOINTS } from '../../shared/config/api.config';
import type {
  ScalabilityConfig,
  ScalabilitySummaryResponse,
  ScalabilityViolationRecord,
} from '../../shared/types';

export class ScalabilityService {
  async getSummary(): Promise<ScalabilitySummaryResponse> {
    return apiService.get<ScalabilitySummaryResponse>(
      API_ENDPOINTS.admin.scalabilitySummary
    );
  }

  async getConfig(): Promise<ScalabilityConfig> {
    return apiService.get<ScalabilityConfig>(
      API_ENDPOINTS.admin.scalabilityConfig
    );
  }

  async updateConfig(config: Partial<ScalabilityConfig>): Promise<ScalabilityConfig> {
    return apiService.put<ScalabilityConfig>(
      API_ENDPOINTS.admin.scalabilityConfig,
      config
    );
  }

  async getViolations(): Promise<ScalabilityViolationRecord[]> {
    const response = await apiService.get<{ violations: ScalabilityViolationRecord[] }>(
      API_ENDPOINTS.admin.scalabilityViolations
    );

    return response.violations;
  }

  async pauseQueueConsumers(): Promise<{ consumersPaused: boolean }> {
    return apiService.post<{ consumersPaused: boolean }>(
      API_ENDPOINTS.admin.pauseQueue
    );
  }

  async resumeQueueConsumers(): Promise<{ consumersPaused: boolean }> {
    return apiService.post<{ consumersPaused: boolean }>(
      API_ENDPOINTS.admin.resumeQueue
    );
  }

  async retryFailedMessages(): Promise<{ retried: number; status: string }> {
    return apiService.post<{ retried: number; status: string }>(
      API_ENDPOINTS.admin.retryFailedQueue
    );
  }

  /** Triggers a browser download of the full scalability audit JSON report. */
  downloadExport(): void {
    const token = localStorage.getItem('accessToken');
    const baseUrl = (apiService as any).baseUrl as string;
    const url = `${baseUrl}${API_ENDPOINTS.admin.scalabilityExport}`;

    // Use a hidden anchor to trigger authenticated download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', `scalability-audit-${new Date().toISOString().split('T')[0]}.json`);
    if (token) {
      // For browsers that support fetch-based downloads:
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          anchor.href = blobUrl;
          anchor.click();
          URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          // Fallback: direct navigation (works if session cookie auth is configured)
          anchor.click();
        });
    } else {
      anchor.click();
    }
  }
}

export const scalabilityService = new ScalabilityService();
