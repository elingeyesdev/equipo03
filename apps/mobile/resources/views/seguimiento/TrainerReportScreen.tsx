import { useState, useEffect, useCallback } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { staffApi, ActiveAdvisee, ClientProfile, TrainerPlanData, TrainingSession } from '../../../app/Providers/staff/api/staff.api';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

//Date helpers 
const todayStr = () => new Date().toISOString().slice(0, 10);
const weekStartStr = () => {
  const d = new Date(); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff); return d.toISOString().slice(0, 10);
};
const monthStartStr = () => {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

type Preset = 'hoy' | 'semana' | 'mes' | 'personalizado';
type Range  = { from: string; to: string };

function getRange(preset: Preset, customFrom: string, customTo: string): Range {
  const t = todayStr();
  switch (preset) {
    case 'hoy':    return { from: t,              to: t };
    case 'semana': return { from: weekStartStr(),  to: t };
    case 'mes':    return { from: monthStartStr(), to: t };
    default:       return { from: customFrom,      to: customTo };
  }
}

// ─── HTML Generation ─────────────────────────────────────────────────────────

function escHtml(s?: string | null): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inRange(dateStr: string, from: string, to: string): boolean {
  const d = dateStr.slice(0, 10); return d >= from && d <= to;
}

function buildHtml(
  clients:  ActiveAdvisee[],
  profiles: Map<number, ClientProfile | null>,
  plans:    Map<number, TrainerPlanData | null>,
  counts:   Map<number, number>,
  range:    Range,
): string {
  const genAt = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const sections = clients.map((client) => {
    const p    = profiles.get(client.clientId);
    const plan = plans.get(client.clientId);
    const cnt  = counts.get(client.clientId) ?? 0;
    const init = escHtml(client.clientName).charAt(0).toUpperCase();
    const hasPlan = !!(plan?.dailyKcal || plan?.planNotes);
    const metrics = p?.latestMetrics;

    const metricsRow = metrics ? `
      <div style="padding:0 20px 16px">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;margin-bottom:8px;">Últimas métricas</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr>
              ${['Peso (kg)', 'Grasa (%)', 'Músculo (kg)', 'Cintura (cm)', 'Pecho (cm)'].map(h => `<th style="padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#9CA3AF;font-weight:600;border-bottom:1px solid #E5E7EB;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${[
                metrics.weightKg           != null ? `${metrics.weightKg}` : '—',
                metrics.bodyFatPercentage  != null ? `${metrics.bodyFatPercentage}` : '—',
                metrics.muscleMassKg       != null ? `${metrics.muscleMassKg}` : '—',
                metrics.waistCm            != null ? `${metrics.waistCm}` : '—',
                metrics.chestCm            != null ? `${metrics.chestCm}` : '—',
              ].map(v => `<td style="padding:8px;color:#374151;">${v}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    ` : '';

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
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #fff; }
    </style>
    </head>
    <body>
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
    </body>
    </html>
  `;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const TrainerReportScreen = () => {
  const navigation = useNavigation<any>();

  const [preset,       setPreset]       = useState<Preset>('mes');
  const [customFrom,   setCustomFrom]   = useState(monthStartStr());
  const [customTo,     setCustomTo]     = useState(todayStr());
  const [scopeAll,     setScopeAll]     = useState(true);
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [generating,   setGenerating]   = useState(false);

  const [advisees,  setAdvisees]  = useState<ActiveAdvisee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdvisees = useCallback(async () => {
    try {
      const res = await staffApi.getActiveAdvisees({ limit: 100, offset: 0 });
      setAdvisees(Array.isArray(res) ? res : (res?.data ?? []));
    } catch {
      // Fallo silencioso — la lista simplemente queda vacía
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAdvisees(); }, [loadAdvisees]);

  const range = getRange(preset, customFrom, customTo);

  async function handleGenerate() {
    if (generating) return;

    const target = scopeAll
      ? advisees
      : advisees.filter(a => a.clientId === selectedId);

    if (target.length === 0) {
      Alert.alert('Sin datos', 'No hay clientes seleccionados para el reporte.');
      return;
    }

    if (preset === 'personalizado' && customFrom > customTo) {
      Alert.alert('Fechas inválidas', 'La fecha de inicio debe ser anterior a la fecha de fin.');
      return;
    }

    setGenerating(true);
    try {
      const [profilesArr, plansArr, sessionsArr] = await Promise.all([
        Promise.all(target.map(c => staffApi.getClientProfile(c.clientId).catch(() => null))),
        Promise.all(target.map(c => staffApi.getTrainerPlan(c.clientId).catch(() => null))),
        Promise.all(target.map(c => staffApi.getSessionsForUser(c.clientId, { limit: 100, offset: 0 }).catch(() => ({ data: [] as TrainingSession[], meta: { total: 0, limit: 100, offset: 0 } })))),
      ]);

      const profiles = new Map<number, ClientProfile | null>(target.map((c, i) => [c.clientId, profilesArr[i]]));
      const plans    = new Map<number, TrainerPlanData | null>(target.map((c, i) => [c.clientId, plansArr[i]]));
      const counts   = new Map<number, number>(target.map((c, i) => {
        const raw = sessionsArr[i];
        const sessions: TrainingSession[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const n = sessions.filter(s =>
          s.status === 'COMPLETED' && inRange(s.startedAt, range.from, range.to),
        ).length;
        return [c.clientId, n];
      }));

      const html = buildHtml(target, profiles, plans, counts, range);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Exportar Reporte' });
      } else {
        Alert.alert('PDF generado', `Guardado en: ${uri}`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo generar el reporte. Intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  }

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'hoy',          label: 'Hoy' },
    { key: 'semana',       label: 'Semana' },
    { key: 'mes',          label: 'Mes' },
    { key: 'personalizado',label: 'Personalizar' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.titleCol}>
          <Text style={s.topTitle}>Generar Reporte</Text>
          <Text style={s.topSub}>Informe de clientes asesorados</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Scope */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Alcance del reporte</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, scopeAll && s.toggleActive]}
              onPress={() => { setScopeAll(true); setSelectedId(null); }}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleTxt, scopeAll && s.toggleActiveTxt]}>Todos mis clientes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !scopeAll && s.toggleActive]}
              onPress={() => setScopeAll(false)}
              activeOpacity={0.8}
            >
              <Text style={[s.toggleTxt, !scopeAll && s.toggleActiveTxt]}>Un cliente específico</Text>
            </TouchableOpacity>
          </View>

          {/* Client list (only when scopeAll = false) */}
          {!scopeAll && (
            <View style={s.clientList}>
              {isLoading ? (
                <DumbbellSpinner size="small" color="#38BDF8" style={{ padding: 16 }} />
              ) : advisees.length === 0 ? (
                <Text style={s.emptyTxt}>Sin clientes activos.</Text>
              ) : (
                advisees.map((a) => (
                  <TouchableOpacity
                    key={a.clientId}
                    style={[s.clientRow, selectedId === a.clientId && s.clientRowSelected]}
                    onPress={() => setSelectedId(a.clientId)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.clientAvatar, selectedId === a.clientId && s.clientAvatarSelected]}>
                      <Text style={[s.clientInitial, selectedId === a.clientId && { color: '#FF5E00' }]}>
                        {(a.clientName ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[s.clientName, selectedId === a.clientId && { color: '#fff' }]}>
                      {a.clientName}
                    </Text>
                    {selectedId === a.clientId && (
                      <MaterialCommunityIcons name="check-circle" size={18} color="#FF5E00" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Date preset */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Período de reporte</Text>
          <View style={s.presetRow}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.presetBtn, preset === p.key && s.presetActive]}
                onPress={() => setPreset(p.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.presetTxt, preset === p.key && s.presetActiveTxt]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom date inputs */}
          {preset === 'personalizado' && (
            <View style={s.customRow}>
              <View style={s.customField}>
                <Text style={s.customLabel}>Desde</Text>
                <TextInput
                  style={s.dateInput}
                  value={customFrom}
                  onChangeText={setCustomFrom}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View style={s.customField}>
                <Text style={s.customLabel}>Hasta</Text>
                <TextInput
                  style={s.dateInput}
                  value={customTo}
                  onChangeText={setCustomTo}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          )}

          {/* Range summary */}
          <View style={s.rangeSummary}>
            <MaterialCommunityIcons name="calendar-range" size={14} color="#FF5E00" />
            <Text style={s.rangeTxt}>
              {fmtDate(range.from)}{range.from !== range.to ? ` — ${fmtDate(range.to)}` : ''}
            </Text>
          </View>
        </View>

        {/* Validation note for specific client */}
        {!scopeAll && !selectedId && (
          <View style={s.warnBox}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#F59E0B" />
            <Text style={s.warnTxt}>Selecciona un cliente de la lista.</Text>
          </View>
        )}
      </ScrollView>

      {/* Generate button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.genBtn, (generating || (!scopeAll && !selectedId)) && s.genBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={generating || (!scopeAll && !selectedId)}
        >
          {generating ? (
            <DumbbellSpinner size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
          )}
          <Text style={s.genBtnTxt}>
            {generating ? 'Generando PDF...' : 'Generar Reporte PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
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
  titleCol:  { flex: 1 },
  topTitle:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  topSub:    { color: '#444', fontSize: 12, marginTop: 2 },

  section:      { marginBottom: 24 },
  sectionLabel: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },

  // Scope toggle
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#222',
    backgroundColor: '#0c0c0c', alignItems: 'center',
  },
  toggleActive:    { borderColor: '#FF5E00', backgroundColor: '#3a1800' },
  toggleTxt:       { color: '#555', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  toggleActiveTxt: { color: '#FF5E00' },

  // Client list
  clientList: { marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  clientRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#111', backgroundColor: '#080808',
  },
  clientRowSelected: { backgroundColor: '#1a0900' },
  clientAvatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  clientAvatarSelected: { backgroundColor: '#3a1800' },
  clientInitial: { color: '#555', fontSize: 16, fontWeight: '800' },
  clientName:    { flex: 1, color: '#888', fontSize: 14, fontWeight: '600' },
  emptyTxt:      { color: '#333', fontSize: 13, textAlign: 'center', padding: 16 },

  // Presets
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: '#222', backgroundColor: '#0c0c0c', alignItems: 'center',
  },
  presetActive:    { borderColor: '#FF5E00', backgroundColor: '#3a1800' },
  presetTxt:       { color: '#555', fontSize: 12, fontWeight: '700' },
  presetActiveTxt: { color: '#FF5E00' },

  // Custom date
  customRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  customField: { flex: 1 },
  customLabel: { color: '#555', fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  dateInput: {
    backgroundColor: '#0c0c0c', borderWidth: 1, borderColor: '#222',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 14,
  },

  // Range summary
  rangeSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0c0c0c', borderWidth: 1, borderColor: '#1a1a1a',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  rangeTxt: { color: '#888', fontSize: 13 },

  // Warn
  warnBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1a1200', borderWidth: 1, borderColor: '#F59E0B33',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16,
  },
  warnTxt: { color: '#F59E0B', fontSize: 13 },

  // Footer + button
  footer: {
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1, borderTopColor: '#111',
    backgroundColor: '#000',
  },
  genBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FF5E00', borderRadius: 14, paddingVertical: 16,
  },
  genBtnDisabled: { opacity: 0.4 },
  genBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
