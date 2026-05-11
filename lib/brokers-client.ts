export async function fetchBrokers(path: string, options?: RequestInit) {
  const url = `${process.env.BROKERS_SERVICE_URL}${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Liberty-Token': process.env.LIBERTY_INTERNAL_TOKEN ?? '',
      ...(options?.headers ?? {}),
    },
  })
}
