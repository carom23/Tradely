import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logoBlanco from '../assets/logo_blanco.png'
import {  LogOut, User, X, Sun, Moon } from 'lucide-react'
import { updateUserProfile } from '../lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { getUser, logout } = useAuth()
  const user = getUser()
  const location = useLocation()

  // Estado para alternar el Tema Claro/Oscuro
  const [isLightTheme, setIsLightTheme] = useState(() => {
    return localStorage.getItem('theme') === 'light'
  })

  useEffect(() => {
    if (isLightTheme) {
      document.documentElement.classList.add('light-theme')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light-theme')
      localStorage.setItem('theme', 'dark')
    }
  }, [isLightTheme])

  // Estados y funciones para Configuración de Perfil
  const [showSettings, setShowSettings] = useState(false)
  const [emailInput, setEmailInput] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('Las contraseñas no coinciden.')
      setSavingProfile(false)
      return
    }

    try {
      await updateUserProfile(
        emailInput !== user?.email ? emailInput : undefined,
        newPassword || undefined
      )

      const updatedUser = {
        ...user,
        email: emailInput
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setProfileSuccess('¡Perfil actualizado con éxito!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setProfileSuccess(null), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.error ?? 'Error al actualizar el perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard'},
    { path: '/cartera', label: 'Cartera'},
    { path: '/oracle', label: 'Oráculo'},
    { path: '/alertas', label: 'Alertas'},
  ]

  return (
    <div className="min-h-screen bg-black text-white flex select-none font-sans">
      
      {/* MENÚ LATERAL */}
      <aside className="fixed top-0 left-0 h-screen w-64 border-r border-zinc-800 bg-black flex flex-col justify-between z-30">
        
        {/* Cabecera del Menú */}
        <div>
          <div className="flex items-center gap-4 px-6 py-6 border-b border-zinc-900">
            <img src={logoBlanco} alt="Tradely Logo" className="w-9 h-9 object-contain" />
            <div>
              <span className="text-lg font-bold tracking-[0.2em] text-white uppercase block">Tradely</span>
            </div>
          </div>

          {/* Opciones Menu */}
          <nav className="py-8 px-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded border ${
                    isActive
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-zinc-900/50 hover:border-zinc-800'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Pie del Menú (Usuario y Salir) */}
        <div className="p-6 border-t border-zinc-900 flex flex-col gap-4 bg-zinc-950/20">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 w-full text-left p-2 rounded border border-transparent hover:border-zinc-800 hover:bg-zinc-900/40 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-900 shrink-0 group-hover:border-white transition-all">
              <User className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-all" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-white block uppercase tracking-widest font-mono">AUTENTICADO</span>
              <span className="text-xs font-semibold text-white block truncate group-hover:underline">{user?.email || 'user@tradely.app'}</span>
            </div>
          </button>

          <button
            onClick={logout}
            className="w-full py-3 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>

      </aside>

      {/*CONTENIDO PRINCIPAL */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        
        <header className="border-b border-zinc-900 h-16 px-8 flex items-center justify-between bg-zinc-950/20 backdrop-blur-sm sticky top-0 z-20">

          <div className="flex items-center gap-4">
            {/*Tema Claro/Oscuro */}
            <button
              onClick={() => setIsLightTheme(prev => !prev)}
              className="flex items-center justify-center w-8 h-8 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-white transition-all cursor-pointer"
              title={isLightTheme ? "Cambiar a Tema Oscuro" : "Cambiar a Tema Claro"}
            >
              {isLightTheme ? (
                <Moon className="w-4 h-4 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
        </header>

        {/*Contenido */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* CONFIGURACIÓN DE PERFIL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="border border-zinc-800 bg-zinc-950 p-8 rounded max-w-sm w-full relative flex flex-col gap-6 shadow-2xl font-sans select-none">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white">Configuración de Perfil</span>
              </div>
              <button 
                onClick={() => {
                  setShowSettings(false)
                  setProfileError(null)
                  setProfileSuccess(null)
                }}
                className="text-zinc-500 hover:text-white p-1 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 font-mono text-[10px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 uppercase tracking-widest font-bold">Correo Electrónico:</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  placeholder="EMAIL"
                  className="w-full bg-black border border-zinc-900 p-2.5 text-white focus:outline-none focus:border-white transition-all uppercase rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-4">
                <label className="text-zinc-500 uppercase tracking-widest font-bold">Nueva Contraseña:</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="nueva contraseña"
                  className="w-full bg-black border border-zinc-900 p-2.5 text-white focus:outline-none focus:border-white transition-all uppercase rounded"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 uppercase tracking-widest font-bold">Confirmar Contraseña:</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="CONFIRMAR CONTRASEÑA"
                  className="w-full bg-black border border-zinc-900 p-2.5 text-white focus:outline-none focus:border-white transition-all uppercase rounded"
                />
              </div>

              {profileError && (
                <span className="text-white uppercase font-bold text-[10px] tracking-widest leading-relaxed pt-1">{profileError}</span>
              )}

              {profileSuccess && (
                <span className="text-white uppercase font-bold text-[10px] tracking-widest leading-relaxed pt-1">{profileSuccess}</span>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-white text-black text-[10px] font-bold uppercase tracking-widest py-3 mt-2 hover:bg-zinc-200 disabled:opacity-20 transition-all rounded cursor-pointer"
              >
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
