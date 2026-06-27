import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  staffApi,
  ActiveAdvisee,
  ClientProfile,
  TrainerPlanData,
  TrainingSession,
} from '../../../app/Providers/staff/api/staff.api';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = () =>
  new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const inRange = (d: string, from: string, to: string) => { const v = d.slice(0, 10); return v >= from && v <= to; };
const escHtml = (s?: string | null) =>
  !s ? '' : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildTrainerHtml(
  clients:  ActiveAdvisee[],
  profiles: Map<number, ClientProfile | null>,
  plans:    Map<number, TrainerPlanData | null>,
  counts:   Map<number, number>,
  range:    { from: string; to: string },
): string {
  const genAt = fmtDateTime();
  const sections = clients.map((client) => {
    const p       = profiles.get(client.clientId);
    const plan    = plans.get(client.clientId);
    const cnt     = counts.get(client.clientId) ?? 0;
    const init    = escHtml(client.clientName).charAt(0).toUpperCase();
    const hasPlan = !!(plan?.dailyKcal || plan?.planNotes);
    const metrics = p?.latestMetrics;
    const metricsRow = metrics ? `
      <div style="padding:0 20px 16px">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">Últimas métricas</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead><tr>${['Peso (kg)', 'Grasa (%)', 'Músculo (kg)', 'Cintura (cm)', 'Pecho (cm)'].map(h =>
            `<th style="padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;font-weight:600;border-bottom:1px solid #E5E7EB;">${h}</th>`
          ).join('')}</tr></thead>
          <tbody><tr>${[
            metrics.weightKg          != null ? `${metrics.weightKg}`          : '—',
            metrics.bodyFatPercentage != null ? `${metrics.bodyFatPercentage}` : '—',
            metrics.muscleMassKg      != null ? `${metrics.muscleMassKg}`      : '—',
            metrics.waistCm           != null ? `${metrics.waistCm}`           : '—',
            metrics.chestCm           != null ? `${metrics.chestCm}`           : '—',
          ].map(v => `<td style="padding:8px;color:#374151;">${v}</td>`).join('')}</tr></tbody>
        </table>
      </div>` : '';

    return `
      <div style="margin-bottom:24px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
        <div style="background:#F9FAFB;padding:14px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:50%;background:#3a1800;color:#FF5E00;font-size:20px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;line-height:42px;text-align:center;">${init}</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:#111827;">${escHtml(client.clientName)}</div>
            <div style="font-size:11px;color:#00E5A3;margin-top:2px;font-weight:600;">Asesoría activa</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:16px 20px;">
          <div style="border:1px solid #E5E7EB;border-left:3px solid #FF5E00;border-radius:6px;padding:12px;">
            <div style="color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Sesiones completadas</div>
            <div style="color:#111827;font-size:22px;font-weight:700;margin-top:4px;">${cnt}</div>
          </div>
          <div style="border:1px solid #E5E7EB;border-left:3px solid ${hasPlan ? '#10B981' : '#9CA3AF'};border-radius:6px;padding:12px;">
            <div style="color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Plan nutricional</div>
            <div style="color:${hasPlan ? '#10B981' : '#9CA3AF'};font-size:14px;font-weight:700;margin-top:4px;">${hasPlan ? 'Asignado' : 'Sin plan'}</div>
          </div>
          <div style="border:1px solid #E5E7EB;border-left:3px solid #6B7280;border-radius:6px;padding:12px;">
            <div style="color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Cond. médica</div>
            <div style="color:${p?.medicalConditions ? '#EF4444' : '#9CA3AF'};font-size:12px;font-weight:600;margin-top:4px;">${escHtml(p?.medicalConditions) || 'Sin registro'}</div>
          </div>
        </div>
        ${metricsRow}
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; }</style>
  </head><body>
    <div style="background:linear-gradient(135deg,#111827,#1f2937);padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="color:#FF5E00;font-size:20px;font-weight:800;letter-spacing:-0.5px;">GYMSYNC</div>
        <div style="color:#9CA3AF;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;margin-top:3px;">Sistema de Gestión Deportiva</div>
      </div>
      <div style="text-align:right;">
        <div style="color:#fff;font-size:16px;font-weight:700;">Clientes por Entrenador</div>
        <div style="color:#9CA3AF;font-size:11px;margin-top:3px;">${clients.length} cliente${clients.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
    <div style="background:#F9FAFB;border-bottom:1px solid #E5E7EB;padding:10px 32px;display:flex;gap:40px;">
      <div>
        <div style="color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Período</div>
        <div style="color:#111827;font-size:12px;font-weight:600;margin-top:2px;">${fmtDate(range.from)} — ${fmtDate(range.to)}</div>
      </div>
      <div>
        <div style="color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:1px;">Generado</div>
        <div style="color:#111827;font-size:12px;font-weight:600;margin-top:2px;">${genAt}</div>
      </div>
    </div>
    <div style="padding:24px 32px 40px;">
      ${sections}
      <div style="margin-top:28px;padding-top:12px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;font-size:10px;color:#D1D5DB;">
        <span>GymSync — Sistema de Gestión Deportiva</span>
        <span>${genAt}</span>
      </div>
    </div>
  </body></html>`;
}

type Params = {
  type: 'TRAINER' | 'INSTRUCTOR';
  scopeAll: boolean;
  selectedClientId?: number | null;
  rangeFrom: string;
  rangeTo: string;
};

export const ReportPreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const params: Params = route.params;
  const range = { from: params.rangeFrom, to: params.rangeTo };

  const [clients,   setClients]   = useState<ActiveAdvisee[]>([]);
  const [profiles,  setProfiles]  = useState<Map<number, ClientProfile | null>>(new Map());
  const [plans,     setPlans]     = useState<Map<number, TrainerPlanData | null>>(new Map());
  const [counts,    setCounts]    = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res  = await staffApi.getActiveAdvisees({ limit: 100, offset: 0 });
      const all: ActiveAdvisee[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
      const target = params.scopeAll
        ? all
        : all.filter(a => a.clientId === params.selectedClientId);
      setClients(target);

      const [profilesArr, plansArr, sessionsArr] = await Promise.all([
        Promise.all(target.map(c => staffApi.getClientProfile(c.clientId).catch(() => null))),
        Promise.all(target.map(c => staffApi.getTrainerPlan(c.clientId).catch(() => null))),
        Promise.all(target.map(c =>
          staffApi.getSessionsForUser(c.clientId, { limit: 100, offset: 0 })
            .catch(() => ({ data: [] as TrainingSession[], meta: { total: 0, limit: 100, offset: 0 } }))
        )),
      ]);

      setProfiles(new Map(target.map((c, i) => [c.clientId, profilesArr[i]])));
      setPlans(new Map(target.map((c, i) => [c.clientId, plansArr[i]])));
      setCounts(new Map(target.map((c, i) => {
        const raw = sessionsArr[i];
        const sessions: TrainingSession[] = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
        return [c.clientId, sessions.filter(s =>
          s.status === 'COMPLETED' && inRange(s.startedAt, range.from, range.to)
        ).length];
      })));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos del reporte.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    if (exporting || clients.length === 0) return;
    setExporting(true);
    try {
      const html    = buildTrainerHtml(clients, profiles, plans, counts, range);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Exportar Reporte' });
      } else {
        Alert.alert('PDF generado', `Guardado en: ${uri}`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const periodLabel = range.from === range.to
    ? fmtDate(range.from)
    : `${fmtDate(range.from)} — ${fmtDate(range.to)}`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.titleCol}>
          <Text style={s.topTitle}>Vista Previa</Text>
          <Text style={s.topSub}>{periodLabel}</Text>
        </View>
        {!isLoading && (
          <View style={s.statChip}>
            <Text style={s.statChipTxt}>{clients.length} cliente{clients.length !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <DumbbellSpinner color="#FF5E00" />
          <Text style={s.loadingTxt}>Cargando datos del reporte...</Text>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {clients.length === 0 ? (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color="#222" />
              <Text style={s.emptyTxt}>Sin clientes para mostrar</Text>
              <Text style={s.emptySub}>Ajusta el filtro de alcance y vuelve a intentarlo.</Text>
            </View>
          ) : (
            clients.map(client => {
              const plan    = plans.get(client.clientId);
              const profile = profiles.get(client.clientId);
              const cnt     = counts.get(client.clientId) ?? 0;
              const hasPlan = !!(plan?.dailyKcal || plan?.planNotes);

              return (
                <View key={client.clientId} style={s.clientCard}>
                  <View style={s.clientHeader}>
                    <View style={s.initCircle}>
                      <Text style={s.initTxt}>{(client.clientName ?? '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientName}>{client.clientName}</Text>
                      <Text style={s.clientSub}>Asesoría activa</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                  </View>

                  <View style={s.kpiRow}>
                    <View style={s.kpi}>
                      <Text style={s.kpiVal}>{cnt}</Text>
                      <Text style={s.kpiLbl}>Sesiones</Text>
                    </View>
                    <View style={s.kpi}>
                      <Text style={[s.kpiVal, { color: hasPlan ? '#10B981' : '#333' }]}>{hasPlan ? 'OK' : '—'}</Text>
                      <Text style={s.kpiLbl}>Plan nutric.</Text>
                    </View>
                    <View style={s.kpi}>
                      <Text style={[s.kpiVal, { color: profile?.medicalConditions ? '#EF4444' : '#333' }]}>
                        {profile?.medicalConditions ? 'Sí' : '—'}
                      </Text>
                      <Text style={s.kpiLbl}>Cond. médica</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* Floating export button */}
      <View style={s.fab}>
        <TouchableOpacity
          style={[s.fabBtn, (exporting || isLoading || clients.length === 0) && s.fabDisabled]}
          onPress={handleExport}
          activeOpacity={0.85}
          disabled={exporting || isLoading || clients.length === 0}
        >
          {exporting ? (
            <DumbbellSpinner size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={22} color="#fff" />
          )}
          <Text style={s.fabTxt}>{exporting ? 'Generando PDF...' : 'Exportar PDF'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2C2C2E',
  },
  titleCol:    { flex: 1 },
  topTitle:    { color: '#fff', fontSize: 20, fontWeight: '800' },
  topSub:      { color: '#D1D5DB', fontSize: 12, marginTop: 2 },
  statChip:    { backgroundColor: '#1C1C1E', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#2C2C2E' },
  statChipTxt: { color: '#D1D5DB', fontSize: 12, fontWeight: '700' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: '#D1D5DB', fontSize: 14 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTxt: { color: '#D1D5DB', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#D1D5DB', fontSize: 13, textAlign: 'center' },

  clientCard:   { backgroundColor: '#111111', borderRadius: 14, borderWidth: 1, borderColor: '#1C1C1E', marginBottom: 12, overflow: 'hidden' },
  clientHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  initCircle:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A0F00', justifyContent: 'center', alignItems: 'center' },
  initTxt:      { color: '#FF5E00', fontSize: 18, fontWeight: '900' },
  clientName:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  clientSub:    { color: '#10B981', fontSize: 12, marginTop: 2 },

  kpiRow: { flexDirection: 'row', padding: 14, gap: 8 },
  kpi:    { flex: 1, alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#1C1C1E' },
  kpiVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  kpiLbl: { color: '#9CA3AF', fontSize: 12, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 },

  fab: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1, borderTopColor: '#111',
  },
  fabBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF5E00', borderRadius: 14, paddingVertical: 16,
  },
  fabDisabled: { opacity: 0.4 },
  fabTxt:      { color: '#fff', fontSize: 15, fontWeight: '800' },
});
