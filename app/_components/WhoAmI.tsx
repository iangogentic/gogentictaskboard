'use client'

import { useEffect, useState } from 'react'

export default function WhoAmI() {
  const [authStatus, setAuthStatus] = useState<{
    sessionEmail?: string
    appEmail?: string
    match?: boolean
    loading: boolean
  }>({ loading: true })

  useEffect(() => {
    fetch('/api/probe/whoami')
      .then(res => res.json())
      .then(data => {
        setAuthStatus({
          sessionEmail: data.sessionUser?.email,
          appEmail: data.appUser?.email,
          match: data.equal,
          loading: false
        })
      })
      .catch(() => {
        setAuthStatus({ loading: false })
      })
  }, [])

  if (authStatus.loading) {
    return <span data-testid="whoami" className="text-xs opacity-70">...</span>
  }

  if (!authStatus.sessionEmail) {
    return (
      <span data-testid="whoami" className="text-xs opacity-70 text-red-500">
        Not authenticated
      </span>
    )
  }

  return (
    <div data-testid="whoami" className="text-xs opacity-70 bg-surface px-2 py-1 rounded">
      <span className="text-green-600">Auth: </span>
      <span>{authStatus.sessionEmail}</span>
      {authStatus.match === false && (
        <span className="text-red-500 ml-1">(mismatch!)</span>
      )}
    </div>
  )
}