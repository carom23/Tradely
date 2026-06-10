import React from 'react'

type Props = {
  coin: string
  direction: 'LONG' | 'SHORT'
  pnlPercent: string // ej. "+28.9%" ya formateado
  entryPrice: string
  markPrice: string
}

export const PositionShareCard = React.forwardRef<HTMLDivElement, Props>(
  ({ coin, direction, pnlPercent, entryPrice, markPrice }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          height: '720px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 80px',
          background: '#000000',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#ffffff',
          boxSizing: 'border-box',
          border: '1px solid #1f2937',
        }}
      >
        {/* Lado izquierdo - datos y estadísticas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '14px', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#ffffff' }}>
            /// Tradely ///
            </span>
            <span style={{ fontSize: '36px', fontWeight: 600, color: '#ffffff' }}>
              Resumen de Posición
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                {coin}/USDC
              </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                {direction} / PERP
              </span>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '80px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
              {pnlPercent}
            </span>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '80px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#ffffff', opacity: 0.7 }}>
                Precio de entrada
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>
                ${entryPrice}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#ffffff', opacity: 0.7 }}>
                Precio actual
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>
                ${markPrice}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', fontSize: '12px', color: '#ffffff', opacity: 0.5 }}>
            {new Date().toLocaleString('es-ES')}
          </div>
        </div>

        {/* Lado derecho - Mascota Bird decorativa */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '40px' }}>
          <img
            src="/assets/bird.png"
            alt="Mascota Bird"
            style={{
              height: '420px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 60px rgba(255,255,255,0.15))',
            }}
          />
        </div>
      </div>
    )
  }
)

PositionShareCard.displayName = 'PositionShareCard'
