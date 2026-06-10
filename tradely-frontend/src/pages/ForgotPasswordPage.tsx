import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await forgotPassword(email)
      setSuccessMsg('¡Enlace de recuperación enviado!')
      setEmail('')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al procesar la solicitud. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 select-none font-sans">
      <div className="w-full max-w-sm">

        <div className="mb-12 border-b border-white pb-6">
          <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">Tradely</h1>
          <p className="text-[10px] text-white uppercase tracking-widest mt-2 font-mono"> Recuperación de Contraseña</p>
        </div>

        {successMsg ? (
          <div className="space-y-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-white leading-relaxed rounded">
              {successMsg}
            </div>
          
            <Link 
              to="/login"
              className="w-full block text-center bg-white text-black text-[10px] font-bold py-3 hover:bg-zinc-200 transition-all uppercase tracking-widest rounded"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed font-mono mb-4">
              Introduce tu correo electrónico para enviar enlace de recuperacion de contraseña
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="EMAIL REGISTRADO"
              className="w-full bg-black border border-zinc-800 text-white text-[10px] px-3 py-3 placeholder-zinc-800 focus:outline-none focus:border-white transition-all uppercase tracking-widest font-mono rounded"
            />

            {errorMsg && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest pt-1">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black text-[10px] font-bold py-3 hover:bg-zinc-200 disabled:opacity-20 transition-all uppercase tracking-widest rounded"
            >
              {loading ? 'Procesando...' : 'Solicitar Enlace'}
            </button>

            <div className="flex justify-between text-[10px] mt-8 uppercase tracking-widest font-mono pt-4 border-t border-zinc-900">
              <Link to="/login" className="text-zinc-500 hover:text-white transition-all">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="text-white hover:underline">
                Registrarse
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
