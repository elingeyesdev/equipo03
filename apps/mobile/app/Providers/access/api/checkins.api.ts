import { createSedesApiClient } from '../../geolocation/adapters/api/sedes.api.config';

const client = () => createSedesApiClient();

export const checkinsApi = {
  staffCheckIn: async (userId: number): Promise<{ id: number }> => {
    const response = await client().post('/api/checkins', { userId, method: 'QR' });
    return response.data;
  },
};
