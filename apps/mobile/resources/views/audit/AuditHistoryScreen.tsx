import React from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuditHistory, AuditRecord } from '../../../app/Providers/access/api/useAuditHistory';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

export const AuditHistoryScreen = ({ navigation }: any) => {
  const { history, isLoading, error, refetch } = useAuditHistory();

  const renderItem = ({ item }: { item: AuditRecord }) => {
    const hasAction   = item.actionType === 'IN' || item.actionType === 'OUT';
    const isIngreso   = item.actionType === 'IN';
    const isAutorizado = item.status === 'AUTORIZADO';

    const iconName  = hasAction
      ? (isIngreso ? 'login' : 'logout')
      : (isAutorizado ? 'check-circle' : 'close-circle');
    const iconColor = hasAction
      ? (isIngreso ? '#22c55e' : '#f97316')
      : (isAutorizado ? '#4caf50' : '#f44336');

    const date = new Date(item.checkInTime);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName as any} size={32} color={iconColor} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>
            {item.userName || `Usuario #${item.userId}`}
          </Text>
          <Text style={styles.details}>
            Método: {item.method}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{timeString}</Text>
          {hasAction ? (
            <View style={[styles.badge, {
              backgroundColor: isIngreso ? '#14532d' : '#431407',
              borderWidth: 1,
              borderColor: isIngreso ? '#16a34a' : '#ea580c',
            }]}>
              <Text style={[styles.badgeText, { color: isIngreso ? '#4ade80' : '#fb923c' }]}>
                {isIngreso ? 'INGRESO' : 'SALIDA'}
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: isAutorizado ? '#e8f5e9' : '#ffebee' }]}>
              <Text style={[styles.badgeText, { color: isAutorizado ? '#4caf50' : '#f44336' }]}>
                {item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Auditoría de Accesos</Text>
          <Text style={styles.headerSubtitle}>Monitor en tiempo real</Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation?.navigate('Escaner', { mode: 'staff' })}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#0A0A0A" />
          <Text style={styles.scanTxt}>Escanear Personal</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#f05b22"
              colors={['#f05b22']}
            />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>No hay registros de acceso recientes.</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#999999',
    marginTop: 3,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f05b22',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  scanTxt: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para el TabBar
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    color: '#999999',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
