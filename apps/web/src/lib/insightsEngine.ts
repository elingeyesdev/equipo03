export type InsightLevel = 'info' | 'warning' | 'success';

export interface Insight {
  text: string;
  level: InsightLevel;
}

// ── Asistencia ───────────────────────────────────────────────────────────────
interface AsistenciaParams {
  total: number;
  avgDay: string;
  peakHr?: { name: string; total: number };
  peakDay?: { name: string; total: number };
  topActivities: { name: string; total: number }[];
  days: number;
}

export function insightsAsistencia(p: AsistenciaParams): Insight[] {
  const out: Insight[] = [];
  const avg = parseFloat(p.avgDay);

  if (p.total === 0) {
    out.push({ text: 'Sin check-ins en el período seleccionado.', level: 'warning' });
    return out;
  }

  if (p.peakHr) {
    const pct = p.total > 0 ? Math.round((p.peakHr.total / p.total) * 100) : 0;
    out.push({ text: `Hora pico: ${p.peakHr.name} — concentra el ${pct}% de la asistencia.`, level: 'info' });
  }

  if (p.peakDay) {
    out.push({ text: `Día más activo: ${p.peakDay.name} con ${p.peakDay.total} check-ins.`, level: 'info' });
  }

  if (avg < 5) {
    out.push({ text: `Promedio bajo: ${avg} check-ins/día. Considera revisar estrategias de retención.`, level: 'warning' });
  } else if (avg >= 20) {
    out.push({ text: `Excelente afluencia: ${avg} check-ins promedio por día.`, level: 'success' });
  }

  if (p.topActivities.length > 0) {
    out.push({ text: `Actividad más popular: "${p.topActivities[0].name}" con ${p.topActivities[0].total} reservas.`, level: 'success' });
  }

  return out;
}

// ── Churn ────────────────────────────────────────────────────────────────────
interface ChurnParams {
  total: number;
  activos: number;
  enRiesgo: number;
  inactivos: number;
  sinHistorial: number;
}

export function insightsChurn(p: ChurnParams): Insight[] {
  const out: Insight[] = [];
  if (p.total === 0) return out;

  const retencionPct = Math.round((p.activos / p.total) * 100);
  const riesgoPct    = Math.round((p.enRiesgo / p.total) * 100);

  if (retencionPct >= 80) {
    out.push({ text: `Retención excelente: ${retencionPct}% de usuarios activos en los últimos 30 días.`, level: 'success' });
  } else if (retencionPct >= 60) {
    out.push({ text: `Retención moderada: ${retencionPct}% de usuarios activos.`, level: 'info' });
  } else {
    out.push({ text: `Retención baja: solo el ${retencionPct}% de usuarios estuvo activo recientemente.`, level: 'warning' });
  }

  if (riesgoPct > 20) {
    out.push({ text: `${riesgoPct}% de usuarios en riesgo de abandono (sin check-in 31–90 días) — requieren intervención.`, level: 'warning' });
  }

  if (p.sinHistorial > 0) {
    out.push({ text: `${p.sinHistorial} usuario${p.sinHistorial > 1 ? 's' : ''} nunca ha${p.sinHistorial > 1 ? 'n' : ''} asistido. Oportunidad de activación.`, level: 'warning' });
  }

  if (p.inactivos > p.activos) {
    out.push({ text: `Los inactivos (${p.inactivos}) superan a los activos (${p.activos}). Revisar programa de fidelización.`, level: 'warning' });
  }

  return out;
}

// ── Consolidado ──────────────────────────────────────────────────────────────
interface ConsolidadoBranch {
  name: string;
  checkins: number;
  reservations: number;
  members: number;
}

interface ConsolidadoParams {
  branchData: ConsolidadoBranch[];
  totals: { checkins: number; members: number; reservations: number };
}

export function insightsConsolidado(p: ConsolidadoParams): Insight[] {
  const out: Insight[] = [];
  if (p.branchData.length === 0) return out;

  const avgCI = p.totals.checkins / p.branchData.length;
  const leader = [...p.branchData].sort((a, b) => b.checkins - a.checkins)[0];
  const lagging = [...p.branchData].sort((a, b) => a.checkins - b.checkins)[0];

  if (leader && leader.checkins > avgCI * 1.5) {
    out.push({ text: `"${leader.name}" lidera con ${leader.checkins.toLocaleString('es-BO')} check-ins (+50% sobre el promedio).`, level: 'success' });
  }

  if (lagging && lagging.checkins < avgCI * 0.5 && p.branchData.length > 2) {
    out.push({ text: `"${lagging.name}" tiene actividad baja: ${lagging.checkins} check-ins vs ${Math.round(avgCI)} de promedio.`, level: 'warning' });
  }

  if (p.totals.members > 0) {
    const engagePct = Math.round((p.totals.checkins / p.totals.members) * 100);
    if (engagePct < 30) {
      out.push({ text: `Baja tasa de visitas: solo el ${engagePct}% de miembros generó check-in en el período.`, level: 'warning' });
    } else if (engagePct >= 80) {
      out.push({ text: `Alta participación: el ${engagePct}% de miembros generó al menos un check-in.`, level: 'success' });
    }
  }

  return out;
}

// ── Cancelaciones ─────────────────────────────────────────────────────────────
interface CancelacionesParams {
  total: number;
  canceladas: number;
  cancelRate: number;
  byActivity: { name: string; tasa: number }[];
}

export function insightsCancelaciones(p: CancelacionesParams): Insight[] {
  const out: Insight[] = [];
  if (p.total === 0) return out;

  if (p.cancelRate >= 40) {
    out.push({ text: `Tasa de cancelación muy alta: ${p.cancelRate}%. Revisar política y causas principales.`, level: 'warning' });
  } else if (p.cancelRate >= 25) {
    out.push({ text: `Tasa de cancelación elevada: ${p.cancelRate}% — por encima del 25% recomendado.`, level: 'warning' });
  } else if (p.cancelRate < 10) {
    out.push({ text: `Excelente tasa de cancelación: solo ${p.cancelRate}% de reservas canceladas.`, level: 'success' });
  }

  const highCancel = p.byActivity.filter(a => a.tasa >= 40);
  if (highCancel.length > 0) {
    out.push({ text: `${highCancel.length} actividad${highCancel.length > 1 ? 'es' : ''} con tasa ≥40%: "${highCancel[0].name}" y otras. Requieren atención.`, level: 'warning' });
  }

  return out;
}

// ── Frecuencia ────────────────────────────────────────────────────────────────
interface FrecuenciaParams {
  uniqueUsers: number;
  avgPerUser: string;
  peakDay?: { name: string };
  totalCheckins: number;
}

export function insightsFrecuencia(p: FrecuenciaParams): Insight[] {
  const out: Insight[] = [];
  if (p.uniqueUsers === 0) return out;

  const avg = parseFloat(p.avgPerUser);

  if (avg >= 3) {
    out.push({ text: `Alta frecuencia: ${avg} visitas promedio por usuario en el período.`, level: 'success' });
  } else if (avg < 1.5) {
    out.push({ text: `Frecuencia baja: ${avg} visitas/usuario. Considera programas de motivación.`, level: 'warning' });
  }

  if (p.peakDay) {
    out.push({ text: `Día más concurrido: ${p.peakDay.name}. Asegura cobertura suficiente de personal.`, level: 'info' });
  }

  return out;
}

// ── Maquinas ───────────────────────────────────────────────────────────────────
interface MaquinasParams {
  total: number;
  maintenance: number;
  available: number;
}

export function insightsMaquinas(p: MaquinasParams): Insight[] {
  const out: Insight[] = [];
  if (p.total === 0) return out;

  const maintPct = Math.round((p.maintenance / p.total) * 100);

  if (maintPct >= 20) {
    out.push({ text: `${maintPct}% del equipamiento en mantenimiento (${p.maintenance} máquinas). Impacto en capacidad operativa.`, level: 'warning' });
  } else if (maintPct === 0) {
    out.push({ text: `Todo el equipamiento operativo. Sin máquinas en mantenimiento.`, level: 'success' });
  }

  const availPct = Math.round((p.available / p.total) * 100);
  if (availPct >= 80) {
    out.push({ text: `Alta disponibilidad: ${availPct}% del equipamiento disponible.`, level: 'success' });
  }

  return out;
}

// ── Aforo ─────────────────────────────────────────────────────────────────────
interface AforoParams {
  avgPct: number;
  highAlert: number;
  branches: number;
}

export function insightsAforo(p: AforoParams): Insight[] {
  const out: Insight[] = [];
  if (p.branches === 0) return out;

  if (p.highAlert > 0) {
    out.push({ text: `${p.highAlert} sucursal${p.highAlert > 1 ? 'es' : ''} con ocupación ≥80% — riesgo de congestión.`, level: 'warning' });
  }

  if (p.avgPct >= 70) {
    out.push({ text: `Ocupación promedio alta: ${p.avgPct}%. Evaluar expansión de capacidad.`, level: 'info' });
  } else if (p.avgPct < 30) {
    out.push({ text: `Ocupación promedio baja: ${p.avgPct}%. Oportunidad para captar nuevos miembros.`, level: 'info' });
  }

  return out;
}

// ── Ranking ───────────────────────────────────────────────────────────────────
interface RankingParams {
  ranked: { name: string; score: number }[];
  avgScore: number;
}

export function insightsRanking(p: RankingParams): Insight[] {
  const out: Insight[] = [];
  if (p.ranked.length < 2) return out;

  const top = p.ranked[0];
  const second = p.ranked[1];

  if (top.score - second.score > 30) {
    out.push({ text: `"${top.name}" domina el ranking con ${top.score}/100 — ventaja de ${top.score - second.score} puntos sobre el 2°.`, level: 'success' });
  } else {
    out.push({ text: `Competencia reñida: "${top.name}" (${top.score}) y "${second.name}" (${second.score}) están muy parejos.`, level: 'info' });
  }

  const lowPerformers = p.ranked.filter(r => r.score < 30);
  if (lowPerformers.length > 0) {
    out.push({ text: `${lowPerformers.length} sede${lowPerformers.length > 1 ? 's' : ''} con score menor a 30/100 — requieren plan de mejora.`, level: 'warning' });
  }

  if (p.avgScore >= 60) {
    out.push({ text: `Score promedio alto: ${p.avgScore}/100 — red con buen desempeño general.`, level: 'success' });
  }

  return out;
}

// ── Actividades ───────────────────────────────────────────────────────────────
interface ActividadesParams {
  total: number;
  pctComp: number;
  pctCancel: number;
  topActivity?: { name: string; total: number };
}

export function insightsActividades(p: ActividadesParams): Insight[] {
  const out: Insight[] = [];
  if (p.total === 0) return out;

  if (p.pctComp >= 70) {
    out.push({ text: `Alta tasa de completación: ${p.pctComp}% de reservas completadas exitosamente.`, level: 'success' });
  }

  if (p.pctCancel >= 30) {
    out.push({ text: `Tasa de cancelación elevada: ${p.pctCancel}% del total de reservas.`, level: 'warning' });
  }

  if (p.topActivity) {
    out.push({ text: `Actividad más demandada: "${p.topActivity.name}" con ${p.topActivity.total} reservas.`, level: 'info' });
  }

  return out;
}

// ── Auditoría ─────────────────────────────────────────────────────────────────
interface AuditoriaParams {
  total: number;
  uniqueUsers: number;
  activeDays: number;
  days: number;
}

export function insightsAuditoria(p: AuditoriaParams): Insight[] {
  const out: Insight[] = [];
  if (p.total === 0) {
    out.push({ text: 'Sin registros de acceso en el período seleccionado.', level: 'warning' });
    return out;
  }

  const coveragePct = Math.round((p.activeDays / Math.max(1, p.days)) * 100);
  if (coveragePct < 50) {
    out.push({ text: `Solo el ${coveragePct}% de días con actividad registrada en el período.`, level: 'info' });
  } else {
    out.push({ text: `${p.activeDays} días con accesos registrados — cobertura del ${coveragePct}% del período.`, level: 'info' });
  }

  const avgPerUser = p.uniqueUsers > 0 ? (p.total / p.uniqueUsers).toFixed(1) : '0';
  out.push({ text: `${p.uniqueUsers} usuarios únicos con promedio de ${avgPerUser} accesos cada uno.`, level: 'info' });

  return out;
}
