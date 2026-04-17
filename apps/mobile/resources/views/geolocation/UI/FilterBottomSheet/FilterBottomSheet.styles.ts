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
    backgroundColor: '#1C1C1E', // Superficie SyncPro
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
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
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(255, 94, 0, 0.12)', // Naranja con opacidad
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
    shadowColor: '#FF5E00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
