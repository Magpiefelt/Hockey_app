import type { H3Event } from 'h3'
import { getUserFromEvent } from '../utils/auth'

export interface Context {
  event: H3Event
  user: { userId: number; role: string } | null
}

/**
 * Create context for tRPC procedures
 */
export async function createContext(event: H3Event): Promise<Context> {
  const user = getUserFromEvent(event)
  
  return {
    event,
    user
  }
}
