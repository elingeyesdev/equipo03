/**
 * MapScreen Styles — Estilos separados para el componente MapScreen.
 */

import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBlur: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(28, 28, 30, 0.6)', // Fallback / Base tint
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E0E0E0',
    marginTop: 2,
    fontWeight: '500',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  catalogFab: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    right: 20,
    backgroundColor: '#00D9FF',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  map: {
    flex: 1,
    width: width,
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 5,
  },
  attributionText: {
    fontSize: 10,
    color: '#666',
  },
  filterFab: {
    position: 'absolute',
    bottom: 170, // Por encima del GPS ReCenter
    right: 20,
    backgroundColor: '#1C1C1E',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 20,
  },
  gpsFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 20,
  },
});
