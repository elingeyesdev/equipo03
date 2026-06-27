import React from 'react';
import { fmtDate } from '../types';

export function ReportHeader({ title, gymName }: { title: string; gymName?: string }) {
  return (
    <div style={{ background: '#111827' }}>
      <div style={{ height: 4, background: '#FF5E00' }} />
      <div style={{ padding: '22px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#FF5E00', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>GYMSYNC</div>
          <div style={{ color: '#9CA3AF', fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 3 }}>
            Sistema de Gestión Deportiva
          </div>
        </div>
        <div style={{ width: 1, background: '#374151', alignSelf: 'stretch', margin: '0 28px', flexShrink: 0 }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 700 }}>{title}</div>
          {gymName && <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{gymName}</div>}
        </div>
      </div>
    </div>
  );
}

export function ReportMetaStrip({ from, to, genAt, label = 'Período' }: { from: string; to: string; genAt: string; label?: string }) {
  return (
    <div style={{ background: '#ffffff', borderBottom: '2px solid #000000', padding: '14px 40px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{fmtDate(from)} — {fmtDate(to)}</div>
        </div>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Generado</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{genAt}</div>
        </div>
      </div>
      <span style={{
        background: '#FF5E00', color: '#ffffff',
        padding: '3px 9px', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        Oficial
      </span>
    </div>
  );
}

export function ReportMetaStripSingle({ label, value, genAt }: { label: string; value: string; genAt: string }) {
  return (
    <div style={{ background: '#ffffff', borderBottom: '2px solid #000000', padding: '14px 40px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{value}</div>
        </div>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Generado</div>
          <div style={{ color: '#111827', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{genAt}</div>
        </div>
      </div>
      <span style={{
        background: '#FF5E00', color: '#ffffff',
        padding: '3px 9px', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        Oficial
      </span>
    </div>
  );
}

export function ReportKpiGrid({ kpis }: { kpis: { label: string; value: string; accent: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 2, background: '#2A2A2D' }}>
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          style={{
            background: '#111111',
            padding: '20px 22px',
          }}
        >
          <div style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 12 }}>
            {kpi.label}
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: kpi.value.length > 12 ? 16 : 36,
            fontWeight: 800,
            letterSpacing: '-1px',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}>
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 14, marginTop: 28, paddingBottom: 8,
      borderBottom: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ width: 3, height: 14, background: '#FF5E00', flexShrink: 0 }} />
      <h3 style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '2px', color: '#111111', margin: 0,
      }}>
        {children}
      </h3>
    </div>
  );
}

interface ReportTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  rightAlignFrom?: number;
  accentCol0?: string;
  fontSize?: number;
}
export function ReportTable({ headers, rows, rightAlignFrom = 99, accentCol0, fontSize = 12 }: ReportTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #111111' }}>
          {headers.map((h, i) => (
            <th
              key={h}
              style={{
                padding: '9px 12px',
                textAlign: i >= rightAlignFrom ? 'right' : 'left',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '1px', color: '#111111',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: '#ffffff', borderBottom: '1px solid #E5E7EB' }}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  padding: '9px 12px',
                  textAlign: ci >= rightAlignFrom ? 'right' : 'left',
                  color: ci === 0 && accentCol0 ? accentCol0 : '#374151',
                  fontWeight: ci === 0 && accentCol0 ? 700 : 400,
                  fontFamily: ci >= rightAlignFrom ? 'monospace' : 'inherit',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={headers.length} style={{ padding: '24px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Sin datos en el período seleccionado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function ChartEmpty({ height = 192 }: { height?: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height, width: '100%',
      border: '1px dashed #D1D5DB', background: '#F9FAFB',
    }}>
      <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', letterSpacing: '4px', textTransform: 'uppercase' }}>
        Sin datos suficientes para graficar
      </span>
    </div>
  );
}

export function ReportFooter({ genAt, label = 'GymSync — Sistema de Gestión Deportiva' }: { genAt: string; label?: string }) {
  return (
    <div style={{
      marginTop: 32, paddingTop: 14,
      borderTop: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ color: '#FF5E00', fontSize: 11, fontWeight: 800, letterSpacing: '-0.3px' }}>GYMSYNC</span>
      <span style={{ color: '#D1D5DB', fontSize: 11 }}>{label}</span>
      <span style={{ color: '#D1D5DB', fontSize: 11 }}>{genAt}</span>
    </div>
  );
}
