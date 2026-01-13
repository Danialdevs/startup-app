import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isAdmin?: boolean
}

interface Startup {
  id: string
  name: string
  description?: string
  stage: number
  createdAt: string
}

interface AppState {
  user: User | null
  currentStartup: Startup | null
  startups: Startup[]
  isLoading: boolean

  setUser: (user: User | null) => void
  setCurrentStartup: (startup: Startup | null) => void
  setStartups: (startups: Startup[]) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentStartup: null,
  startups: [],
  isLoading: false,

  setUser: (user) => set({ user }),
  setCurrentStartup: (startup) => set({ currentStartup: startup }),
  setStartups: (startups) => set({ startups }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, currentStartup: null, startups: [] })
}))


