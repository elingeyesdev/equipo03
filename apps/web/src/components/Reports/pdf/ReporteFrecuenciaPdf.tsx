import React from 'react';
import { Document, Page, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, ORANGE, GRAY_L } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartHalf: { width: '48%' },
  chartLabel:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
});

export interface FrecuenciaPdfData {
  gymName?: string;
  period: string;
  genAt: string;
  weeks: number;
  kpis: { label: string; value: string; accent: string }[];
  top20: { name: string; role: string; count: string; avgWeek: string }[];
  charts: { barDia?: string; pieBuckets?: string };
}

export function ReporteFrecuenciaPdf({ data }: { data: FrecuenciaPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Frecuencia de Entrenamiento" gymName={data.gymName} />
        <PdfMetaStrip period={data.period} genAt={data.genAt} />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          <PdfSectionTitle>Distribución de Asistencia</PdfSectionTitle>
          <View style={s.chartsRow}>
            {data.charts.barDia && (
              <View style={s.chartHalf}>
                <Image src={data.charts.barDia} style={{ width: '100%' }} />
              </View>
            )}
            {data.charts.pieBuckets && (
              <View style={s.chartHalf}>
                <Image src={data.charts.pieBuckets} style={{ width: '100%' }} />
              </View>
            )}
          </View>

          <PdfSectionTitle>Top {data.top20.length} Usuarios más Activos</PdfSectionTitle>
          <PdfTable
            headers={['#', 'Usuario', 'Rol', 'Check-ins', 'Prom/semana']}
            rows={data.top20.map((u, i) => [String(i + 1), u.name, u.role, u.count, u.avgWeek])}
            rightAlignFrom={3}
            accent={ORANGE}
          />

          <PdfFooter genAt={data.genAt} />
        </View>
        <PdfPageNumbers />
      </Page>
    </Document>
  );
}
