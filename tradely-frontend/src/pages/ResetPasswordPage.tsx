import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../lib/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const t = searchParams.get('token')
    if (t) {
      setToken(t)
    } else {
      setErrorMsg('Token de recuperación no detectado o inválido. Solicita un nuevo enlace.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await resetPassword(token, password)
      setSuccessMsg('¡Contraseña restablecida con éxito! Serás redirigido al inicio de sesión.')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error ?? 'Error al actualizar la contraseña. El token puede haber expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 select-none font-sans">
      <div className="w-full max-w-sm">

        <div className="mb-12 border-b border-white pb-6">
          <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">Tradely</h1>
          <p className="text-[10px] text-white uppercase tracking-widest mt-2 font-mono">Restablecer Contraseña</p>
        </div>

        {successMsg ? (
          <div className="border border-zinc-800 p-6 bg-zinc-950/20 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 leading-relaxed rounded">
            <span className="text-white block font-bold mb-3">OPERACIÓN COMPLETADA:</span>
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={!token}
              placeholder="NUEVA CONTRASEÑA (MIN. 6 CARACT.)"
              className="w-full bg-black border border-zinc-800 text-white text-[10px] px-3 py-3 placeholder-zinc-800 focus:outline-none focus:border-white transition-all uppercase tracking-widest font-mono rounded disabled:opacity-20"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
              placeholder="CONFIRMAR CONTRASEÑA"
              className="w-full bg-black border border-zinc-800 text-white text-[10px] px-3 py-3 placeholder-zinc-800 focus:outline-none focus:border-white transition-all uppercase tracking-widest font-mono rounded disabled:opacity-20"
            />

            {errorMsg && (
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest pt-1 leading-relaxed">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-white text-black text-[10px] font-bold py-3 hover:bg-zinc-200 disabled:opacity-20 transition-all uppercase tracking-widest rounded"
            >
              {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
            </button>

            <div className="text-center text-[10px] mt-8 uppercase tracking-widest font-mono pt-4 border-t border-zinc-900">
              <Link to="/login" className="text-zinc-500 hover:text-white transition-all">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
