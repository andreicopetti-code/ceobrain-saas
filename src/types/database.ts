// ============================================================
// CEO Brain SaaS — Tipos do Banco de Dados
// Este arquivo deve ser regenerado com: npx supabase gen types
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'
export type UserRole = 'admin' | 'member' | 'viewer'
export type ActivityType = 'stage_change' | 'note' | 'create' | 'update' | 'delete' | 'system'

export interface Database {
  public: {
    Tables: {
      // ---- Planos ----
      plans: {
        Row: {
          id: string
          name: string
          price_monthly: number
          price_annual: number
          features: Json
          stripe_price_monthly_id: string | null
          stripe_price_annual_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Plans['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Plans['Insert']>
      }

      // ---- Organizações (empresas clientes do SaaS) ----
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          plan_id: string
          subscription_status: SubscriptionStatus
          trial_ends_at: string | null
          subscription_started_at: string | null
          subscription_ended_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Organizations['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Organizations['Insert']>
      }

      // ---- Membros da Organização ----
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: UserRole
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<OrganizationMembers['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<OrganizationMembers['Insert']>
      }

      // ---- Perfis de Usuário ----
      profiles: {
        Row: {
          id: string             // mesmo UUID do auth.users
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Profiles['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Profiles['Insert']>
      }

      // ---- Funis de Vendas ----
      funnels: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          stages: string[]          // ex: ["Prospecção","Negociação","Fechamento","Ganho","Perdido"]
          currency: 'BRL' | 'USD'
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Funnels['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Funnels['Insert']>
      }

      // ---- Contatos ----
      contacts: {
        Row: {
          id: string
          organization_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          cnpj: string | null        // link com a base de empresas
          position: string | null
          custom_fields: Json
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Contacts['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Contacts['Insert']>
      }

      // ---- Oportunidades ----
      opportunities: {
        Row: {
          id: string
          funnel_id: string
          organization_id: string
          contact_id: string | null
          title: string
          description: string | null
          value: number
          stage: string
          probability: number         // 0-100
          expected_close_date: string | null
          owner_id: string
          tags: string[]
          custom_fields: Json
          lost_reason: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Opportunities['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Opportunities['Insert']>
      }

      // ---- Log de Atividades ----
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          entity_type: 'opportunity' | 'contact' | 'funnel'
          entity_id: string
          type: ActivityType
          description: string
          metadata: Json
          created_at: string
        }
        Insert: Omit<ActivityLogs['Row'], 'id' | 'created_at'>
        Update: never    // logs são imutáveis
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_user_organization: {
        Args: { p_user_id: string }
        Returns: { organization_id: string; role: UserRole } | null
      }
    }

    Enums: {
      subscription_status: SubscriptionStatus
      user_role: UserRole
      activity_type: ActivityType
    }
  }
}

// ---- Aliases convenientes ----
export type Plans                = Database['public']['Tables']['plans']
export type Organizations        = Database['public']['Tables']['organizations']
export type OrganizationMembers  = Database['public']['Tables']['organization_members']
export type Profiles             = Database['public']['Tables']['profiles']
export type Funnels              = Database['public']['Tables']['funnels']
export type Contacts             = Database['public']['Tables']['contacts']
export type Opportunities        = Database['public']['Tables']['opportunities']
export type ActivityLogs         = Database['public']['Tables']['activity_logs']

export type Organization = Organizations['Row']
export type Opportunity  = Opportunities['Row']
export type Contact      = Contacts['Row']
export type Funnel       = Funnels['Row']
export type ActivityLog  = ActivityLogs['Row']
export type Profile      = Profiles['Row']
export type Plan         = Plans['Row']
