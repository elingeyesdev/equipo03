import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, GREEN, RED, ORANGE, GRAY_L } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartFull: { width: '100%', marginBottom: 8 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 8, justifyContent: 'center' },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendTxt: { fontSize: 8, color: GRAY_L },
});

export interface ActividadesPdfData {
  gymName?: string;
  period: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  byActivity: { name: string; total: string; confirmada: string; completada: string; cancelada: string; pendiente: string; cancelRate: string }[];
  charts: { barStacked?: string };
}

export function ReporteActividadesPdf({ data }: { data: ActividadesPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Reservas por Actividad" gymName={data.gymName} />
        <PdfMetaStrip period={data.period} genAt={data.genAt} />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          {data.charts.barStacked && (
            <>
              <PdfSectionTitle>Top Actividades por Reservas</PdfSectionTitle>
              <Image src={data.charts.barStacked} style={s.chartFull} />
              <View style={s.legendRow}>
                {[['Completadas', GREEN], ['Confirmadas', ORANGE], ['Canceladas', RED], ['Pendientes', GRAY_L]].map(([l, c]) => (
                  <View key={l} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: c }]} />
                    <Text style={s.legendTxt}>{l}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <PdfSectionTitle>Detalle por Actividad</PdfSectionTitle>
          <PdfTable
            headers={['Actividad', 'Total', 'Confirm.', 'Complet.', 'Cancel.', 'Pend.', 'Cancel%']}
            rows={data.byActivity.map(a => [a.name, a.total, a.confirmada, a.completada, a.cancelada, a.pendiente, a.cancelRate + '%'])}
            rightAlignFrom={1}
            accent={ORANGE}
          />

          <PdfFooter genAt={data.genAt} />
        </View>
        <PdfPageNumbers />
      </Page>
    </Document>
  );
}
