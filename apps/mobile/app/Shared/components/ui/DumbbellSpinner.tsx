import { useEffect, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: ViewStyle;
};

const SIZE_MAP = { small: 20, large: 36 };

export const DumbbellSpinner = ({ size = 'small', color = '#f05b22', style }: Props) => {
  const rotation = useRef(new Animated.Value(0)).current;

  const px = typeof size === 'number' ? size : SIZE_MAP[size];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={{
        width: px,
        height: px,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate }],
      }}>
        <MaterialCommunityIcons name="dumbbell" size={px} color={color} />
      </Animated.View>
    </View>
  );
};
