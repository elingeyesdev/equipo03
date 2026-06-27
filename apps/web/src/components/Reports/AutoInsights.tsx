import React, { useState } from 'react';
import type { Insight } from '../../lib/insightsEngine';

interface Props {
  insights: Insight[];
}

const LEVEL_BG: Record<string, string> = {
  warning: 'rgba(239,68,68,0.06)',
  success: 'rgba(16,185,129,0.06)',
  info:    'rgba(37,99,235,0.04)',
};

const LEVEL_BORDER: Record<string, string> = {
  warning: '#EF4444',
  success: '#10B981',
  info:    '#2563EB',
};

export function AutoInsights({ insights }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (insights.length === 0) return null;

  return (
    <div style={{ margin: '20px 0', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 0',
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6B7280' }}>
          Insights clave
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>
          {collapsed ? '+ mostrar' : '− ocultar'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{
                padding: '9px 12px',
                background: LEVEL_BG[ins.level],
                borderLeft: `3px solid ${LEVEL_BORDER[ins.level]}`,
              }}
            >
              <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
