import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi } from '../lib/api'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await loginApi(email, password)
      const { accessToken, id, email: userEmail, agentWalletAddress, hlWalletAddress, hlAgentAddress } = res.data
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('user', JSON.stringify({
        id,
        email: userEmail,
        agentWalletAddress,
        hlWalletAddress,
        hlAgentAddress
      }))
      
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isAuthenticated = () => !!localStorage.getItem('accessToken')
  
  const getUser = () => {
    const userJson = localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  }

  return { login, logout, loading, error, isAuthenticated, getUser }
}