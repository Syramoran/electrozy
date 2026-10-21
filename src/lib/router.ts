import { useEffect, useState } from 'react'

export type Route = { page: 'home' } | { page: 'lesson'; id: string; from: number } | { page: 'playground' } | { page: 'review' } | { page: 'achievements' } | { page: 'trailer' }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'leccion' && parts[1]) return { page: 'lesson', id: parts[1], from: parts[2] ? Number(parts[2]) || 0 : -1 }
  if (parts[0] === 'taller') return { page: 'playground' }
  if (parts[0] === 'repaso') return { page: 'review' }
  if (parts[0] === 'logros') return { page: 'achievements' }
  if (parts[0] === 'trailer') return { page: 'trailer' }
  return { page: 'home' }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(location.hash))
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (path: string) => (location.hash = path)
