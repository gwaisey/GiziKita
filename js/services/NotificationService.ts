import { supabase } from '../core/SupabaseClient';
import { useNotificationStore, Notification } from '../store/notificationStore';

class NotificationService {
  /**
   * Fetch all notifications for the current user
   */
  async fetchNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    useNotificationStore.getState().setNotifications(data as Notification[]);
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    useNotificationStore.getState().markAsRead(id);
  }

  /**
   * Mark all notifications for the user as read
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    useNotificationStore.getState().markAllAsRead();
  }

  /**
   * Create a new notification
   */
  async notify(userId: string, title: string, message: string, link: string = '', type: 'info' | 'success' | 'warning' = 'info') {
    // Prevent duplicates for the same title on the same day
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) {
      return null; // Already notified today
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        link,
        type
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  }

  /**
   * Notify all Admin Pusat users
   */
  async notifyAdminPusat(title: string, message: string, link: string = '', type: 'info' | 'success' | 'warning' = 'info') {
    // 1. Fetch all admin_pusat IDs
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin_pusat');

    if (error || !admins) return;

    // 2. Insert notifications for each
    const notifications = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      title,
      message,
      link,
      type
    }));

    await supabase.from('notifications').insert(notifications);
  }

  /**
   * Notify all admins of a specific school
   */
  async notifySchoolAdmins(schoolId: string, title: string, message: string, link: string = '', type: 'info' | 'success' | 'warning' = 'info') {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin_sekolah')
      .eq('school_id', schoolId);

    if (error || !admins || admins.length === 0) return;

    const notifications = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      title,
      message,
      link,
      type
    }));

    await supabase.from('notifications').insert(notifications);
  }

  /**
   * Notify users by specific role
   */
  async notifyRole(role: string, title: string, message: string, link: string = '', type: 'info' | 'success' | 'warning' = 'info') {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (error || !users) return;

    const notifications = users.map((user: { id: string }) => ({
      user_id: user.id,
      title,
      message,
      link,
      type
    }));

    await supabase.from('notifications').insert(notifications);
  }

  /**
   * Broadcast a notification to all users
   */
  async notifyAllUsers(title: string, message: string, link: string = '', type: 'info' | 'success' | 'warning' = 'info') {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id');

    if (error || !users) return;

    const notifications = users.map((user: { id: string }) => ({
      user_id: user.id,
      title,
      message,
      link,
      type
    }));

    await supabase.from('notifications').insert(notifications);
  }

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(userId: string) {
    return supabase
      .channel(`notifications_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          useNotificationStore.getState().addNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }
}

export default new NotificationService();
