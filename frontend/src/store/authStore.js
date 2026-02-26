import { create } from 'zustand'
import api from '../api/client'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data))
      set({ user: data, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Login failed', loading: false })
      return false
    }
  },

  register: async (email, password, full_name) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { email, password, full_name })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data))
      set({ user: data, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ error: e.response?.data?.detail || 'Registration failed', loading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))
