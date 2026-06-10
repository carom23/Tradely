import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, 
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // solicita nuevo token de acceso
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newAccessToken = res.data.accessToken
        
        localStorage.setItem('accessToken', newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

// autenticacion
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const register = (email: string, password: string) =>
  api.post('/auth/register', { email, password })



export const updateUserWallets = (hlWalletAddress: string) =>
  api.post('/users/wallets', { hlWalletAddress })

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword })

export const verifyEmail = (token: string) =>
  api.get(`/auth/verify-email?token=${token}`)

export const updateUserProfile = (email?: string, password?: string) =>
  api.patch('/users/profile', { email, password })



export const getUserBalances = () =>
  api.get('/users/balances')

export const getPortfolio = (address: string) =>
  api.get(`/v1/portfolio/${address}`)

export const getPortfolioHistory = (address: string, period: string) =>
  api.get(`/v1/portfolio/history?address=${address}&period=${period}`)

export const analyzeCoinWithOracle = (coin: string, walletAddress: string) =>
  api.post('/v1/oracle/analyze', { coin, walletAddress })

export const getAlerts = () =>
  api.get('/v1/alerts')

export const createAlert = (payload: {
  scope: string
  metric: string
  type: string
  coin?: string
  direction?: string
  threshold: number
  email: string
}) =>
  api.post('/v1/alerts', payload)

export const deleteAlert = (id: string) =>
  api.delete(`/v1/alerts/${id}`)

export const toggleAlert = (id: string) =>
  api.patch(`/v1/alerts/${id}/toggle`)

export const getPortfolioAnalysis = (wallet: string) =>
  api.post<{ analysis: string }>(`/v1/oracle/portfolio-summary?wallet=${wallet}`)

export default api