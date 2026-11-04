const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
])

const ALLOWED_METHODS = new Set([
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
])
const PROXY_PATH_QUERY_KEY = "__api_path"

const sendJson = (response, status, payload) => {
  response.status(status)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.send(JSON.stringify(payload))
}

export const createApiProxy = ({
  backendUrl = process.env.BACKEND_URL,
  fetchImpl = fetch,
  logger = console,
} = {}) => async (request, response) => {
  if (!backendUrl) {
    logger.error('Dashboard API proxy is missing BACKEND_URL.')
    sendJson(response, 500, { success: false, message: 'The service is not configured.' })
    return
  }

  const method = request.method?.toUpperCase()
  if (!ALLOWED_METHODS.has(method)) {
    response.setHeader('Allow', [...ALLOWED_METHODS].join(', '))
    sendJson(response, 405, { success: false, message: 'Method not allowed.' })
    return
  }

  let upstreamUrl
  try {
    const backend = new URL(backendUrl)
    if (backend.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(backend.hostname)) {
      throw new Error('BACKEND_URL must use HTTPS outside localhost.')
    }

    const incomingUrl = new URL(request.url || '/', 'http://localhost')
    const queryPath = request.query?.[PROXY_PATH_QUERY_KEY] ??
      incomingUrl.searchParams.get(PROXY_PATH_QUERY_KEY)
    const routePath = Array.isArray(queryPath) ? queryPath.join('/') : queryPath
    const segments = typeof routePath === 'string' ? routePath.split('/') : []
    if (
      !segments.length ||
      segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment) || segment === '.' || segment === '..')
    ) {
      sendJson(response, 404, { success: false, message: 'API route not found.' })
      return
    }
    incomingUrl.searchParams.delete(PROXY_PATH_QUERY_KEY)
    const queryString = incomingUrl.searchParams.toString()
    const apiPath = `/api/${segments.join('/')}`
    upstreamUrl = new URL(`${apiPath}${queryString ? `?${queryString}` : ''}`, backend.origin)
  } catch {
    logger.error('Dashboard API proxy configuration is invalid.')
    sendJson(response, 500, { success: false, message: 'The service is not configured correctly.' })
    return
  }

  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers || {})) {
    const normalizedName = name.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(normalizedName) || value === undefined) continue
    const normalizedValue = Array.isArray(value) ? value.join(', ') : String(value)
    headers.set(normalizedName, normalizedValue)
  }

  let body
  if (!['GET', 'HEAD'].includes(method) && request.body !== undefined) {
    if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
      body = request.body
    } else {
      body = JSON.stringify(request.body)
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json')
      }
    }
  }

  try {
    const upstream = await fetchImpl(upstreamUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
    })

    response.status(upstream.status)
    response.setHeader('Cache-Control', 'no-store')
    for (const headerName of ['content-type', 'retry-after', 'www-authenticate']) {
      const value = upstream.headers.get(headerName)
      if (value) response.setHeader(headerName, value)
    }

    const cookies = upstream.headers.getSetCookie?.()
    if (cookies?.length) {
      response.setHeader('Set-Cookie', cookies)
    } else {
      const cookie = upstream.headers.get('set-cookie')
      if (cookie) response.setHeader('Set-Cookie', cookie)
    }

    response.send(Buffer.from(await upstream.arrayBuffer()))
  } catch {
    logger.error('Dashboard API proxy could not reach the backend.')
    sendJson(response, 502, { success: false, message: 'The service is temporarily unavailable.' })
  }
}

export default createApiProxy()
