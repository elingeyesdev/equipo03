import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { userApi } from '../users/api/user.api';

const PROJECT_ID = '05dedde2-39f5-4da2-9bbb-a805f06fa281';

export function usePushNotifications() {
  const registerToken = async (): Promise<void> => {
    try {
      if (!Device.isDevice) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });

      await userApi.updatePushToken(token);
      console.log('[PushNotifications] Token registrado correctamente.');
    } catch (e) {
      console.warn('[PushNotifications] registerToken error:', e);
    }
  };

  const clearToken = async (): Promise<void> => {
    try {
      await userApi.clearPushToken();
      console.log('[PushNotifications] Token eliminado del backend.');
    } catch (e) {
      console.warn('[PushNotifications] clearToken error:', e);
    }
  };

  return { registerToken, clearToken };
}
