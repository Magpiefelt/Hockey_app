import { ref, reactive } from 'vue'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  date?: boolean
  custom?: (value: any) => boolean | string
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export const useFormValidation = (rules: ValidationRules) => {
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})

  const validateField = (fieldName: string, value: any): boolean => {
    const rule = rules[fieldName]
    if (!rule) return true

    // Clear previous error
    errors[fieldName] = ''

    // Required validation
    if (rule.required) {
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        errors[fieldName] = 'This field is required'
        return false
      }
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === '' || value === null || value === undefined)) {
      return true
    }

    // Min length validation
    if (rule.minLength && String(value).length < rule.minLength) {
      errors[fieldName] = `Must be at least ${rule.minLength} characters`
      return false
    }

    // Max length validation
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors[fieldName] = `Must be no more than ${rule.maxLength} characters`
      return false
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(String(value))) {
        errors[fieldName] = 'Please enter a valid email address'
        return false
      }
    }

    // Phone validation
    if (rule.phone) {
      const digitsOnly = String(value).replace(/\D/g, '')
      if (digitsOnly.length < 10) {
        errors[fieldName] = 'Please enter a valid phone number (at least 10 digits)'
        return false
      }
    }

    // Date validation
    if (rule.date) {
      const dateValue = new Date(value)
      if (isNaN(dateValue.getTime())) {
        errors[fieldName] = 'Please enter a valid date'
        return false
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors[fieldName] = 'Invalid format'
      return false
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value)
      if (typeof result === 'string') {
        errors[fieldName] = result
        return false
      }
      if (result === false) {
        errors[fieldName] = 'Invalid value'
        return false
      }
    }

    return true
  }

  const validateAll = (formData: Record<string, any>): boolean => {
    let isValid = true
    
    for (const fieldName in rules) {
      const fieldValue = formData[fieldName]
      if (!validateField(fieldName, fieldValue)) {
        isValid = false
      }
      touched[fieldName] = true
    }

    return isValid
  }

  const touchField = (fieldName: string) => {
    touched[fieldName] = true
  }

  const resetValidation = () => {
    for (const key in errors) {
      errors[key] = ''
    }
    for (const key in touched) {
      touched[key] = false
    }
  }

  const getError = (fieldName: string): string => {
    return touched[fieldName] ? errors[fieldName] : ''
  }

  const hasError = (fieldName: string): boolean => {
    return touched[fieldName] && !!errors[fieldName]
  }

  return {
    errors,
    touched,
    validateField,
    validateAll,
    touchField,
    resetValidation,
    getError,
    hasError
  }
}
