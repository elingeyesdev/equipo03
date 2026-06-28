import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

// ─── Colores ────────────────────────────────────────────────────────────────
export const ORANGE  = '#FF5E00';
export const DARK    = '#111827';
export const GRAY_D  = '#1f2937';
export const GRAY_M  = '#6B7280';
export const GRAY_L  = '#9CA3AF';
export const GRAY_XL = '#D1D5DB';
export const GRAY_BG = '#F9FAFB';
export const BORDER  = '#E5E7EB';
export const GREEN   = '#10B981';
export const RED     = '#EF4444';
export const YELLOW  = '#F59E0B';
export const BLUE    = '#2563EB';
export const PURPLE  = '#7C3AED';

// Fondo tintado para KPI cards según el color de acento
const TINT: Record<string, string> = {
  [ORANGE]:  '#FFF5EE',
  [GREEN]:   '#F0FDF4',
  [RED]:     '#FFF5F5',
  [YELLOW]:  '#FFFBF0',
  [BLUE]:    '#EFF6FF',
  [PURPLE]:  '#F5F3FF',
  [GRAY_L]:  '#F9FAFB',
  [GRAY_M]:  '#F9FAFB',
  '#6B7280': '#F9FAFB',
};

// ─── Estilos base ────────────────────────────────────────────────────────────
export const base = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    paddingBottom: 40,
  },
  // Header
  headerWrap: {
    backgroundColor: DARK,
    overflow: 'hidden',
  },
  headerAccentBar: {
    height: 4,
    backgroundColor: ORANGE,
  },
  headerInner: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerDivider: {
    width: 1,
    backgroundColor: '#374151',
    marginHorizontal: 24,
    alignSelf: 'stretch',
  },
  headerLogoText: { color: ORANGE, fontSize: 20, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  headerSubText:  { color: GRAY_L, fontSize: 7, letterSpacing: 2, marginTop: 3 },
  headerTitle:    { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  headerGym:      { color: GRAY_L, fontSize: 9, marginTop: 3, textAlign: 'right' },
  // Meta strip
  metaWrap: {
    backgroundColor: GRAY_BG,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingHorizontal: 32, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 36,
  },
  metaLabel: { color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { color: DARK, fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  metaBadge: {
    backgroundColor: ORANGE, borderRadius: 3,
    paddingHorizontal: 7, paddingVertical: 3,
    marginLeft: 'auto',
  },
  metaBadgeText: {
    color: '#ffffff', fontSize: 7,
    fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1,
  },
  // Body
  body: { paddingHorizontal: 32, paddingTop: 18 },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 6, padding: 12,
  },
  kpiLabel: { color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  kpiValue: { color: DARK, fontSize: 17, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  // Section title
  sectionTitleWrap: {
    marginBottom: 12, marginTop: 22,
    paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sectionTitleDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: ORANGE,
  },
  sectionTitleText: {
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 2, color: ORANGE,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GRAY_D,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableTh: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 1,
    color: '#ffffff',
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableTd: { fontSize: 8, color: DARK, paddingVertical: 5 },
  // Chart image
  chartImage: { width: '100%', marginBottom: 8 },
  chartImageHalf: { width: '48%' },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  // Footer
  footer: {
    marginTop: 20, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { color: GRAY_XL, fontSize: 8 },
  footerBrand: { color: ORANGE, fontSize: 8, fontFamily: 'Helvetica-Bold' },
});

// ─── Componentes compartidos ─────────────────────────────────────────────────

interface HeaderProps { title: string; gymName?: string }
export function PdfHeader({ title, gymName }: HeaderProps) {
  return (
    <View style={base.headerWrap}>
      <View style={base.headerAccentBar} />
      <View style={base.headerInner}>
        <View>
          <Text style={base.headerLogoText}>GYMSYNC</Text>
          <Text style={base.headerSubText}>SISTEMA DE GESTIÓN DEPORTIVA</Text>
        </View>
        <View style={base.headerDivider} />
        <View>
          <Text style={base.headerTitle}>{title}</Text>
          {gymName ? <Text style={base.headerGym}>{gymName}</Text> : null}
        </View>
      </View>
    </View>
  );
}

interface MetaProps { period: string; genAt: string; label?: string }
export function PdfMetaStrip({ period, genAt, label = 'Período' }: MetaProps) {
  return (
    <View style={base.metaWrap}>
      <View>
        <Text style={base.metaLabel}>{label}</Text>
        <Text style={base.metaValue}>{period}</Text>
      </View>
      <View>
        <Text style={base.metaLabel}>Generado</Text>
        <Text style={base.metaValue}>{genAt}</Text>
      </View>
      <View style={base.metaBadge}>
        <Text style={base.metaBadgeText}>Oficial</Text>
      </View>
    </View>
  );
}

interface Kpi { label: string; value: string; accent: string }
export function PdfKpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <View style={base.kpiRow}>
      {kpis.map((k, i) => (
        <View key={i} style={[
          base.kpiCard,
          {
            borderLeftWidth: 3,
            borderLeftColor: k.accent,
            backgroundColor: TINT[k.accent] ?? '#F9FAFB',
          },
        ]}>
          <Text style={base.kpiLabel}>{k.label}</Text>
          <Text style={[base.kpiValue, { fontSize: k.value.length > 12 ? 10 : 17, color: k.accent }]}>
            {k.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PdfSectionTitle({ children }: { children: string }) {
  return (
    <View style={base.sectionTitleWrap}>
      <View style={base.sectionTitleDot} />
      <Text style={base.sectionTitleText}>{children}</Text>
    </View>
  );
}

interface TableProps {
  headers: string[];
  rows: string[][];
  rightAlignFrom?: number;
  accent?: string;
  altBg?: string;
}
export function PdfTable({ headers, rows, rightAlignFrom = 99, accent, altBg = GRAY_BG }: TableProps) {
  const colW = `${Math.floor(100 / headers.length)}%` as `${number}%`;
  return (
    <View>
      <View style={base.tableHeader}>
        {headers.map((h, i) => (
          <Text key={i} style={[
            base.tableTh,
            { width: colW, textAlign: i >= rightAlignFrom ? 'right' : 'left', paddingHorizontal: 6 },
          ]}>{h}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[base.tableRow, { backgroundColor: ri % 2 === 0 ? altBg : '#ffffff' }]}>
          {row.map((cell, ci) => (
            <Text key={ci} style={[
              base.tableTd,
              { width: colW, textAlign: ci >= rightAlignFrom ? 'right' : 'left', paddingHorizontal: 6 },
              ci === 0 && accent ? { fontFamily: 'Helvetica-Bold', color: accent } : {},
            ]}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PdfChartImage({ src, half = false }: { src?: string; half?: boolean }) {
  if (!src) return null;
  return <Image src={src} style={half ? base.chartImageHalf : base.chartImage} />;
}

export function PdfFooter({ genAt, label = 'GymSync — Sistema de Gestión Deportiva' }: { genAt: string; label?: string }) {
  return (
    <View style={base.footer}>
      <Text style={base.footerBrand}>GYMSYNC</Text>
      <Text style={base.footerText}>{label}</Text>
      <Text style={base.footerText}>{genAt}</Text>
    </View>
  );
}

export function PdfPageNumbers() {
  return (
    <Text
      style={{ position: 'absolute', bottom: 14, right: 32, fontSize: 8, color: GRAY_L }}
      render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `Página ${pageNumber} de ${totalPages}`
      }
      fixed
    />
  );
}
