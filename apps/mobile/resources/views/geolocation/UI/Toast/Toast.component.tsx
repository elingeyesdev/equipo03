import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform, Dimensions } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'error' | 'success';
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({ message, visible, type = 'error' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 20,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start();
        }, 3000);
      });
    }
  }, [visible, message, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { opacity, transform: [{ translateY }], backgroundColor: type === 'error' ? '#FF453A' : '#00E5A3' }
    ]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    alignSelf: 'center',
    width: width * 0.85,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    zIndex: 9999,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  }
});
