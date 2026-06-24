import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente separado para a base de empresas (somente leitura)
export function createEmpresasClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_EMPRESAS_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_EMPRESAS_SUPABASE_ANON_KEY!
  )
}
