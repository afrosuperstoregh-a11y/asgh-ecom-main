export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          sku: string
          price: number
          compare_price: number | null
          cost_price: number | null
          weight: number | null
          dimensions: string | null
          category_id: string | null
          vendor_id: string | null
          images: string[]
          tags: string[]
          inventory_quantity: number
          track_inventory: boolean
          allow_backorder: boolean
          requires_shipping: boolean
          is_digital: boolean
          status: 'active' | 'draft' | 'archived'
          featured: boolean
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          sku: string
          price: number
          compare_price?: number | null
          cost_price?: number | null
          weight?: number | null
          dimensions?: string | null
          category_id?: string | null
          vendor_id?: string | null
          images?: string[]
          tags?: string[]
          inventory_quantity?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          requires_shipping?: boolean
          is_digital?: boolean
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          sku?: string
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          weight?: number | null
          dimensions?: string | null
          category_id?: string | null
          vendor_id?: string | null
          images?: string[]
          tags?: string[]
          inventory_quantity?: number
          track_inventory?: boolean
          allow_backorder?: boolean
          requires_shipping?: boolean
          is_digital?: boolean
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'customer' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'admin' | 'customer' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'customer' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          role: 'admin' | 'customer' | 'super_admin'
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer' | 'super_admin'
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer' | 'super_admin'
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
