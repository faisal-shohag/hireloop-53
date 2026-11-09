export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      cache: "no-store",
      ...init,
    })
  } catch {
    throw new ApiError("The server is unavailable. Please try again.", 503)
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || data === null) {
    throw new ApiError(
      data?.message || "The request could not be completed. Please retry.",
      response.status,
      data?.code
    )
  }
  return data as T
}
