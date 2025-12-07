export const useMockAuth = () => {
  const user = ref(null)
  
  const login = async (email: string, password: string) => {
    // Mock login
    user.value = { email, id: '1' }
    return user.value
  }
  
  const logout = () => {
    user.value = null
  }
  
  return {
    user,
    login,
    logout
  }
}
