import React from 'react';
import { Document, Page, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, RED, GRAY_L } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartHalf: { width: '48%' },
  chartLabel:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
});

export interface CancelacionesPdfData {
  gymName?: string;
  period: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  byActivity: { name: string; total: string; cancelada: string; tasa: string }[];
  charts: { pieCancels?: string; barDia?: string };
}

export function ReporteCancelacionesPdf({ data }: { data: CancelacionesPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Cancelaciones y No-Shows" gymName={data.gymName} />
        <PdfMetaStrip period={data.period} genAt={data.genAt} />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          <PdfSectionTitle>Distribución por Estado y Día de Semana</PdfSectionTitle>
          <View style={s.chartsRow}>
            {data.charts.pieCancels && (
              <View style={s.chartHalf}>
                <Image src={data.charts.pieCancels} style={{ width: '100%' }} />
              </View>
            )}
            {data.charts.barDia && (
              <View style={s.chartHalf}>
                <Image src={data.charts.barDia} style={{ width: '100%' }} />
              </View>
            )}
          </View>

          {data.byActivity.length > 0 && (
            <>
              <PdfSectionTitle>Actividades con Más Cancelaciones</PdfSectionTitle>
              <PdfTable
                headers={['Actividad', 'Total reservas', 'Canceladas', 'Tasa%']}
                rows={data.byActivity.map(a => [a.name, a.total, a.cancelada, a.tasa + '%'])}
                rightAlignFrom={1}
                accent={RED}
              />
            </>
          )}

          <PdfFooter genAt={data.genAt} />
        </View>
        <PdfPageNumbers />
      </Page>
    </Document>
  );
}
