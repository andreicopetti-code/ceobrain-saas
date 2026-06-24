import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays } from 'date-fns'

export async function POST(request: Request) {
  const supabase      = await createClient()
  const adminSupabase = await createAdminClient()

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { name, slug } = await request.json()

  if (!name || !slug) {
    return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 })
  }

  // Buscar plano padrão
  const { data: plan } = await adminSupabase
    .from('plans')
    .select('id')
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plano não encontrado' }, { status: 500 })
  }

  // Criar organização com trial de 7 dias
  const trialEndsAt = addDays(new Date(), Number(process.env.NEXT_PUBLIC_TRIAL_DAYS) || 7)

  const { data: org, error: orgError } = await adminSupabase
    .from('organizations')
    .insert({
      name,
      slug,
      plan_id: plan.id,
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .select()
    .single()

  if (orgError) {
    if (orgError.code === '23505') {
      // Slug duplicado — adicionar sufixo numérico
      const newSlug = `${slug}-${Math.floor(Math.random() * 9000) + 1000}`
      const { data: org2, error: org2Error } = await adminSupabase
        .from('organizations')
        .insert({
          name,
          slug: newSlug,
          plan_id: plan.id,
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .select()
        .single()

      if (org2Error) {
        return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
      }

      await createMemberAndFunnel(adminSupabase, user.id, org2.id)
      return NextResponse.json({ organization: org2 }, { status: 201 })
    }

    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 })
  }

  await createMemberAndFunnel(adminSupabase, user.id, org.id)
  return NextResponse.json({ organization: org }, { status: 201 })
}

async function createMemberAndFunnel(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  orgId: string
) {
  // Adicionar usuário como admin da organização
  await supabase.from('organization_members').insert({
    organization_id: orgId,
    user_id: userId,
    role: 'admin',
    accepted_at: new Date().toISOString(),
  })

  // Criar funil padrão
  await supabase.from('funnels').insert({
    organization_id: orgId,
    name: 'Funil Principal',
    stages: ['Prospecção', 'Negociação', 'Proposta', 'Fechamento', 'Ganho', 'Perdido'],
    currency: 'BRL',
    created_by: userId,
  })
}
