export function getSessionUserId(request: Request): number | null {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/user_id=(\d+)/)
  return match ? parseInt(match[1]) : null
}

export function getSessionUserRole(request: Request): string | null {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/role=([^;]+)/)
  return match ? match[1] : null
}
