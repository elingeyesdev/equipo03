import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { PdfHeader, PdfMetaStrip, PdfSectionTitle, PdfTable, PdfFooter, PdfPageNumbers, base, ORANGE, BLUE, BORDER, GRAY_L, GRAY_BG, DARK } from './shared';

const s = StyleSheet.create({
  page:    { ...base.page },
  body:    { paddingHorizontal: 32, paddingTop: 18 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: '30%', borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 10 },
  kpiLabel:{ color: GRAY_L, fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  kpiVal:  { color: DARK, fontSize: 15, fontFamily: 'Helvetica-Bold' },
  chartFull:{ width: '100%', marginBottom: 8 },
  totalRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
             borderWidth: 1, borderLeftWidth: 3, borderColor: BORDER, borderLeftColor: ORANGE,
             borderRadius: 6, padding: 12, backgroundColor: '#FFFBF9', marginTop: 16 },
  totalLabel:{ color: DARK, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  totalBlock:{ alignItems: 'flex-end' },
  totalSub:  { color: GRAY_L, fontSize: 7, textTransform: 'uppercase' },
  totalNum:  { fontSize: 13, fontFamily: 'Helvetica-Bold' },
});

export interface ConsolidadoPdfData {
  period: string;
  genAt: string;
  kpis: { label: string; value: string; accent: string }[];
  brandGroups: { brand: string; rows: { name: string; members: string; checkins: string; reservations: string; machines: string }[] }[];
  totals: { members: string; checkins: string; reservations: string; machines: string };
  charts: { barBranches?: string };
}

export function ReporteConsolidadoPdf({ data }: { data: ConsolidadoPdfData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader title="Consolidado de Sucursales" gymName="Todas las marcas y sucursales" />
        <PdfMetaStrip period={data.period} genAt={data.genAt} />
        <View style={s.body}>
          {/* KPI grid 3+3 */}
          <View style={s.kpiGrid}>
            {data.kpis.map((k, i) => (
              <View key={i} style={[s.kpiCard, { borderLeftWidth: 3, borderLeftColor: k.accent }]}>
                <Text style={s.kpiLabel}>{k.label}</Text>
                <Text style={s.kpiVal}>{k.value}</Text>
              </View>
            ))}
          </View>

          {data.charts.barBranches && (
            <>
              <PdfSectionTitle>Actividad por Sucursal</PdfSectionTitle>
              <Image src={data.charts.barBranches} style={s.chartFull} />
            </>
          )}

          {data.brandGroups.map(bg => (
            <View key={bg.brand} wrap={false}>
              <PdfSectionTitle>{bg.brand}</PdfSectionTitle>
              <PdfTable
                headers={['Sucursal', 'Usuarios', 'Check-ins', 'Reservas', 'Máquinas']}
                rows={[
                  ...bg.rows.map(r => [r.name, r.members, r.checkins, r.reservations, r.machines]),
                  [`Subtotal ${bg.brand}`,
                    String(bg.rows.reduce((s, r) => s + Number(r.members), 0)),
                    String(bg.rows.reduce((s, r) => s + Number(r.checkins), 0)),
                    String(bg.rows.reduce((s, r) => s + Number(r.reservations), 0)),
                    String(bg.rows.reduce((s, r) => s + Number(r.machines), 0)),
                  ],
                ]}
                rightAlignFrom={1}
              />
            </View>
          ))}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total General</Text>
            <View style={{ flexDirection: 'row', gap: 32 }}>
              {[
                { sub: 'Usuarios',   val: data.totals.members,      color: DARK },
                { sub: 'Check-ins',  val: data.totals.checkins,     color: ORANGE },
                { sub: 'Reservas',   val: data.totals.reservations, color: BLUE },
                { sub: 'Máquinas',   val: data.totals.machines,     color: DARK },
              ].map(t => (
                <View key={t.sub} style={s.totalBlock}>
                  <Text style={s.totalSub}>{t.sub}</Text>
                  <Text style={[s.totalNum, { color: t.color }]}>{t.val}</Text>
                </View>
              ))}
            </View>
          </View>

          <PdfFooter genAt={data.genAt} label="GymSync — Reporte Consolidado Interno" />
        </View>
        <PdfPageNumbers />
      </Page>
    </Document>
  );
}
