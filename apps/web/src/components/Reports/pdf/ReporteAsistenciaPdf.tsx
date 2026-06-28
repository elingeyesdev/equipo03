import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, ORANGE, GRAY_L } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page, paddingBottom: 30 },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartHalf: { width: '48%' },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartFull: { width: '100%', marginBottom: 8 },
  chartLabel:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
});

export interface AsistenciaPdfData {
  gymName?: string;
  period: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  topActividades: { name: string; total: number }[];
  charts: { barDia?: string; barHora?: string; barMensual?: string };
}

export function ReporteAsistenciaPdf({ data }: { data: AsistenciaPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Asistencia por Sucursal" gymName={data.gymName} />
        <PdfMetaStrip period={data.period} genAt={data.genAt} />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          <PdfSectionTitle>Distribución de Asistencia</PdfSectionTitle>
          <View style={s.chartsRow}>
            <View style={s.chartHalf}>
              <Text style={s.chartLabel}>Por día de semana</Text>
              {data.charts.barDia && <Image src={data.charts.barDia} style={{ width: '100%' }} />}
            </View>
            <View style={s.chartHalf}>
              <Text style={s.chartLabel}>Por franja horaria</Text>
              {data.charts.barHora && <Image src={data.charts.barHora} style={{ width: '100%' }} />}
            </View>
          </View>

          {data.charts.barMensual && (
            <>
              <PdfSectionTitle>Comparativo Mensual</PdfSectionTitle>
              <Image src={data.charts.barMensual} style={s.chartFull} />
            </>
          )}

          {data.topActividades.length > 0 && (
            <>
              <PdfSectionTitle>Actividades con Más Reservas</PdfSectionTitle>
              <PdfTable
                headers={['#', 'Actividad', 'Reservas']}
                rows={data.topActividades.map((a, i) => [String(i + 1), a.name, String(a.total)])}
                rightAlignFrom={2}
                accent={ORANGE}
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
