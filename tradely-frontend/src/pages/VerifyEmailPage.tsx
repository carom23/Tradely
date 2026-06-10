import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../lib/api'
import { ShieldCheck, ShieldAlert, Loader } from 'lucide-react'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Token de verificación no proporcionado.')
      return
    }

    const doVerify = async () => {
      try {
        await verifyEmail(token)
        setStatus('success')
      } catch (err: any) {
        console.error(err)
        setStatus('error')
        setErrorMessage(err.response?.data?.error ?? err.response?.data?.message ?? 'El enlace de verificación no es válido o ha expirado.')
      }
    }

    doVerify()
  }, [token])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 text-zinc-200">
      <div className="w-full max-w-md border border-zinc-900 bg-zinc-950/20 p-8 rounded font-mono">
        <div className="mb-10 border-b border-zinc-900 pb-5">
          <h1 className="text-white text-xl font-bold tracking-[0.2em] uppercase">Tradely</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">Verificación de Cuenta</p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader className="w-8 h-8 animate-spin text-white" />
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Verificando credenciales de correo...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center gap-3 border border-emerald-950 bg-emerald-950/15 p-4 rounded text-emerald-400">
              <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
              <div className="text-[10px] uppercase tracking-widest leading-relaxed">
                ¡Correo verificado con éxito!
              </div>
            </div>
            <Link
              to="/login"
              className="w-full bg-white text-black text-[10px] font-bold py-3 text-center hover:bg-zinc-200 transition-all uppercase tracking-widest"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center gap-3 border border-rose-950 bg-rose-950/15 p-4 rounded text-rose-500">
              <ShieldAlert className="w-6 h-6 shrink-0 text-rose-500" />
              <div className="text-[10px] uppercase tracking-widest leading-relaxed">
                {errorMessage}
              </div>
            </div>
            <Link
              to="/register"
              className="w-full bg-zinc-900 border border-zinc-800 text-white text-[10px] font-bold py-3 text-center hover:bg-zinc-800 transition-all uppercase tracking-widest"
            >
              Volver a registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
