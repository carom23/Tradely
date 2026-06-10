import { useState } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../lib/api'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register(email, password)
      setIsRegistered(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-12 border-b border-white pb-6">
          <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">Tradely</h1>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-2">Nueva Cuenta</p>
        </div>

        {isRegistered ? (
          <div className="space-y-6 font-mono">
            <div className=" text-white">
              <p className="text-[12px] uppercase tracking-widest leading-relaxed">
                Enlace de activación enviado a:  <strong className="text-white font-bold">{email}</strong>. 
                Por favor, verifica tu correo electrónico
              </p>
            </div>
            
            <Link
              to="/login"
              className="w-full block bg-white text-black text-[10px] font-bold py-3 text-center hover:bg-zinc-200 transition-all uppercase tracking-widest"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="EMAIL"
                className="w-full bg-black border border-zinc-800 text-white text-[10px] px-3 py-3 placeholder-zinc-800 focus:outline-none focus:border-white transition-all uppercase tracking-widest"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="CONTRASEÑA"
                className="w-full bg-black border border-zinc-800 text-white text-[10px] px-3 py-3 placeholder-zinc-800 focus:outline-none focus:border-white transition-all uppercase tracking-widest"
              />

              {error && (
                <p className="text-red-400 text-xs pt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black text-[10px] font-bold py-3 hover:bg-zinc-200 disabled:opacity-20 transition-all uppercase tracking-widest"
              >
                {loading ? 'Creando...' : 'Crear Cuenta'}
              </button>
            </form>

            <p className="text-zinc-600 text-[10px] mt-8 uppercase tracking-widest">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-white hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </>
        )}

      </div>
    </div>
  )
}