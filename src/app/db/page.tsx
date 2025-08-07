import * as schema from '@/db/schema'
import { usersTable } from '@/db/schema'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql, schema: schema })

export default async function DbPage() {
  const users = await db.select().from(usersTable)

  if (users.length === 0) {
    return <div>no data</div>
  }
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
