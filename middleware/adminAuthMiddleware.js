const adminSessions = new Map()

const SESSION_DURATION = 24 * 60 * 60 * 1000

export function createAdminSession() {
  const sessionId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = Date.now() + SESSION_DURATION

  adminSessions.set(sessionId, { expiresAt })

  return sessionId
}

export function validateAdminSession(sessionId) {
  if (!sessionId || !adminSessions.has(sessionId)) {
    return false
  }

  const session = adminSessions.get(sessionId)

  if (Date.now() > session.expiresAt) {
    adminSessions.delete(sessionId)
    return false
  }

  return true
}

export function invalidateAdminSession(sessionId) {
  adminSessions.delete(sessionId)
}

export function requireAdminAuth(req, res, next) {
  const sessionId = req.cookies?.adminSessionId

  if (!validateAdminSession(sessionId)) {
    res.redirect('/admin/login?error=Please%20sign%20in%20to%20access%20admin%20panel')
    return
  }

  next()
}

export function clearExpiredSessions() {
  for (const [sessionId, session] of adminSessions.entries()) {
    if (Date.now() > session.expiresAt) {
      adminSessions.delete(sessionId)
    }
  }
}

setInterval(clearExpiredSessions, 60 * 60 * 1000)
