import type { Context } from './context'

export type QueryHandler = (c: Context) => any
export type MessageHandler = (code: number, buffer: Uint8Array) => void
