import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {Wallet, RefreshCw } from 'lucide-react'
import { getUserBalances, getPortfolio, getPortfolioHistory } from '../lib/api'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import html2canvas from 'html2canvas'
import { PositionShareCard } from '../components/PositionShareCard'

export default function CarteraPage() {
  const { getUser } = useAuth()
  const user = getUser()

  const masterWallet = user?.hlWalletAddress ?? ''
  const isWalletConnected = !!masterWallet && masterWallet.trim().length > 0

  const [sharePos, setSharePos] = useState<any | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const handleShareImage = async (pos: any) => {
    setSharePos(pos)

    requestAnimationFrame(async () => {
      setTimeout(async () => {
        if (!cardRef.current) return

        const originalStyleSheets = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');
        Object.defineProperty(document, 'styleSheets', {
          value: [],
          configurable: true
        });

        try {
          const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 2, // mejor calidad
            useCORS: true,
            allowTaint: true,
          })

          const dataUrl = canvas.toDataURL('image/png')

          //descarga directa resumen de posicion...
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = `${pos.coin}-position.png`
          link.click()
        } catch (error) {
          console.error("Error al generar la imagen de la tarjeta:", error)
        } finally {
          // Restauramos las hojas de estilo originales inmediatamente
          if (originalStyleSheets) {
            Object.defineProperty(Document.prototype, 'styleSheets', originalStyleSheets);
          } else {
            delete (document as any).styleSheets;
          }
          setSharePos(null)
        }
      }, 200) 
    })
  }

  const calculatePnlPercent = (pos: any): string => {
    try {
      const entryPx = parseFloat(pos.entryPrice)
      const size = parseFloat(pos.size)
      const leverage = parseFloat(pos.leverage) || 1
      const pnl = parseFloat(pos.unrealizedPnl)

      if (isNaN(entryPx) || isNaN(size) || isNaN(pnl) || entryPx === 0 || size === 0) {
        return '0.00%'
      }

      const margin = (entryPx * size) / leverage
      const roe = (pnl / margin) * 100

      const sign = roe >= 0 ? '+' : ''
      return `${sign}${roe.toFixed(2)}%`
    } catch (e) {
      return '0.00%'
    }
  }

  const { data: balanceData, isLoading: isLoadingBalances, refetch: refetchBalances } = useQuery({
    queryKey: ['userBalances'],
    queryFn: async () => {
      const res = await getUserBalances()
      return res.data
    }
  })

  const { data: portfolioData, isLoading: isLoadingPortfolio, refetch: refetchPortfolio, isFetching: isFetchingPortfolio } = useQuery({
    queryKey: ['userPortfolio', masterWallet],
    queryFn: async () => {
      if (!isWalletConnected) return null
      const res = await getPortfolio(masterWallet)
      return res.data
    },
    enabled: isWalletConnected
  })

  const handleRefresh = () => {
    refetchBalances()
    if (isWalletConnected) {
      refetchPortfolio()
    }
  }

const patrimonioTotal = portfolioData?.totalBalance ?? balanceData?.accountValue ?? '0.00'
const marginPerps    = portfolioData?.marginUsed ?? '0.00'
  const maintenanceMargin = balanceData?.maintenanceMargin ?? '0.00'
  const effectiveLeverage = balanceData?.effectiveLeverage ?? '1.00x'
  const withdrawableUsdc = portfolioData?.withdrawableUsdc ?? '0.00'
  
  const positions = portfolioData?.positions ?? []
  const trades = portfolioData?.trades ?? []
  const totalPnl = portfolioData?.totalPnl ?? '0.00'
  
  const isPnlPositive = totalPnl.startsWith('+') || parseFloat(totalPnl) > 0

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto font-sans text-zinc-200">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white">Mi Cartera</h1>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isLoadingBalances || isFetchingPortfolio}
          className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950/40 hover:bg-white hover:text-black hover:border-white transition-all text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded cursor-pointer self-start sm:self-center disabled:opacity-30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPortfolio ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {!isWalletConnected ? (
        /* Tarjeta de advertencia cuando no hay wallet conectada */
        <div className="border border-zinc-800 p-8 bg-zinc-950/20 rounded flex flex-col items-center justify-center text-center gap-4 py-16">
          <Wallet className="w-12 h-12 text-zinc-700 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">MetaMask No Conectada</h2>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de Balances Principales */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">

  {/* Tarjeta 1: Patrimonio Total */}
  <div className="border border-zinc-800 p-6 bg-zinc-950/20 rounded flex items-center justify-between">
    <div>
      <span className="text-[10px] text-white block uppercase tracking-widest font-mono">Patrimonio Total</span>
      <span className="text-2xl font-bold font-mono mt-1 block text-white">
        {isLoadingPortfolio ? 'Cargando...' : `$${patrimonioTotal}`}
      </span>
      <span className="text-[10px] text-white block uppercase font-mono mt-1">Disponible: ${withdrawableUsdc}</span>
    </div>
  </div>

  {/* Tarjeta 2: Margen en Perps */}
  <div className="border border-zinc-800 p-6 bg-zinc-950/20 rounded flex items-center justify-between">
    <div>
      <span className="text-[10px] text-white block uppercase tracking-widest font-mono">Margen en Perps</span>
      <span className="text-2xl font-bold font-mono mt-1 block text-white">
        {isLoadingPortfolio ? 'Cargando...' : `$${marginPerps}`}
      </span>
      <span className="text-[10px] text-white block uppercase font-mono mt-1">Mantenimiento: ${maintenanceMargin}</span>
    </div>
  </div>

  {/* Tarjeta 3: PnL Abierto Total — igual que antes */}
  <div className="border border-zinc-800 p-6 bg-zinc-950/20 rounded flex items-center justify-between">
    <div>
      <span className="text-[10px] text-white block uppercase tracking-widest font-mono">PnL Abierto Total</span>
      <span className={`text-2xl font-bold font-mono mt-1 block ${isPnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isLoadingPortfolio ? 'Cargando...' : totalPnl}
      </span>
    </div>
  </div>

  {/* Tarjeta 4: Apalancamiento Efectivo — igual que antes */}
  <div className="border border-zinc-800 p-6 bg-zinc-950/20 rounded flex items-center justify-between">
    <div>
      <span className="text-[10px] text-white block uppercase tracking-widest font-mono">Apalancamiento Efectivo</span>
      <span className="text-2xl font-bold font-mono mt-1 block text-white">{effectiveLeverage}</span>
    </div>
  </div>

</div>

          {/* Gráfico de Account Value */}
          <AccountValueChart masterWallet={masterWallet} isWalletConnected={isWalletConnected} />

          {/* POSICIONES ABIERTAS */}
          <div className="border border-zinc-800 p-6 bg-zinc-950/40 rounded flex flex-col gap-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-2">Posiciones Abiertas</h2>
              <span className="text-[12px] text-white uppercase tracking-widest font-mono">perps activos:</span>
            </div>

            <div className="overflow-x-auto">
              {positions.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-zinc-500 uppercase tracking-widest font-mono border-t border-zinc-900 pt-8">
                  No hay posiciones abiertas en este momento
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[12px] uppercase">
                  <thead>
                    <tr className="border-b border-zinc-900 text-white text-[12px] tracking-widest">
                      <th className="pb-3 text-[12px] text-white">Activo</th>
                      <th className="pb-3 text-[12px] text-white">Dirección</th>
                      <th className="pb-3 text-[12px] text-white">Tamaño</th>
                      <th className="pb-3 text-[12px] text-white">Precio Entrada</th>
                      <th className="pb-3 text-[12px] text-white">Precio Actual</th>
                      <th className="pb-3 text-[12px] text-white">PnL no Realizado</th>
                      <th className="pb-3 text-[12px] text-white">Compartir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {positions.map((pos: any, idx: number) => {
                      const isLong = pos.direction === 'LONG'
                      const isPosPnlPositive = pos.unrealizedPnl.startsWith('+') || parseFloat(pos.unrealizedPnl) > 0
                      
                      return (
                        <tr key={idx} className="hover:bg-zinc-950/20">
                          <td className="py-4 px-2 text-[12px] font-bold text-white flex items-center gap-2">
                            <span>{pos.coin}-PERP</span>
                          </td>
                          <td className="py-4 px-2 font-bold">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-bold ${
                              isLong ? 'text-white ' : 'text-white '
                            }`}>
                              {pos.direction}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right text-zinc-300 font-bold">{pos.size}</td>
                          <td className="py-4 px-2 text-right text-zinc-400 font-bold">${pos.entryPrice}</td>
                          <td className="py-4 px-2 text-right text-white font-bold">${pos.currentPrice}</td>
                          <td className={`py-4 px-2 text-right font-bold ${isPosPnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {pos.unrealizedPnl}
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button
                              onClick={() => handleShareImage(pos)}
                              className="text-[12px] uppercase tracking-widest px-3 py-1.5 border border-zinc-700 bg-zinc-950/40 text-white rounded hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer"
                            >
                              Card
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* HISTORIAL DE TRADES */}
          <div className="border border-zinc-800 p-6 bg-zinc-950/40 rounded flex flex-col gap-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white mb-2">Historial de Trades</h2>
              <span className="text-[10px] text-white uppercase tracking-widest font-mono">Registro historico de perps</span>
            </div>

            <div className="overflow-x-auto">
              {trades.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-zinc-500 uppercase tracking-widest font-mono border-t border-zinc-900 pt-8">
                  No se registran transacciones previas
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[12px] uppercase">
                  <thead>
                    <tr className="border-b border-zinc-900 text-white text-[12px] tracking-widest">
                      <th className="pb-3 px-2">Fecha</th>
                      <th className="pb-3 px-2">Activo</th>
                      <th className="pb-3 px-2">Operación</th>
                      <th className="pb-3 px-2 text-right">Tamaño</th>
                      <th className="pb-3 px-2 text-right">Precio Ejecución</th>
                      <th className="pb-3 px-2 text-right">PnL Realizado</th>
                      <th className="pb-3 px-2 text-right">Comisión (Fee)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {trades.map((trade: any, idx: number) => {
                      const isBuy = trade.side === 'BUY'
                      const isTradePnlPositive = trade.realizedPnl.startsWith('+') || parseFloat(trade.realizedPnl) > 0
                      
                      const dateObj = new Date(trade.timestamp)
                      const formattedDate = dateObj.toLocaleDateString('es-ES', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      }) + ' ' + dateObj.toLocaleTimeString('es-ES', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })

                      return (
                        <tr key={idx} className="hover:bg-zinc-950/20">
                          <td className="py-4 px-2 text-white font-mono text-[10px]">{formattedDate}</td>
                          <td className="py-4 px-2 font-bold text-white">{trade.coin}</td>
                          <td className="py-4 px-2 font-bold">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBuy ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right text-zinc-300 font-bold">{trade.size}</td>
                          <td className="py-4 px-2 text-right text-zinc-400 font-bold">${trade.price}</td>
                          <td className={`py-4 px-2 text-right font-bold ${
                            parseFloat(trade.realizedPnl) === 0 ? 'text-zinc-500' : isTradePnlPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {trade.realizedPnl}
                          </td>
                          <td className="py-4 px-2 text-right text-zinc-600">{trade.fee} USDC</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="fixed -left-[9999px] -top-[9999px]">
            {sharePos && (
              <PositionShareCard
                ref={cardRef}
                coin={sharePos.coin}
                direction={sharePos.direction}
                pnlPercent={calculatePnlPercent(sharePos)}
                entryPrice={sharePos.entryPrice}
                markPrice={sharePos.currentPrice}
              />
            )}
          </div>

        </>
      )}
    </div>
  )
}

function AccountValueChart({ masterWallet, isWalletConnected }: { masterWallet: string; isWalletConnected: boolean }) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d')

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['portfolioHistory', masterWallet, period],
    queryFn: async () => {
      if (!isWalletConnected) return []
      const res = await getPortfolioHistory(masterWallet, period)
      return res.data || []
    },
    enabled: isWalletConnected,
    refetchInterval: 30000
  })

  if (!isWalletConnected) {
    return (
      <div className="border border-zinc-800 p-8 bg-zinc-950/20 rounded flex flex-col items-center justify-center text-center gap-4 py-16">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Conecta tu wallet para ver el historial</span>
      </div>
    )
  }

  const hasEnoughData = historyData && historyData.length > 1
  
  let currentVal = 0
  let initialVal = 0
  let difference = 0
  let percentageChange = 0
  let isPositive = true

  if (hasEnoughData) {
    initialVal = historyData[0].value
    currentVal = historyData[historyData.length - 1].value
    difference = currentVal - initialVal
    percentageChange = initialVal !== 0 ? (difference / initialVal) * 100 : 0
    isPositive = difference >= 0
  }

  const chartColor = isPositive ? '#00d4aa' : '#ef4444'

  const formatXAxis = (tickItem: number) => {
    const dateObj = new Date(tickItem)
    if (period === '24h') {
      return dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else {
      return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
    }
  }

  const formatYAxis = (tickItem: number) => {
    return `$${Math.round(tickItem).toLocaleString('en-US')}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const dateObj = new Date(data.time)
      const formattedDate = dateObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return (
        <div className="border border-zinc-800 bg-zinc-950 p-3 rounded shadow-lg font-mono text-[10px] uppercase">
          <p className="text-zinc-500 mb-1">{formattedDate}</p>
          <p className="text-white font-bold">
            Valor:{' '}
            <span className={isPositive ? 'text-emerald-400' : 'text-rose-500'}>
              ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950/40 rounded p-6 flex flex-col gap-6 w-full">
      {/* Cabecera del gráfico */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-white block uppercase tracking-widest font-mono mb-1">Account Value</span>
          {isLoadingHistory ? (
            <div className="h-8 w-32 bg-zinc-900 animate-pulse rounded"></div>
          ) : hasEnoughData ? (
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold font-mono text-white">
                ${currentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{percentageChange.toFixed(2)}% (${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            </div>
          ) : (
            <span className="text-2xl font-bold font-mono text-zinc-600">$0.00</span>
          )}
        </div>

        {/* Filtros de periodo */}
        <div className="flex gap-1.5 border border-zinc-900 bg-zinc-950 p-1 rounded">
          {(['24h', '7d', '30d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all ${
                period === p
                  ? 'bg-zinc-800 text-white border border-zinc-700/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Área del gráfico
          Implementado con soporte en la biblioteca Recharts [26].
          Diseño e integración de curvas financieras estructuradas basadas en el tutorial:
          - LogRocket: "Using Recharts to build responsive charts in React financial apps" [27]
      */}
      <div className="h-64 w-full flex items-center justify-center">
        {isLoadingHistory ? (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono animate-pulse">
            Cargando historial...
          </div>
        ) : !hasEnoughData ? (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono border border-dashed border-zinc-800 w-full h-full flex items-center justify-center rounded">
            Sin datos suficientes para el periodo seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="#3f3f46"
                fontSize={8}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                dataKey="value"
                tickFormatter={formatYAxis}
                stroke="#3f3f46"
                fontSize={8}
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#27272a', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
