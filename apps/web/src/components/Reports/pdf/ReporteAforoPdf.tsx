import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfKpiRow, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, GREEN, YELLOW, RED, GRAY_L } from './shared';

const s = StyleSheet.create({
  page:      { ...base.page },
  body:      { paddingHorizontal: 32, paddingTop: 18 },
  chartFull: { width: '100%', marginBottom: 8 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12, marginTop: 4 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { color: GRAY_L, fontSize: 8 },
});

export interface AforoPdfData {
  gymName?: string;
  cutDate: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  rows: { name: string; brand: string; occ: string; max: string; pct: string; hasData: boolean }[];
  machRows: { name: string; brand: string; machCap: string }[];
  charts: { barPct?: string };
}

export function ReporteAforoPdf({ data }: { data: AforoPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Ocupación y Aforo" gymName={data.gymName ?? 'Todas las sucursales'} />
        <PdfMetaStrip period={data.cutDate} genAt={data.genAt} label="Corte" />
        <View style={s.body}>
          <PdfKpiRow kpis={data.kpis} />

          <View style={s.legendRow}>
            {[{ c: GREEN, l: 'Bajo (< 50%)' }, { c: YELLOW, l: 'Medio (50–79%)' }, { c: RED, l: 'Alto (≥ 80%)' }].map(i => (
              <View key={i.l} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: i.c }]} />
                <Text style={s.legendTxt}>{i.l}</Text>
              </View>
            ))}
          </View>

          {data.charts.barPct && (
            <>
              <PdfSectionTitle>Utilización por Sucursal (%)</PdfSectionTitle>
              <Image src={data.charts.barPct} style={s.chartFull} />
            </>
          )}

          <PdfSectionTitle>Detalle por Sucursal</PdfSectionTitle>
          <PdfTable
            headers={['Sucursal', 'Marca', 'Ocupación', 'Cap. máx.', 'Utilización%']}
            rows={data.rows.map(r => [r.name, r.brand, r.hasData ? r.occ : '—', r.hasData ? r.max : '—', r.hasData ? r.pct + '%' : '—'])}
            rightAlignFrom={2}
          />

          {data.machRows.length > 0 && (
            <>
              <PdfSectionTitle>Capacidad de Máquinas por Sucursal</PdfSectionTitle>
              <PdfTable
                headers={['Sucursal', 'Marca', 'Cap. máquinas']}
                rows={data.machRows.map(r => [r.name, r.brand, r.machCap])}
                rightAlignFrom={2}
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
