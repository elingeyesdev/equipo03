import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './GPSReCenterButton.styles';

interface Props {
  onPress: () => void;
  style?: object;
}

export const GPSReCenterButton: React.FC<Props> = ({ onPress, style }) => (
  <TouchableOpacity
    style={[styles.container, style]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#38BDF8" />
  </TouchableOpacity>
);

