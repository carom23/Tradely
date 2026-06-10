import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-12 border-b border-white pb-6">
          <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">Tradely</h1>
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-2">Inicio de sesion</p>
        </div>

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
            placeholder="contraseña"
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
            {loading ? 'Autorizando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-8 text-zinc-600 text-[10px] uppercase tracking-widest font-mono">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-white hover:underline">
              Regístrate!
            </Link>
          </p>
          <Link to="/forgot-password" className="text-zinc-500 hover:text-white transition-all self-start">
            ¿Has olvidado tu contraseña?
          </Link>
        </div>

      </div>
    </div>
  )
}