'use client'

import { useEffect, useState } from 'react'
import { usersTable } from '@/db/schema'

type User = typeof usersTable.$inferSelect

export default function DbPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        } else {
          setError('Failed to fetch users')
        }
      } catch {
        setError('Error connecting to database')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (users.length === 0) return <div>no data</div>

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>
          <div>email: {user.email}</div>
        </div>
      ))}
    </div>
  )
}
