/**
 * MapScreen Styles — Estilos separados para el componente MapScreen.
 */

import { StyleSheet, Dimensions } from 'react-native';

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
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1C1C1E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#2A2A2C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
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
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  catalogBtn: {
    backgroundColor: '#38BDF8',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  map: {
    flex: 1,
    width: width,
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(10,10,10,0.7)',
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
    bottom: 170,
    right: 20,
    backgroundColor: '#1C1C1E',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  gpsFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 20,
  },
  legend: {
    position: 'absolute',
    bottom: 28,
    left: 12,
    gap: 5,
    zIndex: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

