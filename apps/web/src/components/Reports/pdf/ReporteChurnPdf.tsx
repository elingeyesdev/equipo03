import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, GREEN, YELLOW, RED, GRAY_L, GRAY_BG, BORDER } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartWrap: { alignItems: 'center', marginBottom: 8 },
  chartImg:  { width: '70%' },
  legendBox: { backgroundColor: GRAY_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 10, marginTop: 16 },
  legendTitle:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendTxt: { fontSize: 7, color: GRAY_L },
});

export interface ChurnPdfData {
  gymName?: string;
  cutDate: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  enRiesgo:  { name: string; email: string; role: string; diffDays: string }[];
  inactivos: { name: string; email: string; role: string; diffDays: string }[];
  charts: { pieDist?: string };
}

export function ReporteChurnPdf({ data }: { data: ChurnPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Retención de Usuarios" gymName={data.gymName} />
        <PdfMetaStrip period={data.cutDate} genAt={data.genAt} label="Corte" />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          {data.charts.pieDist && (
            <>
              <PdfSectionTitle>Distribución por Estado de Retención</PdfSectionTitle>
              <View style={s.chartWrap}>
                <Image src={data.charts.pieDist} style={s.chartImg} />
              </View>
            </>
          )}

          {data.enRiesgo.length > 0 && (
            <>
              <PdfSectionTitle>Usuarios en Riesgo ({data.enRiesgo.length})</PdfSectionTitle>
              <PdfTable
                headers={['Usuario', 'Email', 'Rol', 'Días sin CI']}
                rows={data.enRiesgo.map(u => [u.name, u.email, u.role, u.diffDays])}
                rightAlignFrom={3}
                accent={YELLOW}
              />
            </>
          )}

          {data.inactivos.length > 0 && (
            <>
              <PdfSectionTitle>Usuarios Inactivos o Dados de Baja ({data.inactivos.length})</PdfSectionTitle>
              <PdfTable
                headers={['Usuario', 'Email', 'Rol', 'Días sin CI']}
                rows={data.inactivos.map(u => [u.name, u.email, u.role, u.diffDays])}
                rightAlignFrom={3}
                accent={RED}
              />
            </>
          )}

          <View style={s.legendBox}>
            <Text style={s.legendTitle}>Criterios de clasificación</Text>
            <View style={s.legendRow}>
              {[
                { c: GREEN,  l: 'Activo: último CI ≤30 días' },
                { c: YELLOW, l: 'En riesgo: sin CI 31–90 días' },
                { c: RED,    l: 'Inactivo: sin CI >90d o cuenta desactivada' },
                { c: '#9CA3AF', l: 'Sin historial: sin registro de CI' },
              ].map(i => (
                <View key={i.l} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: i.c }]} />
                  <Text style={s.legendTxt}>{i.l}</Text>
                </View>
              ))}
            </View>
          </View>

          <PdfFooter genAt={data.genAt} />
        </View>
        <PdfPageNumbers />
      </Page>
    </Document>
  );
}
