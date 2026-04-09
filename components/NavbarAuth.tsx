'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function NavbarAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get current user on load
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (!user) {
    return (
      <a href="/auth" className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition">
        Login
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">{user.email}</span>
      <button
        onClick={handleLogout}
        className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg transition"
      >
        Logout
      </button>
    </div>
  )
}