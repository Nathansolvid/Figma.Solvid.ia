/**
 * Supabase Database Types
 * Manually defined to match our migration schema (001-006).
 * Can be regenerated with: npx supabase gen types typescript --project-id <id>
 */

export interface Database {
  public: {
    Tables: {
      // ============================================
      // CORE TABLES (migration 001)
      // ============================================
      organizations: {
        Row: {
          id: string;
          name: string;
          sector: string | null;
          size: string | null;
          logo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sector?: string | null;
          size?: string | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sector?: string | null;
          size?: string | null;
          logo?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          organization_id: string;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          role?: string;
          organization_id: string;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: string;
          organization_id?: string;
          avatar?: string | null;
          updated_at?: string;
        };
      };
      dossiers: {
        Row: {
          id: string;
          name: string;
          client_org: string | null;
          fiscal_year: string;
          referentiel_id: string | null;
          mission_type: string | null;
          pathway_type: string | null;
          provider_org: string | null;
          lead_consultant: string | null;
          start_date: string | null;
          end_date: string | null;
          selected_workflows: string[] | null;
          pack_type: string | null;
          status: string;
          period_mode: string | null;
          custom_periods: Array<{ id: string; label: string }> | null;
          description: string | null;
          organization_id: string;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          client_org?: string | null;
          fiscal_year?: string;
          referentiel_id?: string | null;
          mission_type?: string | null;
          pathway_type?: string | null;
          provider_org?: string | null;
          lead_consultant?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          selected_workflows?: string[] | null;
          pack_type?: string | null;
          status?: string;
          period_mode?: string | null;
          custom_periods?: Array<{ id: string; label: string }> | null;
          description?: string | null;
          organization_id: string;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          client_org?: string | null;
          fiscal_year?: string;
          referentiel_id?: string | null;
          mission_type?: string | null;
          pathway_type?: string | null;
          provider_org?: string | null;
          lead_consultant?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          selected_workflows?: string[] | null;
          pack_type?: string | null;
          status?: string;
          period_mode?: string | null;
          custom_periods?: Array<{ id: string; label: string }> | null;
          description?: string | null;
          owner_id?: string | null;
          updated_at?: string;
        };
      };
      vsme_values: {
        Row: {
          id: string;
          dossier_id: string;
          code: string;
          raw_value: string;
          statut: string;
          period: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          dossier_id: string;
          code: string;
          raw_value?: string;
          statut?: string;
          period?: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          dossier_id?: string;
          code?: string;
          raw_value?: string;
          statut?: string;
          period?: string;
          updated_at?: string;
        };
      };
      mission_notes: {
        Row: {
          id: string;
          dossier_id: string;
          content: string;
          author: string;
          category: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          dossier_id: string;
          content?: string;
          author: string;
          category?: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          author?: string;
          category?: string;
        };
      };

      // ============================================
      // PACK MANAGEMENT (migration 004)
      // ============================================
      pack_templates: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          category: string | null;
          checklist_template_items: unknown;
          default_kpis: unknown;
        };
        Insert: {
          id: string;
          code: string;
          name: string;
          description?: string;
          category?: string | null;
          checklist_template_items?: unknown;
          default_kpis?: unknown;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string;
          category?: string | null;
          checklist_template_items?: unknown;
          default_kpis?: unknown;
        };
      };
      pack_instances: {
        Row: {
          id: string;
          name: string;
          dossier_id: string;
          template_code: string;
          template_name: string;
          organization_id: string;
          owner_id: string | null;
          status: string;
          completion_score: number | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          dossier_id: string;
          template_code: string;
          template_name: string;
          organization_id: string;
          owner_id?: string | null;
          status?: string;
          completion_score?: number | null;
          created_at?: string;
          updated_at?: string;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
        };
        Update: {
          name?: string;
          dossier_id?: string;
          template_code?: string;
          template_name?: string;
          owner_id?: string | null;
          status?: string;
          completion_score?: number | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          updated_at?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          pack_id: string;
          code: string;
          label: string;
          requirement_level: string | null;
          category: string | null;
          status: string;
          description: string | null;
          comment: string | null;
          assigned_to: string | null;
          due_date: string | null;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          pack_id: string;
          code: string;
          label: string;
          requirement_level?: string | null;
          category?: string | null;
          status?: string;
          description?: string | null;
          comment?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          pack_id?: string;
          code?: string;
          label?: string;
          requirement_level?: string | null;
          category?: string | null;
          status?: string;
          description?: string | null;
          comment?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
      };
      kpi_requirements: {
        Row: {
          id: string;
          pack_id: string;
          code: string;
          name: string;
          unit: string;
          category: string | null;
          status: string;
          value: number | null;
          period: string | null;
          calculation_type: string | null;
          formula: string | null;
          sources: string | null;
          methodology: string | null;
          has_evidence: boolean;
          evidence_count: number;
          warnings: unknown;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          pack_id: string;
          code: string;
          name: string;
          unit?: string;
          category?: string | null;
          status?: string;
          value?: number | null;
          period?: string | null;
          calculation_type?: string | null;
          formula?: string | null;
          sources?: string | null;
          methodology?: string | null;
          has_evidence?: boolean;
          evidence_count?: number;
          warnings?: unknown;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          pack_id?: string;
          code?: string;
          name?: string;
          unit?: string;
          category?: string | null;
          status?: string;
          value?: number | null;
          period?: string | null;
          calculation_type?: string | null;
          formula?: string | null;
          sources?: string | null;
          methodology?: string | null;
          has_evidence?: boolean;
          evidence_count?: number;
          warnings?: unknown;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          pack_id: string;
          name: string;
          category: string | null;
          description: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          pack_id: string;
          name: string;
          category?: string | null;
          description?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pack_id?: string;
          name?: string;
          category?: string | null;
          description?: string | null;
          updated_at?: string;
        };
      };
      indicators: {
        Row: {
          id: string;
          folder_id: string | null;
          pack_id: string;
          code: string;
          name: string;
          unit: string;
          category: string | null;
          status: string;
          value: number | null;
          period: string | null;
          requirement_level: string | null;
          has_evidence: boolean;
          evidence_count: number;
          comment: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          folder_id?: string | null;
          pack_id: string;
          code: string;
          name: string;
          unit?: string;
          category?: string | null;
          status?: string;
          value?: number | null;
          period?: string | null;
          requirement_level?: string | null;
          has_evidence?: boolean;
          evidence_count?: number;
          comment?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          folder_id?: string | null;
          pack_id?: string;
          code?: string;
          name?: string;
          unit?: string;
          category?: string | null;
          status?: string;
          value?: number | null;
          period?: string | null;
          requirement_level?: string | null;
          has_evidence?: boolean;
          evidence_count?: number;
          comment?: string | null;
          updated_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          pack_id: string;
          workflow_id: string | null;
          indicator_id: string | null;
          file_name: string;
          file_type: string;
          file_size: number;
          file_hash: string | null;
          storage_path: string | null;
          period: string | null;
          category: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          linked_indicators: unknown;
          completion_type: string | null;
          justification: string | null;
          organization_id: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          pack_id: string;
          workflow_id?: string | null;
          indicator_id?: string | null;
          file_name: string;
          file_type: string;
          file_size?: number;
          file_hash?: string | null;
          storage_path?: string | null;
          period?: string | null;
          category?: string | null;
          uploaded_by?: string | null;
          uploaded_at?: string;
          linked_indicators?: unknown;
          completion_type?: string | null;
          justification?: string | null;
          organization_id: string;
          updated_at?: string | null;
        };
        Update: {
          pack_id?: string;
          workflow_id?: string | null;
          indicator_id?: string | null;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          file_hash?: string | null;
          storage_path?: string | null;
          period?: string | null;
          category?: string | null;
          uploaded_by?: string | null;
          linked_indicators?: unknown;
          completion_type?: string | null;
          justification?: string | null;
          updated_at?: string | null;
        };
      };
      evidence_links: {
        Row: {
          id: string;
          evidence_id: string;
          kpi_id: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          evidence_id: string;
          kpi_id: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          evidence_id?: string;
          kpi_id?: string;
        };
      };

      // ============================================
      // DATA IMPORTS (migration 004)
      // ============================================
      data_imports: {
        Row: {
          id: string;
          pack_id: string;
          file_name: string;
          mapping_name: string | null;
          status: string;
          rows_total: number;
          rows_created: number;
          rows_updated: number;
          rows_errored: number;
          error_details: unknown | null;
          uploaded_by: string | null;
          organization_id: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id: string;
          pack_id: string;
          file_name: string;
          mapping_name?: string | null;
          status?: string;
          rows_total?: number;
          rows_created?: number;
          rows_updated?: number;
          rows_errored?: number;
          error_details?: unknown | null;
          uploaded_by?: string | null;
          organization_id: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          pack_id?: string;
          file_name?: string;
          mapping_name?: string | null;
          status?: string;
          rows_total?: number;
          rows_created?: number;
          rows_updated?: number;
          rows_errored?: number;
          error_details?: unknown | null;
          completed_at?: string | null;
        };
      };
      data_rows: {
        Row: {
          id: string;
          import_id: string;
          pack_id: string;
          indicator_code: string;
          value: number | null;
          unit: string | null;
          period: string | null;
          source: string | null;
          methodology: string | null;
          comment: string | null;
          row_index: number | null;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          import_id: string;
          pack_id: string;
          indicator_code: string;
          value?: number | null;
          unit?: string | null;
          period?: string | null;
          source?: string | null;
          methodology?: string | null;
          comment?: string | null;
          row_index?: number | null;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          import_id?: string;
          pack_id?: string;
          indicator_code?: string;
          value?: number | null;
          unit?: string | null;
          period?: string | null;
          source?: string | null;
          methodology?: string | null;
          comment?: string | null;
          row_index?: number | null;
        };
      };

      // ============================================
      // TASKS & NOTIFICATIONS (migration 004)
      // ============================================
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string | null;
          status: string;
          priority: string;
          pack_id: string | null;
          assigned_to: string | null;
          due_date: string | null;
          linked_indicators: unknown;
          has_excel_template: boolean;
          excel_template_url: string | null;
          excel_status: string | null;
          tags: unknown;
          created_by: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id: string;
          title: string;
          description?: string;
          category?: string | null;
          status?: string;
          priority?: string;
          pack_id?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          linked_indicators?: unknown;
          has_excel_template?: boolean;
          excel_template_url?: string | null;
          excel_status?: string | null;
          tags?: unknown;
          created_by?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string | null;
          status?: string;
          priority?: string;
          pack_id?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          linked_indicators?: unknown;
          has_excel_template?: boolean;
          excel_template_url?: string | null;
          excel_status?: string | null;
          tags?: unknown;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string;
          pack_id: string | null;
          read: boolean;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description?: string;
          pack_id?: string | null;
          read?: boolean;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          type?: string;
          title?: string;
          description?: string;
          pack_id?: string | null;
          read?: boolean;
        };
      };

      // ============================================
      // AUDIT & EXPORT (migration 004)
      // ============================================
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id: string | null;
          user_name: string | null;
          user_role: string | null;
          details: unknown | null;
          before_data: unknown | null;
          after_data: unknown | null;
          ip_address: string | null;
          organization_id: string;
          timestamp: string;
        };
        Insert: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          user_id?: string | null;
          user_name?: string | null;
          user_role?: string | null;
          details?: unknown | null;
          before_data?: unknown | null;
          after_data?: unknown | null;
          ip_address?: string | null;
          organization_id: string;
          timestamp?: string;
        };
        Update: never; // append-only
      };
      export_history: {
        Row: {
          id: string;
          pack_id: string;
          type: string | null;
          file_name: string;
          file_size: number;
          storage_path: string | null;
          generated_by: string | null;
          organization_id: string;
          generated_at: string;
        };
        Insert: {
          id: string;
          pack_id: string;
          type?: string | null;
          file_name: string;
          file_size?: number;
          storage_path?: string | null;
          generated_by?: string | null;
          organization_id: string;
          generated_at?: string;
        };
        Update: {
          pack_id?: string;
          type?: string | null;
          file_name?: string;
          file_size?: number;
          storage_path?: string | null;
        };
      };

      // ============================================
      // INVITATIONS (migration 004)
      // ============================================
      invitations: {
        Row: {
          id: string;
          email: string;
          role: string;
          organization_id: string;
          organization_name: string | null;
          invited_by: string | null;
          invited_by_name: string | null;
          status: string;
          subscription_plan: string;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
          accepted_user_id: string | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: string;
          organization_id: string;
          organization_name?: string | null;
          invited_by?: string | null;
          invited_by_name?: string | null;
          status?: string;
          subscription_plan?: string;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
        };
        Update: {
          email?: string;
          role?: string;
          organization_name?: string | null;
          status?: string;
          subscription_plan?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
        };
      };

      // ============================================
      // ERP INTEGRATION (migration 004)
      // ============================================
      erp_connections: {
        Row: {
          id: string;
          organization_id: string;
          provider: string;
          name: string;
          status: string;
          credentials: unknown;
          config: unknown;
          last_sync_status: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          provider: string;
          name: string;
          status?: string;
          credentials?: unknown;
          config?: unknown;
          last_sync_status?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          name?: string;
          status?: string;
          credentials?: unknown;
          config?: unknown;
          last_sync_status?: string | null;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      erp_mappings: {
        Row: {
          id: string;
          connection_id: string;
          name: string;
          description: string | null;
          rules: unknown;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          connection_id: string;
          name: string;
          description?: string | null;
          rules?: unknown;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          connection_id?: string;
          name?: string;
          description?: string | null;
          rules?: unknown;
          updated_at?: string;
        };
      };
      erp_sync_jobs: {
        Row: {
          id: string;
          connection_id: string;
          status: string;
          triggered_by: string | null;
          stats: unknown;
          errors: unknown;
          data_preview: unknown;
          organization_id: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          connection_id: string;
          status?: string;
          triggered_by?: string | null;
          stats?: unknown;
          errors?: unknown;
          data_preview?: unknown;
          organization_id: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          connection_id?: string;
          status?: string;
          triggered_by?: string | null;
          stats?: unknown;
          errors?: unknown;
          data_preview?: unknown;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      esg_data_points: {
        Row: {
          id: string;
          vsme_code: string;
          pillar: string | null;
          value: number | null;
          unit: string | null;
          source: string | null;
          confidence: number | null;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vsme_code: string;
          pillar?: string | null;
          value?: number | null;
          unit?: string | null;
          source?: string | null;
          confidence?: number | null;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          vsme_code?: string;
          pillar?: string | null;
          value?: number | null;
          unit?: string | null;
          source?: string | null;
          confidence?: number | null;
        };
      };
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}
