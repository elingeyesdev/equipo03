import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ScheduleSlotUI } from '../hooks/useSchedulesQuery';
import { Colors } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  slot: ScheduleSlotUI;
  isSelected: boolean;
  onSelect: () => void;
}

export const ScheduleSlot = ({ slot, isSelected, onSelect }: Props) => {
  const isAvailable = slot.isAvailable;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selected,
        !isAvailable && styles.disabled,
      ]}
      onPress={onSelect}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={styles.timeInfo}>
        <MaterialCommunityIcons 
          name="clock-outline" 
          size={20} 
          color={isSelected ? Colors.primary : Colors.text} 
        />
        <Text style={[styles.timeText, isSelected && styles.selectedText]}>
          {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
        </Text>
      </View>
      
      <View style={styles.capacityInfo}>
        <Text style={[styles.capacityText, !isAvailable && styles.capacityTextFull]}>
          {isAvailable ? `${slot.availableSlots} cupos` : 'Agotado'}
        </Text>
        {slot.instructorName && (
          <Text style={styles.instructorText}>{slot.instructorName}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#1C1C1E',
  },
  disabled: {
    backgroundColor: Colors.background,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  selectedText: {
    color: Colors.primary,
  },
  capacityInfo: {
    alignItems: 'flex-end',
  },
  capacityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  capacityTextFull: {
    color: Colors.danger,
  },
  instructorText: {
    fontSize: 12,
    color: Colors.textSoft,
    marginTop: 2,
  },
});
