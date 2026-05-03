import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Colors } from '../theme/colors';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const DateStripSelector = ({ selectedDate, onSelectDate }: Props) => {
  
  // Generar los próximos 7 días
  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      days.push(addDays(today, i));
    }
    return days;
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {nextDays.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          // 'EEE' da 'lun', 'mar', etc.
          const dayName = format(date, 'EEE', { locale: es }).toUpperCase();
          const dayNumber = format(date, 'dd');

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dateBox, isSelected && styles.selectedBox]}
              onPress={() => onSelectDate(date)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, isSelected && styles.selectedText]}>{dayName}</Text>
              <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>{dayNumber}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dateBox: {
    width: 65,
    height: 75,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSoft,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedText: {
    color: '#FFF',
  },
});
