import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateUserWallets, getPortfolio } from '../lib/api'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { getUser } = useAuth()
  const user = getUser()

  const [copiedUser, setCopiedUser] = useState(false)
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(user?.hlWalletAddress || null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const masterWallet = metaMaskAddress ?? ''
  const isWalletConnected = !!masterWallet && masterWallet.trim().length > 0

  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['dashboardPortfolio', masterWallet],
    queryFn: async () => {
      if (!isWalletConnected) return null
      const res = await getPortfolio(masterWallet)
      return res.data
    },
    enabled: isWalletConnected,
    refetchInterval: 30000
  })

  // Derivados para las tarjetas
  const patrimonioTotal = portfolioData?.totalBalance ?? '0.00'
  const withdrawableUsdc = portfolioData?.withdrawableUsdc ?? '0.00'
  const totalPnl = portfolioData?.totalPnl ?? '0.00'
  const positionsCount = portfolioData?.positions?.length ?? 0

  // El primer elemento es el trade más reciente (novedades primero)
  const lastTrade = portfolioData?.trades?.[0]

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 4000)
  }

  const connectMetaMask = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        const address = accounts[0]
        
        setMetaMaskAddress(address)
        
        const currentUser = getUser()
        // 1. Guardar en LocalStorage para persistencia inmediata en el frontend
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          hlWalletAddress: address
        }))
        
        // 2. Sincronizar en el backend mediante la API de Tradely
        await updateUserWallets(address)
        
        showSuccess('¡MetaMask conectada con éxito!')
      } catch (err: any) {
        showError('Error al conectar MetaMask: ' + err.message)
      }
    } else {
      showError('MetaMask no está instalado. Por favor instálalo para continuar.')
    }
  }

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedUser(true)
    setTimeout(() => setCopiedUser(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">

      {/* notificaciones emergentes */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {successMsg && (
          <div className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Cabecera */}
      <div className="flex items-center justify-between ">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white">Panel de Control</h1>
        </div>
      </div>

      {/* contenedor principal */}
      <div className="grid grid-cols-1 lg:grid--12 gap-8">

        {/* cuenta principal de hyperliquid */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="border border-zinc-500 p-6 flex flex-col gap-6">
            <h2 className="text-xs font-bold uppercase tracking-widest">Cuenta Master Hyperliquid</h2>

            {!metaMaskAddress ? (
              <button
                onClick={connectMetaMask}
                className="w-full bg-white text-black font-bold text-[10px] uppercase tracking-widest py-4 hover:bg-zinc-200 transition-all"
              >
                Conectar Wallet
              </button>
            ) : (
              <div className="border border-zinc-800 p-4 flex items-center justify-between">
                <div className="truncate max-w-[280px]">
                  <span className="text-[12px] text-white font-bold uppercase block uppercase font-mono tracking-widest">conectada</span>
                  <span className="font-mono text-[10px]">{metaMaskAddress}</span>
                </div>
                <button
                  onClick={() => handleCopy(metaMaskAddress)}
                  className="text-[12px] uppercase font-bold hover:underline"
                >
                  {copiedUser ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>

          {/* panel de salud de la cuenta
              Diseñado con referencia técnica de:
              - Buildspace: "How to Build a Crypto Portfolio Tracker & Dashboard with React and Tailwind CSS" [24]
              - Chainlink Developer Blog: "Calculating liquidation prices and portfolio health in smart contracts and Web3 frontends" [25]
          */}
          {isWalletConnected && portfolioData && !isLoadingPortfolio && (
            <div className="border border-zinc-500 p-6 flex flex-col gap-5 bg-zinc-950/10">
              <div>
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-white">Salud de la Cuenta</h2>

              </div>

              {/* Nivel de Riesgo Destacado */}
              <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded flex items-center justify-between">
                <div>
                  <span className="text-[12px] text-white font-bold uppercase block uppercase font-mono tracking-widest">Riesgo de Liquidación</span>
                  <span className={`text-[10px] font-bold font-mono ${
                    portfolioData.liquidationRisk === 'ALTO' ? 'text-red-500' : portfolioData.liquidationRisk === 'MEDIO' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {portfolioData.liquidationRisk === 'ALTO' ? 'CRÍTICO (ALTO)' : portfolioData.liquidationRisk === 'MEDIO' ? '~ PREVENTIVO (MEDIO)' : '+ EXCELENTE (BAJO)'}
                  </span>
                </div>

              </div>

              {/* Barra de Progreso de Margen en Uso */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] text-white font-mono uppercase">
                  <span className="text-[12px] text-white font-bold uppercase block uppercase font-mono tracking-widest">Uso de Margen</span>
                  <span className="text-white font-bold">{portfolioData.marginUsage}</span>
                </div>
                <div className="w-full bg-zinc-900/80 h-2 border border-zinc-800 overflow-hidden p-[2px] rounded-sm">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      portfolioData.liquidationRisk === 'ALTO' ? 'bg-rose-500' : portfolioData.liquidationRisk === 'MEDIO' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: portfolioData.marginUsage }}
                  />
                </div>
              </div>

              {/* Mini KPIs de Salud */}
              <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3">
                <div className="flex flex-col">
                  <span className="text-[12px] text-white uppercase tracking-widest font-mono">Margen Usado</span>
                  <span className="text-[12px] font-mono font-bold text-white">${portfolioData.marginUsed || '0.00'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-white uppercase tracking-widest font-mono">Margen Perps</span>
                  <span className="text-[12px] font-mono font-bold text-white">${portfolioData.accountValue || '0.00'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-white uppercase tracking-widest font-mono">Apalancamiento Max</span>
                  <span className="text-[12px] font-mono font-bold text-white">{portfolioData.maxLeverage || '1.0x'}</span>
                </div>
              </div>

              {/* Distribución por Activo */}
              <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3">
                <span className="text-[12px] text-white block uppercase font-mono tracking-widest">Distribución</span>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(portfolioData.coinDistribution || {}).map(([coin, pct]) => {
                    const pctVal = parseFloat(pct as string) || 0;
                    return (
                      <div key={coin} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[14px] font-mono">
                          <span className="text-zinc-300 font-bold">{coin}</span>
                          <span className="text-zinc-400">{pct as string}</span>
                        </div>
                        <div className="w-full bg-zinc-900/40 h-1 overflow-hidden rounded-full">
                          <div 
                            className="bg-zinc-500 h-full transition-all duration-500" 
                            style={{ width: `${pctVal}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* resumen de portfolio */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="border border-zinc-500 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[14px] text-white font-bold uppercase tracking-widest text-white">Resumen de Portfolio</h2>

              </div>
            </div>

            {!isWalletConnected ? (
              <div className="text-[14px] text-white uppercase tracking-widest border border-dashed border-zinc-700 p-8 text-center font-mono leading-relaxed">
                Conecta tu wallet Master en MetaMask
              </div>
            ) : isLoadingPortfolio || !portfolioData ? (
              <div className="text-[14px] text-white uppercase tracking-widest animate-pulse text-center font-mono py-8">
                CARGANDO DATOS DE PORTFOLIO DESDE HYPERLIQUID...
              </div>
            ) : (
              <>
                {/* Mini-cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-zinc-800 bg-zinc-950/30 p-4 rounded flex flex-col gap-1">
                    <span className="text-[14px] text-white uppercase tracking-widest font-mono">
                      Patrimonio Total
                    </span>
                    <span className="text-lg font-bold font-mono text-white">
                      ${patrimonioTotal}
                    </span>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950/30 p-4 rounded flex flex-col gap-1">
                    <span className="text-[14px] text-white uppercase tracking-widest font-mono">
                      USDC Disponible
                    </span>
                    <span className="text-lg font-bold font-mono text-white">
                      ${withdrawableUsdc}
                    </span>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950/30 p-4 rounded flex flex-col gap-1">
                    <span className="text-[14px] text-white uppercase tracking-widest font-mono">
                      PnL Abierto
                    </span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        totalPnl.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'
                      }`}
                    >
                      {totalPnl}
                    </span>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950/30 p-4 rounded flex flex-col gap-1">
                    <span className="text-[14px] text-white uppercase tracking-widest font-mono">
                      Posiciones Abiertas
                    </span>
                    <span className="text-lg font-bold font-mono text-white">
                      {positionsCount}
                    </span>
                  </div>
                </div>

                {/* Posiciones de Riesgo */}
                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded flex flex-col gap-3">
                  <span className="text-[14px] text-white uppercase tracking-widest font-mono block">
                    Monitor de Posiciones Activas
                  </span>

                  {positionsCount === 0 ? (
                    <p className="text-[14px] text-zinc-500 uppercase tracking-widest font-mono">
                     Sin posiciones abiertas...
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] text-white font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 text-white uppercase text-[10px] tracking-widest">
                            <th className="py-2 text-[10px] text-white">Activo</th>
                            <th className="py-2 text-right text-[12px] text-white">Tamaño</th>
                            <th className="py-2 text-right text-[12px] text-white">Apal.</th>
                            <th className="py-2 text-right text-[12px] text-white">Entrada/Precio</th>
                            <th className="py-2 text-right text-[12px] text-white">Liq. Est.</th>
                            <th className="py-2 text-right text-[12px] text-white">PnL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...portfolioData.positions]
                            .sort((a, b) => parseFloat(b.leverage) - parseFloat(a.leverage))
                            .map((pos) => {
                              const isLong = pos.direction === 'LONG';
                              const isPosPnlPositive = pos.unrealizedPnl.startsWith('+') || parseFloat(pos.unrealizedPnl) > 0;
                              return (
                                <tr key={pos.coin} className="border-b border-zinc-950 hover:bg-zinc-900/10">
                                  <td className="py-2 font-bold text-white flex items-center gap-1.5">
                                    <span>{pos.coin}-PERP</span>
                                    <span
                                      className={`px-1 py-[1px] rounded-[2px] text-[10px] font-bold ${
                                        isLong
                                          ? ' text-white'
                                          : 'text-white '
                                      }`}
                                    >
                                      {pos.direction}
                                    </span>
                                  </td>
                                  <td className="py-2 text-right text-zinc-300 font-bold">{pos.size}</td>
                                  <td className="py-2 text-center text-zinc-400 font-bold">{pos.leverage}</td>
                                  <td className="py-2 text-right text-zinc-400">
                                    <span className="text-white">${pos.entryPrice}</span> / ${pos.currentPrice}
                                  </td>
                                  <td className={`py-2 text-right font-bold ${pos.liquidationPrice === 'N/A' ? 'text-zinc-500' : 'text-white-500'}`}>
                                    {pos.liquidationPrice === 'N/A' ? 'N/A' : `$${pos.liquidationPrice}`}
                                  </td>
                                  <td className={`py-2 text-right font-bold ${isPosPnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {pos.unrealizedPnl}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Último trade */}
                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                  <span className="text-[14px] text-white uppercase tracking-widest font-mono block mb-2">
                    Última operación
                  </span>
                  {!lastTrade ? (
                    <p className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono">
                      No se registran transacciones previas
                    </p>
                  ) : (
                    <div className="text-[12px] font-mono text-zinc-300">
                      <span className="font-bold text-white mr-1.5">{lastTrade.side}</span>
                      <span className="font-bold text-white mr-1.5">
                        {lastTrade.size} {lastTrade.coin}
                      </span>
                      <span className="text-zinc-500 mr-2"> en ${lastTrade.price}</span>
                      <span
                        className={
                          lastTrade.realizedPnl.startsWith('-') || parseFloat(lastTrade.realizedPnl) < 0
                            ? 'text-rose-500'
                            : parseFloat(lastTrade.realizedPnl) > 0
                            ? 'text-emerald-500'
                            : 'text-zinc-500'
                        }
                      >
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA hacia páginas completas */}
                <div className="flex flex-wrap gap-3 text-[10px] text-white font-bold">
                  <Link
                    to="/cartera"
                    className="px-4 py-2.5 border border-zinc-800 text-zinc-300 uppercase tracking-widest bg-zinc-950/40 hover:bg-white hover:text-black hover:border-white transition-all rounded cursor-pointer"
                  >
                    Ver cartera completa
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}