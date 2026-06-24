'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: dados pessoais
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Step 2: dados da empresa
  const [companyName, setCompanyName] = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Criar usuário no Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Criar organização via API route
    const slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)

    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyName, slug }),
    })

    if (!res.ok) {
      const { error: apiError } = await res.json()
      setError(apiError || 'Erro ao criar empresa. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard?onboarding=true')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-text-primary">CEO Brain</span>
          </div>
          <p className="text-sm text-text-secondary">
            7 dias grátis, sem cartão de crédito
          </p>
        </div>

        <div className="card">
          {/* Indicador de progresso */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-border'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-border'}`} />
          </div>

          {step === 1 && (
            <>
              <h1 className="text-lg font-semibold text-text-primary mb-1">
                Crie sua conta
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                Passo 1 de 2 — Seus dados
              </p>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="label">Nome completo</label>
                  <input
                    id="fullName"
                    type="text"
                    className="input"
                    placeholder="João Silva"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">Senha</label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-btn px-3 py-2">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full justify-center">
                  Continuar
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-lg font-semibold text-text-primary mb-1">
                Sua empresa
              </h1>
              <p className="text-sm text-text-secondary mb-6">
                Passo 2 de 2 — Dados da empresa
              </p>

              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="label">Nome da empresa</label>
                  <input
                    id="companyName"
                    type="text"
                    className="input"
                    placeholder="Empresa XYZ Ltda"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Pode ser alterado depois nas configurações
                  </p>
                </div>

                <div className="bg-brand-light rounded-btn px-3 py-2">
                  <p className="text-xs text-brand-dark font-medium">
                    ✓ 7 dias gratuitos, sem cartão de crédito
                  </p>
                  <p className="text-xs text-brand-dark mt-0.5">
                    Depois do trial: R$ 99/mês, cancele quando quiser
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-btn px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null) }}
                    className="btn-secondary"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 justify-center"
                  >
                    {loading ? 'Criando conta...' : 'Criar conta grátis'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand hover:text-brand-hover font-medium">
            Entrar
          </Link>
        </p>

      </div>
    </div>
  )
}
