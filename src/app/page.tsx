import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Usuário autenticado vai direto para o dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Não autenticado vai para login
  redirect('/login')
}
