import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { AuthService } from '../../../app/Providers/auth/AuthService';
import { Env } from '../../../app/Providers/geolocation/config/environment';

type Tab = 'CARNET' | 'USUARIO';

const ROLE_COLOR: Record<string, string> = {
  ENTRENADOR:    '#f05b22',
  INSTRUCTOR:    '#9b5de5',
  NUTRICIONISTA: '#06d6a0',
  GERENTE:       '#2196f3',
  COORDINADOR:   '#ffa726',
};

export const CarnetVirtualScreen = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('CARNET');
  const [gymName,   setGymName]   = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Obtener email y nombre real de sucursal desde el perfil completo
  useEffect(() => {
    AuthService.fetchUserProfile().then(async data => {
      // Email
      const mail = data?.email ?? null;
      if (mail) setUserEmail(mail);

      // Sucursal: prioridad → userRoles[0].gym.name (asignación real del backend)
      // Fallback → fetch /api/gyms/:gymId con el gymId del contexto de auth
      const roleGymName = data?.userRoles?.[0]?.gym?.name ?? null;
      if (roleGymName) {
        setGymName(roleGymName);
        return;
      }

      // Fallback: usar gymId del contexto si el perfil no trae userRoles
      const rawGymId = user?.gymId;
      if (!rawGymId) return;
      const token = await AuthService.getToken();
      if (!token) return;
      fetch(`${Env.API_BASE_URL}/api/gyms/${rawGymId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
        .then(r => r.json())
        .then(body => { const g = body?.data ?? body; if (g?.name) setGymName(g.name); })
        .catch(() => {});
    }).catch(() => {});
  }, [user?.gymId]); // eslint-disable-line react-hooks/exhaustive-deps

  const p           = (user as any)?.profile;
  const firstName   = p?.firstName ?? '';
  const lastName    = p?.lastName  ?? '';
  const fullName    = (firstName + ' ' + lastName).trim().toUpperCase()
                      || (user as any)?.email?.split('@')[0]?.toUpperCase()
                      || 'SIN NOMBRE';
  const role        = user?.role?.toUpperCase() ?? '';
  const avatarIcon  = p?.avatarIcon ?? p?.avatarUrl ?? 'account-circle';
  const gender      = p?.gender     ?? '—';
  const email       = userEmail ?? (user as any)?.email ?? '—';
  const gymId       = gymName ?? (user?.gymId ? `Sede #${user.gymId}` : 'Sin sede asignada');
  const qrValue     = String((user as any)?.userId ?? (user as any)?.id ?? 'NO_ID');
  const accent      = ROLE_COLOR[role] ?? '#f05b22';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Toggle */}
      <View style={s.toggle}>
        {(['CARNET', 'USUARIO'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.toggleBtn, tab === t && { backgroundColor: accent }]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.toggleTxt, tab === t && s.toggleTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'CARNET' ? (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.card, { borderColor: accent + '44' }]}>

            {/* Avatar */}
            <View style={[s.avatarWrap, { borderColor: accent }]}>
              <MaterialCommunityIcons name={avatarIcon as any} size={60} color={accent} />
            </View>

            <Text style={s.name}>{fullName}</Text>

            <View style={[s.roleBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[s.roleTxt, { color: accent }]}>{role}</Text>
            </View>

            {/* QR central */}
            <View style={s.qrWrap}>
              <QRCode value={qrValue} size={220} color="#000" backgroundColor="#fff" />
            </View>

            <Text style={s.qrHint}>Presenta este código al personal autorizado</Text>

            {/* Sede */}
            <View style={s.sedeRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#555" />
              <Text style={s.sedeTxt}>{gymId}</Text>
            </View>

          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.dataCard}>
            {[
              { label: 'Sucursal', value: gymId, icon: 'office-building-outline'  },
              { label: 'Rol',    value: role,   icon: 'shield-account-outline'   },
              { label: 'Género', value: gender, icon: 'gender-male-female'       },
              { label: 'Correo', value: email,  icon: 'email-outline'            },
            ].map(({ label, value, icon }) => (
              <View key={label} style={s.dataRow}>
                <View style={s.dataLeft}>
                  <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
                  <Text style={s.dataLabel}>{label}</Text>
                </View>
                <Text style={s.dataValue} numberOfLines={1}>{value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 60, alignItems: 'center' },

  toggle:          { flexDirection: 'row', margin: 20, backgroundColor: '#111', borderRadius: 30, padding: 4, borderWidth: 1, borderColor: '#222' },
  toggleBtn:       { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: 'center' },
  toggleTxt:       { color: '#555', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  toggleTxtActive: { color: '#fff' },

  card:      { width: '100%', backgroundColor: '#0e0e0e', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, gap: 12 },
  avatarWrap:{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  name:      { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleTxt:   { fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  qrWrap:  { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginVertical: 8 },
  qrHint:  { color: '#444', fontSize: 11, textAlign: 'center' },
  sedeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sedeTxt: { color: '#555', fontSize: 12 },

  dataCard:  { width: '100%', backgroundColor: '#0e0e0e', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1a1a1a' },
  dataRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  dataLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dataLabel: { color: '#888', fontSize: 14, fontWeight: '600' },
  dataValue: { color: '#fff', fontSize: 14, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
});
