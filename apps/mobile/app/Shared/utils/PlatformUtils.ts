/**
 * PlatformUtils — Helpers para detectar la plataforma actual.
 * 
 * Centraliza la detección de iOS/Android para evitar Platform.OS
 * disperso por todo el código.
 */

import { Platform } from 'react-native';

export const PlatformUtils = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',

  select<T>(options: { ios: T; android: T; default?: T }): T {
    if (Platform.OS === 'ios') return options.ios;
    if (Platform.OS === 'android') return options.android;
    return options.default ?? options.android;
  },
} as const;
