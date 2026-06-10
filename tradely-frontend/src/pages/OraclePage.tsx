import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send, AlertTriangle, RefreshCw } from 'lucide-react'
import { getUserBalances, analyzeCoinWithOracle, getPortfolioAnalysis } from '../lib/api'

function SimpleMarkdownRenderer({ text }: { text: string }) {
  if (!text) return null

  const lines = text.split('\n')
  return (
    <div className="flex flex-col gap-4 text-xs font-mono leading-relaxed tracking-wider text-zinc-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace('###', '').trim()
          return (
            <h3 key={idx} className="text-sm font-bold text-white border-b border-zinc-900 pb-2 mt-6 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-white block"></span>
              {headerText}
            </h3>
          )
        }
        
        // Headers ##
        if (trimmed.startsWith('##')) {
          const headerText = trimmed.replace('##', '').trim()
          return (
            <h2 key={idx} className="text-base font-bold text-white border-b border-zinc-800 pb-3 mt-8 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2.5 h-3.5 bg-white block"></span>
              {headerText}
            </h2>
          )
        }

        // List items -
        if (trimmed.startsWith('-')) {
          let content = trimmed.substring(1).trim()
          
          // Parse bold text **key**: value
          const boldMatch = content.match(/^\*\*(.*?)\*\*(.*)/)
          if (boldMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-4">
                <span className="text-zinc-600 select-none">•</span>
                <span>
                  <strong className="text-white font-bold tracking-widest uppercase mr-1">{boldMatch[1]}</strong>
                  <span className="text-zinc-300">{boldMatch[2]}</span>
                </span>
              </div>
            )
          }
          
          return (
            <div key={idx} className="flex items-start gap-2 pl-4">
              <span className="text-zinc-600 select-none">•</span>
              <span>{content}</span>
            </div>
          )
        }

        if (trimmed.length === 0) {
          return <div key={idx} className="h-2"></div>
        }

        const parts = []
        let lastIdx = 0
        const boldRegex = /\*\*(.*?)\*\*/g
        let match
        
        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIdx) {
            parts.push(line.substring(lastIdx, match.index))
          }
          parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>)
          lastIdx = boldRegex.lastIndex
        }
        
        if (lastIdx < line.length) {
          parts.push(line.substring(lastIdx))
        }

        return (
          <p key={idx} className="text-zinc-400 pl-1 leading-relaxed">
            {parts.length > 0 ? parts : line}
          </p>
        )
      })}
    </div>
  )
}

export default function OraclePage() {
  const [coin, setCoin] = useState('ETH')
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null)

  const [portfolioAnalysisResult, setPortfolioAnalysisResult] = useState<string | null>(null)
  const [loadingPortfolioAnalysis, setLoadingPortfolioAnalysis] = useState(false)
  const [errorPortfolioAnalysis, setErrorPortfolioAnalysis] = useState<string | null>(null)

  const handleAnalyzePortfolio = async () => {
    if (!isWalletConnected) return

    setLoadingPortfolioAnalysis(true)
    setErrorPortfolioAnalysis(null)
    setPortfolioAnalysisResult(null)

    try {
      const res = await getPortfolioAnalysis(masterWallet)
      setPortfolioAnalysisResult(res.data.analysis)
    } catch (err: any) {
      console.error(err)
      setErrorPortfolioAnalysis(err.response?.data?.error ?? 'No se pudo obtener el análisis del portfolio. ')
    } finally {
      setLoadingPortfolioAnalysis(false)
    }
  }


  const { data: balanceData } = useQuery({
    queryKey: ['userBalances'],
    queryFn: async () => {
      const res = await getUserBalances()
      return res.data
    }
  })

  const masterWallet = balanceData?.masterWallet ?? 'NONE'
  const isWalletConnected = masterWallet !== 'NONE' && masterWallet.trim().length > 0

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected) return
    if (!coin.trim()) return

    setLoadingAnalysis(true)
    setErrorAnalysis(null)
    setAnalysisResult(null)

    try {
      const res = await analyzeCoinWithOracle(coin.trim().toUpperCase(), masterWallet)
      setAnalysisResult(res.data)
    } catch (err: any) {
      console.error(err)
      setErrorAnalysis(err.response?.data?.error ?? 'No se pudo generar el análisis del Oráculo')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto font-sans text-zinc-200">
      
      {/* Cabecera */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white">Oráculo</h1>
      </div>

      {!isWalletConnected ? (
        /* Tarjeta de advertencia si no hay wallet */
        <div className="border border-zinc-800 p-8 bg-zinc-950/20 rounded flex flex-col items-center justify-center text-center gap-4 py-16">
          <AlertTriangle className="w-12 h-12 text-zinc-700 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">MetaMask No Conectada</h2>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Panel de Inputs (Grid de 2 Bloques Cohesivos) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* BLOQUE 1: Consola de Moneda */}
            <div className="md:col-span-7 border border-zinc-800 p-6 bg-zinc-950/40 rounded flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">Análisis de Moneda</h3>
                </div>
                
                <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white uppercase tracking-widest font-mono font-bold">Activo a analizar:</label>
                    <input
                      type="text"
                      value={coin}
                      onChange={(e) => setCoin(e.target.value.toUpperCase())}
                      placeholder=" BTC, ETH, SOL"
                      required
                      className="w-full bg-black border border-zinc-900 focus:border-white focus:outline-none p-3 px-4 text-white font-mono text-xs uppercase tracking-widest rounded"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingAnalysis}
                    className="w-full bg-white text-black text-xs font-bold uppercase tracking-widest py-3 hover:bg-zinc-200 disabled:opacity-20 flex items-center justify-center gap-2 transition-all cursor-pointer rounded"
                  >
                    {loadingAnalysis ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analizando activo...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Preguntar sobre {coin || 'Token'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Consola de Portfolio */}
            <div className="md:col-span-5 border border-zinc-800 p-6 bg-zinc-950/40 rounded flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white">Análisis Global de Portfolio</h3>
                </div>

              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAnalyzePortfolio}
                  disabled={loadingPortfolioAnalysis}
                  className="w-full bg-zinc-950 text-white border border-zinc-700 hover:bg-white hover:text-black hover:border-white text-xs font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-all cursor-pointer rounded"
                >
                  {loadingPortfolioAnalysis ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando informe...</span>
                    </>
                  ) : (
                    <>
                      <span>Analizar mi Portfolio</span>
                    </>
                  )}
                </button>

              </div>
            </div>

          </div>

          {/* Consola de Resultados - Análisis de Moneda */}
          {(loadingAnalysis || analysisResult || errorAnalysis) && (
            <div className="border border-zinc-800 bg-zinc-950/20 rounded p-6 font-mono relative overflow-hidden flex flex-col gap-4 min-h-[300px]">
              
              {/* Barra superior de la consola */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 select-none">
cker 
                <div className="text-[14px] text-white uppercase tracking-widest">
                  STATUS: {loadingAnalysis ? 'RUNNING' : errorAnalysis ? 'ERROR' : 'READY'}
                </div>
              </div>

              {/* Pantalla del terminal */}
              <div className="flex-1">
                {loadingAnalysis && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center select-none">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-white uppercase tracking-widest font-mono font-bold animate-pulse">Solicitando análisis a Gemini...</span>
                    </div>
                  </div>
                )}

                {errorAnalysis && (
                  <div className="text-red-500 text-xs font-mono uppercase p-4 border border-red-900/30 bg-red-950/10 rounded flex flex-col gap-2">
                    <span className="font-bold">ERROR DE SISTEMA:</span>
                    <span>{errorAnalysis}</span>
                  </div>
                )}

                {analysisResult && (
                  <div className="animate-fade-in pr-2 select-text">
                    <SimpleMarkdownRenderer text={analysisResult} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consola de Resultados - Análisis de Portfolio */}
          {(loadingPortfolioAnalysis || portfolioAnalysisResult || errorPortfolioAnalysis) && (
            <div className="border border-zinc-800 bg-zinc-950/20 rounded p-6 font-mono relative overflow-hidden flex flex-col gap-4 min-h-[300px]">
              
              {/* Barra superior de la consola */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span className="text-[10px] text-white uppercase tracking-widest font-bold ml-2">INFORME GLOBAL DE CARTERA</span>
                </div>
                <div className="text-[10px] text-white uppercase tracking-widest">
                  STATUS: {loadingPortfolioAnalysis ? 'RUNNING' : errorPortfolioAnalysis ? 'ERROR' : 'READY'}
                </div>
              </div>

              {/* Pantalla del terminal */}
              <div className="flex-1">
                {loadingPortfolioAnalysis && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center select-none">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-white uppercase tracking-widest font-mono font-bold animate-pulse">Solicitando diagnóstico a Gemini...</span>
                    </div>
                  </div>
                )}

                {errorPortfolioAnalysis && (
                  <div className="text-red-500 text-xs font-mono uppercase p-4 border border-red-900/30 bg-red-950/10 rounded flex flex-col gap-2">
                    <span className="font-bold">ERROR DE SISTEMA:</span>
                    <span>{errorPortfolioAnalysis}</span>
                  </div>
                )}

                {portfolioAnalysisResult && (
                  <div className="animate-fade-in pr-2 select-text">
                    <SimpleMarkdownRenderer text={portfolioAnalysisResult} />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
