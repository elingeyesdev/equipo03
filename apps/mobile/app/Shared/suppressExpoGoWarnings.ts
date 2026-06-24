import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications',
  'Encountered two children with the same key',
  'ERROR 400',
  'ERROR 401',
  'Tu sesión es inválida',
  'sesión expiró',
  'Network Error',
  'AxiosError',
  'Request failed',
  '[PushNotifications]',
  'expo-av',
]);

const SUPPRESSED_PATTERNS = [
  'expo-notifications',
  'ERROR 400',
  'ERROR 401',
  'Tu sesión',
  'AxiosError',
  'Request failed with status',
  'Network Error',
  '[PushNotifications]',
  'expo-av',
  'Encountered two children',
];

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
    if (SUPPRESSED_PATTERNS.some(p => msg.includes(p))) {
      console.warn('[Suprimido]', msg.substring(0, 80));
      return;
    }
    _origError(...args);
  };
}
