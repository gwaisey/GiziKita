import { supabase } from '../core/SupabaseClient';

class FeedbackService {
  async getFeedbacks(filter = 'all') {
    let query = supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
    
    if (filter === 'pending') query = query.eq('resolved', false);
    if (filter === 'resolved') query = query.eq('resolved', true);
    if (filter === 'bad') query = query.eq('sentiment', 'bad');
    if (filter === 'good') query = query.eq('sentiment', 'good');

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching feedbacks:', error);
      return [];
    }
    
    // Format date for display
    return data.map(fb => ({
      ...fb,
      date: new Date(fb.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }));
  }

  async addFeedback(feedback) {
    const user = window.app.services.auth.currentUser;
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        { 
          school: feedback.school, 
          role: feedback.role, 
          stars: feedback.stars, 
          text: feedback.text, 
          sentiment: feedback.sentiment,
          user_id: user ? user.id : null,
          ticket_number: 'TKT-' + Date.now().toString().slice(-6),
          replies: []
        }
      ]);
      
    if (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
    return data;
  }

  async addReply(id, replyText, newStatus) {
    // Fetch current
    const { data: currentFb, error: fetchErr } = await supabase.from('feedbacks').select('replies').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    const replies = currentFb.replies || [];
    const user = window.app.services.auth.currentUser;
    const authorName = user?.role === 'admin_pusat' ? 'Admin Pusat GiziKita' : 'Admin Sekolah';

    replies.push({
      id: Date.now().toString(),
      date: new Date().toLocaleString('id-ID'),
      author: authorName,
      message: replyText,
      status: newStatus
    });

    // Update
    const updates = { replies };
    if (newStatus === 'Selesai') updates.resolved = true;
    else if (newStatus === 'Diproses') updates.resolved = false;

    const { error } = await supabase.from('feedbacks').update(updates).eq('id', id);
    if (error) throw error;
  }

  async getFeedbackById(id) {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return {
      ...data,
      date: new Date(data.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };
  }
}

export default new FeedbackService();
