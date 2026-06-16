// expo-notifications' DevicePushTokenAutoRegistration.fx.js runs at import
// time and calls console.error when it detects Expo Go + Android (SDK 53+).
// Our IS_EXPO_GO guard in usePushNotifications already prevents actual token
// registration, but the library warning fires before our code can run.
// Intercepting it here (before expo-notifications loads) silences the red
// overlay in Expo Go without affecting production builds.

const EXPO_GO_SUPPRESSED = [
  'expo-notifications: Android Push',
  '[expo-notifications] Error reading persisted server registration info',
];

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const _orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      EXPO_GO_SUPPRESSED.some((prefix) => (args[0] as string).startsWith(prefix))
    ) {
      return;
    }
    _orig(...args);
  };
}
