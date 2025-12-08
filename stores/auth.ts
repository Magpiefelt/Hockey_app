import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || ''
  },

  actions: {
    /**
     * Set user data and authentication state
     */
    setUser(user: User | null) {
      this.user = user
      this.isAuthenticated = !!user
      
      // Persist to localStorage (client-side only)
      if (process.client) {
        if (user) {
          localStorage.setItem('auth_user', JSON.stringify(user))
        } else {
          localStorage.removeItem('auth_user')
        }
      }
    },

    /**
     * Login with email and password using TRPC
     */
    async login(email: string, password: string) {
      this.isLoading = true
      
      try {
        // Check if we're in development mode (no backend available)
        const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_API_URL
        
        if (isDevelopment) {
          // Simulate login in development with demo credentials
          console.log('Development mode: Simulating login', { email })
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check demo credentials
          if (email === 'admin@elitesportsdj.com' && password === 'admin123') {
            const demoUser = {
              id: 'demo-admin-id',
              email: 'admin@elitesportsdj.com',
              name: 'Demo Admin',
              role: 'admin'
            }
            this.setUser(demoUser)
            return {
              success: true,
              user: demoUser
            }
          } else if (email === 'user@example.com' && password === 'user123') {
            const demoUser = {
              id: 'demo-user-id',
              email: 'user@example.com',
              name: 'Demo User',
              role: 'user'
            }
            this.setUser(demoUser)
            return {
              success: true,
              user: demoUser
            }
          } else {
            return {
              success: false,
              error: 'Invalid credentials. Try admin@elitesportsdj.com / admin123 or user@example.com / user123'
            }
          }
        }
        
        // Production: Use tRPC client
        const { $client } = useNuxtApp()
        
        // Call TRPC auth.login mutation
        const result = await $client.auth.login.mutate({
          email,
          password
        })
        
        // Set user data
        this.setUser(result.user as User)
        
        return {
          success: true,
          user: result.user
        }
      } catch (error: any) {
        console.error('Login failed:', error)
        
        return {
          success: false,
          error: error.message || 'Login failed. Please check your credentials.'
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Register a new user using TRPC
     */
    async register(name: string, email: string, password: string) {
      this.isLoading = true
      
      try {
        const { $client } = useNuxtApp()
        
        // Call TRPC auth.register mutation
        const result = await $client.auth.register.mutate({
          name,
          email,
          password
        })
        
        // Set user data
        this.setUser(result.user as User)
        
        return {
          success: true,
          user: result.user
        }
      } catch (error: any) {
        console.error('Registration failed:', error)
        
        return {
          success: false,
          error: error.message || 'Registration failed. Please try again.'
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Logout using TRPC
     */
    async logout() {
      try {
        const { $client } = useNuxtApp()
        
        // Call TRPC auth.logout mutation
        await $client.auth.logout.mutate()
        
        // Clear user data
        this.setUser(null)
        
        return { success: true }
      } catch (error: any) {
        console.error('Logout failed:', error)
        
        // Clear user data anyway
        this.setUser(null)
        
        return {
          success: false,
          error: error.message || 'Logout failed'
        }
      }
    },

    /**
     * Fetch current user from server using TRPC
     */
    async fetchUser() {
      this.isLoading = true
      
      try {
        const { $client } = useNuxtApp()
        
        // Call TRPC auth.me query
        const result = await $client.auth.me.query()
        
        // Set user data
        this.setUser(result.user as User)
        
        return {
          success: true,
          user: result.user
        }
      } catch (error: any) {
        // Not authenticated or error occurred
        this.setUser(null)
        
        return {
          success: false,
          error: error.message
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Initialize auth state from localStorage and verify with server
     */
    async initAuth() {
      // Try to restore from localStorage first (for immediate UI update)
      if (process.client) {
        const storedUser = localStorage.getItem('auth_user')
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser)
            this.user = user
            this.isAuthenticated = true
          } catch (error) {
            console.error('Failed to parse stored user:', error)
            localStorage.removeItem('auth_user')
          }
        }
      }
      
      // Verify with server (this will update if token is still valid)
      await this.fetchUser()
    },

    /**
     * Change password using TRPC
     */
    async changePassword(currentPassword: string, newPassword: string) {
      try {
        const { $client } = useNuxtApp()
        
        // Call TRPC auth.changePassword mutation
        await $client.auth.changePassword.mutate({
          currentPassword,
          newPassword
        })
        
        return {
          success: true
        }
      } catch (error: any) {
        console.error('Password change failed:', error)
        
        return {
          success: false,
          error: error.message || 'Failed to change password'
        }
      }
    }
  }
})
