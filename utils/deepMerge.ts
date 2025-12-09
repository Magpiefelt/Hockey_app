/**
 * Deep merge utility for merging nested objects
 * Preserves nested object structures and arrays
 * 
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns The merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  // Create a copy of the target to avoid mutations
  const output = { ...target }

  // If source is not an object, return target
  if (!isObject(source)) {
    return output
  }

  // Iterate through source properties
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key]
    const targetValue = output[key]

    // Skip undefined values in source - keep the target value
    // This prevents undefined from overwriting defaults during initialization
    if (sourceValue === undefined) {
      return
    }

    // If both values are objects (but not arrays), merge recursively
    if (isObject(sourceValue) && isObject(targetValue) && !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
      output[key] = deepMerge(targetValue, sourceValue)
    } else {
      // Otherwise, use the source value (this handles primitives, arrays, null)
      output[key] = sourceValue
    }
  })

  return output
}

/**
 * Check if a value is a plain object
 */
function isObject(item: any): item is Record<string, any> {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}
