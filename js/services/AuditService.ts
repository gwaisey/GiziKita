import { supabase } from '../core/SupabaseClient';

export interface AuditLogEntry {
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
}

class AuditService {
  private disabled = false;
  private hasWarnedDisabled = false;

  private disableWithWarning(reason: string) {
    this.disabled = true;
    if (!this.hasWarnedDisabled) {
      this.hasWarnedDisabled = true;
      console.warn(`[AuditService] Auditing disabled: ${reason}`);
    }
  }

  /**
   * Log an action to the database.
   * This is designed to be non-blocking to prevent UI delays, 
   * but it logs critical errors if the audit itself fails.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (this.disabled) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_data: entry.old_data,
          new_data: entry.new_data
        }]);

      if (error) {
        const message = error.message || 'Unknown error';
        const code = (error as any).code as string | undefined;

        // PostgREST returns PGRST205 when a table isn't present/exposed in schema cache.
        if (code === 'PGRST205' || /schema cache/i.test(message) || /Could not find the table/i.test(message)) {
          this.disableWithWarning(message);
          return;
        }

        console.warn('[AuditService] Failed to write audit log:', message);
      }
    } catch (err) {
      console.warn('[AuditService] Audit system failure:', err);
    }
  }
}

export default new AuditService();
