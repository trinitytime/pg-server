import { toDataType } from './types'

export function rowDescriptionFromFields(fields: Record<string, any>) {
  return Object.fromEntries(Object.entries(fields).map(([name, type]) => [name, toDataType(type)]))
}
