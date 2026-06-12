import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#3A3A3C',
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 24,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: '#3A3A3C',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clearText: {
    color: '#B0B0B0', // Subdued para no llamar tanto la atención como el naranja
    fontSize: 15,
    fontWeight: '600',
  },
  scroll: {
    flexShrink: 1,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#0A0A0A',
  },
  chipActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#FF5E00', // Naranja Acción
  },
  chipText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FF5E00',
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: '#FF5E00', // Naranja Acción
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
