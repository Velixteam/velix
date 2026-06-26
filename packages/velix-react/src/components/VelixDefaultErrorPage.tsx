import React, { useState } from 'react'
import type { ErrorProps } from '@teamvelix/velix-core'

export interface ErrorPageProps extends ErrorProps {}

const STATUS_CONFIG: Record<number, { label: string; color: string; glow: string }> = {
  400: { label: 'Bad Request',           color: '#f59e0b', glow: 'rgba(245,158,11,0.06)' },
  401: { label: 'Unauthorized',          color: '#f59e0b', glow: 'rgba(245,158,11,0.06)' },
  403: { label: 'Forbidden',             color: '#f59e0b', glow: 'rgba(245,158,11,0.06)' },
  404: { label: 'Page not found',        color: '#00e87a', glow: 'rgba(0,232,122,0.05)' },
  500: { label: 'Internal Server Error', color: '#ff6b6b', glow: 'rgba(255,107,107,0.06)' },
  503: { label: 'Service Unavailable',   color: '#ff6b6b', glow: 'rgba(255,107,107,0.06)' },
}

export function VelixDefaultErrorPage({ error, reset }: ErrorPageProps) {
  const [stackOpen, setStackOpen] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'
  const status = (error as any).status ?? 500
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[500]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem',
    }}>

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(#1e201e 1px, transparent 1px),
          linear-gradient(90deg, #1e201e 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: 0.3,
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: '500px', height: '300px',
        background: `radial-gradient(ellipse, ${config.glow} 0%, transparent 70%)`,
        top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Logo top-left */}
      <div style={{
        position: 'absolute', top: '1.5rem', left: '2rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00e87a',
        }} />
        <span style={{
          fontWeight: 800, fontSize: '1rem', color: '#fafaf8',
          letterSpacing: '-0.02em',
        }}>
          Velix
        </span>
      </div>

      {/* Main card */}
      <div style={{
        position: 'relative',
        background: '#111211',
        border: '1px solid #1e201e',
        borderRadius: '16px',
        padding: '3rem',
        width: '100%',
        maxWidth: '520px',
        textAlign: 'center',
      }}>

        {/* Status code */}
        <div style={{
          fontFamily: '"Syne", system-ui, sans-serif',
          fontSize: '6rem',
          fontWeight: 800,
          color: config.color,
          lineHeight: 1,
          marginBottom: '0.75rem',
          letterSpacing: '-0.04em',
        }}>
          {status}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: '"Syne", system-ui, sans-serif',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#fafaf8',
          margin: '0 0 1.25rem',
        }}>
          {config.label}
        </h1>

        {/* Divider */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          marginBottom: '1.25rem',
          borderRadius: '999px',
        }} />

        {/* Message */}
        <p style={{
          fontSize: '0.9rem',
          color: '#6b7068',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}>
          {error.message}
          {(error as any).digest && (
            <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#3a3d3a' }}>
              ID: {(error as any).digest}
            </span>
          )}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{
            background: '#00e87a', color: '#0a0a0a',
            padding: '0.625rem 1.5rem', borderRadius: '8px',
            fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none', fontFamily: 'system-ui',
            transition: 'opacity 0.2s',
          }}>
            Go home
          </a>
          <button onClick={() => window.history.back()} style={{
            background: 'transparent', color: '#e8ebe5',
            padding: '0.625rem 1.5rem', borderRadius: '8px',
            border: '1px solid #1e201e',
            fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'system-ui',
          }}>
            Go back
          </button>
          {status === 500 && (
            <button onClick={reset} style={{
              background: 'transparent', color: '#6b7068',
              padding: '0.625rem 1.5rem', borderRadius: '8px',
              border: '1px solid #1e201e',
              fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', fontFamily: 'system-ui',
            }}>
              Try again
            </button>
          )}
        </div>
      </div>

      {/* DEV ONLY — Stack trace collapsible */}
      {isDev && error.stack && (
        <div style={{
          position: 'relative',
          marginTop: '1.5rem',
          width: '100%', maxWidth: '520px',
          background: '#111211',
          border: '1px solid #1e201e',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setStackOpen(o => !o)}
            style={{
              width: '100%', padding: '0.875rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6b7068', fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#ff6b6b' }}>DEV</span>
            <span style={{ flex: 1, textAlign: 'left', marginLeft: '0.75rem' }}>Stack trace</span>
            <span>{stackOpen ? '▲' : '▼'}</span>
          </button>
          {stackOpen && (
            <pre style={{
              margin: 0, padding: '0 1.25rem 1.25rem',
              fontSize: '0.75rem', lineHeight: 1.7,
              color: '#6b7068', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', fontFamily: 'monospace',
              maxHeight: '240px', overflowY: 'auto',
            }}>
              {error.stack}
            </pre>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: '1.5rem',
        fontSize: '0.75rem', color: '#2a2d2a',
        fontFamily: 'monospace',
      }}>
        Velix v5.2 · velixcloud.io
      </div>
    </div>
  )
}
