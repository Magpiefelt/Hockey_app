export const useUpload = () => {
  const upload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      return await response.json()
    } catch (error) {
      // Upload failed - error will be handled by caller
      throw error
    }
  }
  
  return { upload }
}
