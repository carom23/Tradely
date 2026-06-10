import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Trash2, ToggleLeft, ToggleRight, Check, RefreshCw, Plus, ShieldAlert } from 'lucide-react'
import { getAlerts, createAlert, deleteAlert, toggleAlert, getPortfolio } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

export default function AlertasPage() {
  const { getUser } = useAuth()
  const user = getUser()
  const masterWallet = user?.hlWalletAddress ?? ''
  const isWalletConnected = !!masterWallet && masterWallet.trim().length > 0

  const userEmailDefault = user?.email ?? ''

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const [selectedPosition, setSelectedPosition] = useState<any | null>(null)
  const [posMetric, setPosMetric] = useState<'POSITION_PNL_USD' | 'POSITION_PNL_PERCENT' | 'POSITION_PRICE'>('POSITION_PNL_USD')
  const [posThreshold, setPosThreshold] = useState('')
  const [posEmail, setPosEmail] = useState(userEmailDefault)
  const [creatingPosAlert, setCreatingPosAlert] = useState(false)

  const [generalMetric, setGeneralMetric] = useState<'ACCOUNT_EQUITY_USD' | 'ACCOUNT_PNL_USD' | 'MARGIN_USAGE_PERCENT' | 'POSITION_PRICE'>('ACCOUNT_EQUITY_USD')
  const [generalCoin, setGeneralCoin] = useState('')
  const [generalOperator, setGeneralOperator] = useState<'BELOW' | 'ABOVE'>('BELOW')
  const [generalThreshold, setGeneralThreshold] = useState('')
  const [generalEmail, setGeneralEmail] = useState(userEmailDefault)
  const [creatingGeneral, setCreatingGeneral] = useState(false)

  useEffect(() => {
    if (userEmailDefault) {
      setPosEmail(userEmailDefault)
      setGeneralEmail(userEmailDefault)
    }
  }, [userEmailDefault])

  const { data: alertsData, isLoading: isLoadingAlerts, refetch: refetchAlerts, isFetching: isFetchingAlerts } = useQuery({
    queryKey: ['userAlerts'],
    queryFn: async () => {
      const res = await getAlerts()
      return res.data
    }
  })

  const alerts = alertsData ?? []

  const { data: portfolioData, isLoading: isLoadingPortfolio, refetch: refetchPortfolio } = useQuery({
    queryKey: ['alertsPortfolio', masterWallet],
    queryFn: async () => {
      if (!isWalletConnected) return null
      const res = await getPortfolio(masterWallet)
      return res.data
    },
    enabled: isWalletConnected
  })

  const positions = portfolioData?.positions ?? []

  const handleRefreshAll = () => {
    refetchAlerts()
    if (isWalletConnected) {
      refetchPortfolio()
    }
  }

  const handleCreatePosAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPosition || !posThreshold.trim() || !posEmail.trim()) return

    setCreatingPosAlert(true)
    setMessage(null)

    try {
      const thresholdVal = parseFloat(posThreshold)
      if (isNaN(thresholdVal)) {
        throw new Error('El valor del umbral debe ser numérico.')
      }


      let typeOp: 'ABOVE' | 'BELOW' = 'BELOW'
      if (posMetric === 'POSITION_PRICE') {
        const currentPx = parseFloat(selectedPosition.currentPrice) || 0
        typeOp = thresholdVal > currentPx ? 'ABOVE' : 'BELOW'
      }

      await createAlert({
        scope: 'POSITION',
        metric: posMetric,
        type: typeOp,
        coin: selectedPosition.coin,
        direction: selectedPosition.direction,
        threshold: thresholdVal,
        email: posEmail.trim()
      })

      setMessage({ text: `¡Alerta para ${selectedPosition.coin} creada con éxito!`, isError: false })
      setPosThreshold('')
      setSelectedPosition(null)
      refetchAlerts()
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      setMessage({ 
        text: err.response?.data?.error ?? err.message ?? 'Error al crear la alerta.', 
        isError: true 
      })
    } finally {
      setCreatingPosAlert(false)
    }
  }

  const handleCreateGeneralAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generalThreshold.trim() || !generalEmail.trim()) return
    if (generalMetric === 'POSITION_PRICE' && !generalCoin.trim()) return

    setCreatingGeneral(true)
    setMessage(null)

    try {
      const thresholdVal = parseFloat(generalThreshold)
      if (isNaN(thresholdVal)) {
        throw new Error('El valor del umbral debe ser numérico.')
      }

      const isPriceAlert = generalMetric === 'POSITION_PRICE'

      await createAlert({
        scope: isPriceAlert ? 'POSITION' : 'ACCOUNT',
        metric: generalMetric,
        type: generalOperator,
        coin: isPriceAlert ? generalCoin.toUpperCase().trim() : undefined,
        threshold: thresholdVal,
        email: generalEmail.trim()
      })

      setMessage({ 
        text: isPriceAlert 
          ? `¡Alerta de precio para ${generalCoin.toUpperCase().trim()} creada con éxito!` 
          : '¡Alerta general de cuenta creada con éxito!', 
        isError: false 
      })
      setGeneralThreshold('')
      setGeneralCoin('')
      refetchAlerts()
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      console.error(err)
      setMessage({ 
        text: err.response?.data?.error ?? err.message ?? 'Error al crear la alerta.', 
        isError: true 
      })
    } finally {
      setCreatingGeneral(false)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id)
      refetchAlerts()
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  const handleToggleAlert = async (id: string) => {
    try {
      await toggleAlert(id)
      refetchAlerts()
    } catch (err) {
      console.error('Error toggling alert:', err)
    }
  }

  const formatAlertCondition = (alert: any) => {
    const opSym = alert.type === 'ABOVE' ? '>' : '<'
    const limit = parseFloat(alert.threshold).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 4 })

    switch (alert.metric) {
      case 'POSITION_PNL_USD':
        return `${alert.coin}-PERP PnL ${opSym} ${limit} USDC`
      case 'POSITION_PNL_PERCENT':
        return `${alert.coin}-PERP PnL ${opSym} ${limit}%`
      case 'POSITION_PRICE':
        return `Precio de ${alert.coin} ${opSym} $${limit}`
      case 'ACCOUNT_EQUITY_USD':
        return `Patrimonio total ${opSym} ${limit} USDC`
      case 'ACCOUNT_PNL_USD':
        return `PnL abierto total ${opSym} ${limit} USDC`
      case 'MARGIN_USAGE_PERCENT':
        return `Uso de margen ${opSym} ${limit}%`
      default:
        return `${alert.coin || 'General'} ${opSym} ${limit}`
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto text-zinc-200">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white">Sistema de Alertas</h1>
        </div>
        <button 
          onClick={handleRefreshAll}
          disabled={isLoadingAlerts || isFetchingAlerts}
          className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950/40 hover:bg-white hover:text-black hover:border-white transition-all text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded cursor-pointer self-start sm:self-center disabled:opacity-30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAlerts ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* notificaciones emergentes de confirmacion */}
      {message && (
        <div className={`p-4 font-mono text-[10px] uppercase tracking-widest flex items-start gap-2.5 border rounded ${
          message.isError 
            ? 'border-rose-950 bg-rose-950/15 text-rose-500' 
            : 'border-emerald-950 bg-emerald-950/15 text-emerald-400'
        }`}>
          {message.isError ? <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" /> : <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ALERTAS POR POSICIÓN */}
      <section className="border border-zinc-500 p-6 bg-zinc-950/10 rounded flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white">Alertas por Posición</h2>
        </div>

        {!isWalletConnected ? (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest border border-dashed border-zinc-800 p-6 text-center font-mono rounded">
           Conecta tu wallet!
          </div>
        ) : isLoadingPortfolio ? (
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse font-mono py-4">
            Recuperando datos de Hyperliquid L1...
          </p>
        ) : positions.length === 0 ? (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest border border-zinc-900 p-6 text-center font-mono rounded">
            Sin posiciones abiertas en este momento
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Tabla de posiciones abiertas */}
            <div className="overflow-x-auto rounded border border-zinc-900/60">
              <table className="w-full text-left font-mono text-[10px] text-white uppercase border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-white text-[10px] tracking-widest bg-zinc-950/20">
                    <th className="py-2.5 px-3">Activo</th>
                    <th className="py-2.5 px-3">Dirección</th>
                    <th className="py-2.5 px-3 text-right">Tamaño</th>
                    <th className="py-2.5 px-3 text-right">Entrada</th>
                    <th className="py-2.5 px-3 text-right">PnL Abierto</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {positions.map((pos: any, idx: number) => {
                    const isLong = pos.direction === 'LONG'
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                        <td className="text-[12px] py-3 px-3 text-white font-bold">{pos.coin}-PERP</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded-[2px] text-[12px] font-bold ${
                            isLong
                              ? ' text-white'
                              : 'text-white'
                          }`}>
                            {pos.direction}
                          </span>
                        </td>
                        <td className="text-[12px] py-3 px-3 text-right text-zinc-300 font-bold">{pos.size}</td>
                        <td className="text-[12px] py-3 px-3 text-right">${pos.entryPrice}</td>
                        <td className={`text-[12px] py-3 px-3 text-right font-bold ${
                          pos.unrealizedPnl.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {pos.unrealizedPnl}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedPosition(pos)
                              setPosThreshold('')
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 border border-zinc-700 bg-zinc-950 hover:bg-white hover:text-black hover:border-white transition-all rounded cursor-pointer"
                          >
                            Crear alerta
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal/Card de configuración para la posición seleccionada */}
            {selectedPosition && (
              <div className="border border-zinc-500 bg-zinc-950 p-5 rounded flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <span className="text-[10px] text-white uppercase tracking-widest font-mono block">
                      CONFIGURACIÓN DE ALERTA DE RIESGO
                    </span>
                    <div className="text-[11px] font-mono text-white font-bold mt-0.5">
                      {selectedPosition.coin}-PERP · {selectedPosition.direction} {selectedPosition.size} SOL @ ${selectedPosition.entryPrice}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPosition(null)}
                    className="text-[10px] text-white hover:text-white uppercase tracking-widest font-mono font-bold"
                  >
                    [Cancelar]
                  </button>
                </div>

                <form onSubmit={handleCreatePosAlert} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-mono">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white uppercase tracking-widest font-bold text-[10px]">
                      Métrica a Vigilar
                    </label>
                    <select
                      value={posMetric}
                      onChange={(e) => setPosMetric(e.target.value as any)}
                      className="bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 rounded text-[10px] uppercase tracking-widest text-white"
                    >
                      <option value="POSITION_PNL_USD">PnL no realizado (USDC)</option>
                      <option value="POSITION_PNL_PERCENT">PnL no realizado (%)</option>
                      <option value="POSITION_PRICE">Precio del activo ($)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white uppercase tracking-widest font-bold text-[10px]">
                      Precio / Umbral de disparo
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={posThreshold}
                      onChange={(e) => setPosThreshold(e.target.value)}
                      placeholder={posMetric === 'POSITION_PNL_USD' ? 'Ej: -10.00' : posMetric === 'POSITION_PNL_PERCENT' ? 'ej -15.00' : 'ej: 80.00'}
                      className="bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 rounded text-[10px] text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white uppercase tracking-widest font-bold text-[10px]">
                      Email Notificación
                    </label>
                    <input
                      type="email"
                      required
                      value={posEmail}
                      onChange={(e) => setPosEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 rounded text-[10px] text-white"
                    />
                  </div>

                  <div className="md:col-span-3 mt-2">
                    <button
                      type="submit"
                      disabled={creatingPosAlert}
                      className="w-full bg-white text-black text-[10px] font-bold uppercase tracking-widest py-3 rounded hover:bg-zinc-200 disabled:opacity-20 transition-all cursor-pointer"
                    >
                      {creatingPosAlert ? 'Procesando metrica...' : 'Guardar alerta para posición'}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        )}
      </section>

      {/*ALERTAS GENERALES Y FORMULARIO DE CUENTA*/}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario de nuevas alertas generales */}
        <section className="lg:col-span-5 border border-zinc-500 p-6 bg-zinc-950/10 rounded flex flex-col gap-4 self-start">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Alertas Generales</h2>
          </div>
          <span className="text-[10px] text-white uppercase tracking-widest font-mono block -mt-1.5">
            Configura avisos globales
          </span>

          <form onSubmit={handleCreateGeneralAlert} className="flex flex-col gap-4 mt-2">
            
            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <label className="text-white uppercase tracking-widest font-bold"> Metrica </label>
              <select
                value={generalMetric}
                onChange={(e) => setGeneralMetric(e.target.value as any)}
                className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 text-white uppercase tracking-widest rounded text-[10px]"
              >
                <option value="ACCOUNT_EQUITY_USD">Cuenta Total (Spot+Perps)</option>
                <option value="ACCOUNT_PNL_USD">PnL Abierto Total (USDC)</option>
                <option value="MARGIN_USAGE_PERCENT">Porcentaje de Uso de Margen</option>
                <option value="POSITION_PRICE">Precio de un Activo / Moneda</option>
              </select>
            </div>

            {generalMetric === 'POSITION_PRICE' && (
              <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                <label className="text-white uppercase tracking-widest font-bold">Moneda</label>
                <input
                  type="text"
                  required
                  value={generalCoin}
                  onChange={(e) => setGeneralCoin(e.target.value)}
                  placeholder="BTC, ETH, SOL, WIF"
                  className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 text-white uppercase tracking-widest rounded text-[10px]"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <label className="text-white uppercase tracking-widest font-bold">Condición</label>
              <select
                value={generalOperator}
                onChange={(e) => setGeneralOperator(e.target.value as any)}
                className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 text-white uppercase tracking-widest rounded text-[10px]"
              >
                <option value="BELOW">BAJA DE (BELOW)</option>
                <option value="ABOVE">SUPERA A (ABOVE)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <label className="text-white uppercase tracking-widest font-bold">Umbral</label>
              <input
                type="number"
                step="any"
                required
                value={generalThreshold}
                onChange={(e) => setGeneralThreshold(e.target.value)}
                placeholder={generalMetric === 'MARGIN_USAGE_PERCENT' ? ' 60 (%)' : '10.00 (USDC/USD)'}
                className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 text-white uppercase tracking-widest rounded text-[10px]"
              />
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              <label className="text-white uppercase tracking-widest font-bold">Email de destino</label>
              <input
                type="email"
                required
                value={generalEmail}
                onChange={(e) => setGeneralEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-2.5 text-white uppercase tracking-widest rounded text-[10px]"
              />
            </div>

            <button
              type="submit"
              disabled={creatingGeneral}
              className="w-full bg-white text-black text-[10px] font-bold uppercase tracking-widest py-3 mt-2 hover:bg-zinc-200 disabled:opacity-20 transition-all rounded cursor-pointer"
            >
              {creatingGeneral ? 'Registrando metrica...' : generalMetric === 'POSITION_PRICE' ? 'Crear Alerta de Precio' : 'Crear Alerta de Cuenta'}
            </button>
          </form>
        </section>

        {/* Listado de todas las alertas guardadas */}
        <section className="lg:col-span-7 border border-zinc-500 p-6 bg-zinc-950/10 rounded flex flex-col gap-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Alertas Guardadas</h2>
          </div>

          <div className="overflow-x-auto rounded border border-zinc-900/60">
            {isLoadingAlerts ? (
              <div className="text-center py-12 text-[10px] text-zinc-500 uppercase tracking-widest font-mono animate-pulse">
                Cargando...
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 text-[10px] text-zinc-500 uppercase tracking-widest font-mono flex flex-col items-center justify-center gap-3">
                <Bell className="w-8 h-8 text-zinc-700 animate-pulse" />
                <span>No tienes alertas configuradas</span>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-[10px] text-white uppercase border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-white text-[10px] tracking-widest bg-zinc-950/20">
                    <th className="py-2.5 px-3">Ámbito</th>
                    <th className="py-2.5 px-3">Condición</th>
                    <th className="py-2.5 px-3">Destinatario</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">Notificado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {alerts.map((alert: any) => {
                    const isAccount = alert.scope === 'ACCOUNT'
                    return (
                      <tr key={alert.id} className={`hover:bg-zinc-900/10 transition-colors ${!alert.active ? 'opacity-40' : ''}`}>
                        <td className="py-3 px-3 font-bold">
                          <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                            isAccount
                              ? 'text-blue-400'
                              : 'text-yellow-400'
                          }`}>
                            {isAccount ? 'Cuenta' : 'Posición'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white max-w-[200px] truncate" title={formatAlertCondition(alert)}>
                          {formatAlertCondition(alert)}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 lowercase">{alert.email}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleAlert(alert.id)}
                            className="inline-flex items-center justify-center p-1 hover:text-white transition-all cursor-pointer"
                            title={alert.active ? 'Pausar Alerta' : 'Reactivar Alerta'}
                          >
                            {alert.active ? (
                              <ToggleRight className="w-5 h-5 " />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[10px] text-white">
                          {alert.emailNotified ? (
                            <span className="text-zinc-500">SÍ</span>
                          ) : (
                            <span className="text-yellow-500">PENDIENTE</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="text-zinc-600 hover:text-red-500 p-1.5 hover:bg-zinc-950/60 rounded border border-transparent hover:border-zinc-900 transition-all cursor-pointer inline-flex items-center"
                            title="Eliminar Alerta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>

    </div>
  )
}
