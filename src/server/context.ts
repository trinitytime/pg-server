import type { Request } from './request'
import type { Response } from './response'

export class Context {
  request: Request
  response: Response

  constructor(request: Request, response: Response) {
    this.request = request
    this.response = response
  }
}
