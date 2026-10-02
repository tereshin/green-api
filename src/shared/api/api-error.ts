export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let payload: unknown = null

    try {
      payload = await response.json()
    } catch {
      // тело может быть пустым или не-JSON — это нормально
    }

    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`

    return new ApiError(response.status, message, payload)
  }
}
