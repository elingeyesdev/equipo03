import { createSedesApiClient } from '../../geolocation/adapters/api/sedes.api.config';

const client = () => createSedesApiClient();

export interface ScanPreviewResult {
  id: number;
  fullName: string;
  role: string;
  branchName: string;
}

export const checkinsApi = {
  staffCheckIn: async (userId: number): Promise<{ id: number }> => {
    const response = await client().post('/api/checkins', { userId, method: 'QR' });
    return response.data;
  },
  previewScan: async (token: string): Promise<ScanPreviewResult> => {
    const response = await client().post('/api/checkins/scan-preview', { token });
    return response.data;
  },
  registerAttendance: async (targetUserId: number, action: 'IN' | 'OUT'): Promise<void> => {
    await client().post('/api/checkins/register', { targetUserId, action });
  },
};
