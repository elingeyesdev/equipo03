import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, GRAY_L, RED } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chartHalf: { width: '48%' },
  chartLabel:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  chartFull: { width: '100%', marginBottom: 8 },
});

export interface MaquinasPdfData {
  gymName?: string;
  cutDate: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  maintenance: { name: string; category: string; gym: string; updatedAt: string }[];
  allMachines: { name: string; category: string; gym: string; status: string }[];
  charts: { pieCat?: string; pieStatus?: string; barCat?: string };
}

export function ReporteMaquinasPdf({ data }: { data: MaquinasPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Inventario de Máquinas" gymName={data.gymName} />
        <PdfMetaStrip period={data.cutDate} genAt={data.genAt} label="Fecha de corte" />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          <PdfSectionTitle>Distribución del Inventario</PdfSectionTitle>
          <View style={s.chartsRow}>
            <View style={s.chartHalf}>
              <Text style={s.chartLabel}>Por categoría</Text>
              {data.charts.pieCat && <Image src={data.charts.pieCat} style={{ width: '100%' }} />}
            </View>
            <View style={s.chartHalf}>
              <Text style={s.chartLabel}>Por estado</Text>
              {data.charts.pieStatus && <Image src={data.charts.pieStatus} style={{ width: '100%' }} />}
            </View>
          </View>

          {data.charts.barCat && (
            <>
              <PdfSectionTitle>Máquinas por Categoría</PdfSectionTitle>
              <Image src={data.charts.barCat} style={s.chartFull} />
            </>
          )}

          {data.maintenance.length > 0 && (
            <>
              <PdfSectionTitle>Pendientes de Mantenimiento ({data.maintenance.length})</PdfSectionTitle>
              <PdfTable
                headers={['Máquina', 'Categoría', 'Sucursal', 'Últ. actualiz.']}
                rows={data.maintenance.map(m => [m.name, m.category, m.gym, m.updatedAt])}
                accent={RED}
              />
            </>
          )}

          {data.allMachines.length > 0 && (
            <>
              <PdfSectionTitle>Inventario Completo ({data.allMachines.length})</PdfSectionTitle>
              <PdfTable
                headers={['Máquina', 'Categoría', 'Sucursal', 'Estado']}
                rows={data.allMachines.map(m => [m.name, m.category, m.gym, m.status])}
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
