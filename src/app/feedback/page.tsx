'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  ArrowLeft, 
  Star, 
  Clock, 
  Send,
  Loader2
} from 'lucide-react';
import FeedbackService, { Feedback } from '@/js/services/FeedbackService';
import AuthService from '@/js/services/AuthService';
import AIService from '@/js/services/AIService';
import { useAuthStore } from '@/js/store/authStore';
import { useUIStore } from '@/js/store/uiStore';

type ViewType = 'list' | 'detail' | 'form';

export default function FeedbackPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  // State
  const [view, setView] = useState<ViewType>('list');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [formSchool, setFormSchool] = useState('');
  const [formRole, setFormRole] = useState('Orang Tua');
  const [formStars, setFormStars] = useState(0);
  const [formText, setFormText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Reply State
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'Diproses' | 'Selesai'>('Diproses');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [activeFilter]);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const data = await FeedbackService.getFeedbacks(activeFilter);
      setFeedbacks(data);
    } catch (err) {
      showToast('Gagal memuat data umpan balik.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    setIsLoading(true);
    setView('detail');
    try {
      const fb = await FeedbackService.getFeedbackById(id);
      setSelectedFeedback(fb);
    } catch (err) {
      showToast('Gagal memuat detail umpan balik.');
      setView('list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStars || !formText.trim()) {
      showToast('Harap berikan rating dan isi pesan Anda!');
      return;
    }

    setIsSubmitting(true);
    try {
      const sentiment = await AIService.analyzeSentiment(formText, formStars);
      await FeedbackService.addFeedback({
        school: formSchool || 'Umum',
        role: formRole,
        stars: formStars,
        text: formText,
        sentiment: sentiment as any
      });
      showToast('Umpan balik berhasil dikirim!');
      setFormStars(0);
      setFormText('');
      setView('list');
      fetchFeedbacks();
    } catch (err: any) {
      showToast('Gagal mengirim: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !selectedFeedback) return;
    setIsReplying(true);
    try {
      await FeedbackService.addReply(selectedFeedback.id, replyText, replyStatus);
      showToast('Tanggapan berhasil dikirim!');
      setReplyText('');
      const updated = await FeedbackService.getFeedbackById(selectedFeedback.id);
      setSelectedFeedback(updated);
    } catch (err) {
      showToast('Gagal mengirim tanggapan.');
    } finally {
      setIsReplying(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    if (sentiment === 'good') return <span className="badge badge-good">✅ Baik</span>;
    if (sentiment === 'bad') return <span className="badge badge-bad">⚠️ Buruk</span>;
    return <span className="badge badge-neutral">⚪ Netral</span>;
  };

  const isAdminPusat = currentUser?.role === 'admin_pusat';

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decoration */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '-20px', bottom: '120px', width: '240px', opacity: 0.14 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#8B1C3F"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
        <div className="page-inner wide" style={{ padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
            <div>
              <h1 className="page-heading" style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 900, color: 'var(--maroon)', margin: 0 }}>Umpan Balik</h1>
              <p className="page-sub" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Lihat dan kelola umpan balik dari komunitas GiziKita.</p>
            </div>
            {AuthService.isAuthenticated() ? (
              <button className="btn btn-primary" onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Kirim Umpan Balik
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => router.push('/login')} style={{ opacity: 0.7 }}>Login untuk Memberi Feedback</button>
            )}
          </div>

          <div className="tabs" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '32px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            {['all', 'pending', 'resolved', 'bad', 'good'].map((f) => (
              <button 
                key={f} 
                className={`tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '30px', 
                  fontSize: '14px', 
                  fontWeight: 700,
                  background: activeFilter === f ? 'var(--maroon)' : 'transparent',
                  color: activeFilter === f ? '#fff' : 'var(--text-muted)',
                  border: activeFilter === f ? 'none' : '1px solid #ddd',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f === 'all' && 'Semua'}
                {f === 'pending' && 'Belum Ditangani'}
                {f === 'resolved' && 'Sudah Ditangani'}
                {f === 'bad' && '⚠️ Buruk'}
                {f === 'good' && '✅ Baik'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <Loader2 className="spinner" size={40} color="var(--maroon)" />
              <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Memuat aspirasi...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {feedbacks.map((fb) => (
                <div 
                  key={fb.id} 
                  className="feedback-card" 
                  onClick={() => handleOpenDetail(fb.id)}
                  style={{
                    background: '#fff',
                    borderRadius: '18px',
                    padding: '24px',
                    boxShadow: '0 10px 30px rgba(139,28,63,0.05)',
                    border: '1.5px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '18px', color: 'var(--maroon)' }}>{fb.school}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fb.date}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Pelapor: {fb.role}</div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} fill={s <= fb.stars ? 'var(--gold)' : 'none'} color={s <= fb.stars ? 'var(--gold)' : '#ddd'} />
                    ))}
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, marginBottom: '16px' }}>{fb.text}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {getSentimentBadge(fb.sentiment)}
                    {fb.resolved ? (
                      <span style={{ padding: '6px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, background: '#d4edda', color: '#155724' }}>✅ DITINDAKLANJUTI</span>
                    ) : (
                      <span style={{ padding: '6px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, background: '#fff3cd', color: '#856404' }}>⏳ PENDING</span>
                    )}
                  </div>
                </div>
              ))}
              {feedbacks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Tidak ada umpan balik yang sesuai kriteria.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- DETAIL VIEW --- */}
      {view === 'detail' && selectedFeedback && (
        <div className="page-inner" style={{ padding: '40px 20px', maxWidth: '720px', margin: '0 auto' }}>
          <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--maroon)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', marginBottom: '32px' }}>
            <ArrowLeft size={20} /> Kembali ke Daftar
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: 'var(--maroon)', margin: 0 }}>Detail Umpan Balik</h2>
            {selectedFeedback.ticket_number && (
              <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.1)' }}>
                #{selectedFeedback.ticket_number}
              </span>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <strong style={{ fontSize: '20px' }}>{selectedFeedback.school}</strong>
               <span style={{ color: 'var(--text-muted)' }}>{selectedFeedback.date}</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Pelapor: {selectedFeedback.role}</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} fill={s <= selectedFeedback.stars ? 'var(--gold)' : 'none'} color={s <= selectedFeedback.stars ? 'var(--gold)' : '#ddd'} />
              ))}
            </div>
            <div style={{ padding: '24px', background: '#fafafa', borderRadius: '16px', borderLeft: `5px solid ${selectedFeedback.sentiment === 'bad' ? 'var(--coral)' : 'var(--maroon)'}`, fontSize: '16px', lineHeight: 1.7, color: 'var(--text)' }}>
              {selectedFeedback.text}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
               {getSentimentBadge(selectedFeedback.sentiment)}
               {selectedFeedback.resolved ? (
                  <span style={{ padding: '8px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 800, background: '#d4edda', color: '#155724' }}>✅ SELESAI DITINDAKLANJUTI</span>
               ) : (
                  <span style={{ padding: '8px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 800, background: '#fff3cd', color: '#856404' }}>⏳ MENUNGGU TINDAKAN</span>
               )}
            </div>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} /> Timeline Penyelesaian
          </h3>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', marginBottom: '80px' }}>
             {selectedFeedback.replies && selectedFeedback.replies.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {selectedFeedback.replies.map((reply) => (
                    <div key={reply.id} style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '24px', position: 'relative' }}>
                       <div style={{ position: 'absolute', left: '-10px', top: '0', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--gold)', border: '3px solid #fff' }}></div>
                       <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{reply.date} — <strong style={{ color: 'var(--maroon)' }}>{reply.author}</strong></div>
                       <p style={{ fontSize: '15px', color: 'var(--text)', margin: '0 0 10px 0', lineHeight: 1.6 }}>{reply.message}</p>
                       <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: reply.status === 'Selesai' ? '#d4edda' : '#eee', color: reply.status === 'Selesai' ? '#155724' : '#666' }}>
                         STATUS: {reply.status.toUpperCase()}
                       </span>
                    </div>
                  ))}
               </div>
             ) : (
               <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada tanggapan atau tindakan perbaikan.</div>
             )}

             {isAdminPusat && (
               <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px dashed #eee' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--maroon)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tanggapan Admin</h4>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik tindakan perbaikan atau update penyelesaian..."
                    style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid #eee', minHeight: '120px', fontSize: '15px', marginBottom: '20px', outline: 'none' }}
                  ></textarea>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                     <select 
                       value={replyStatus} 
                       onChange={(e) => setReplyStatus(e.target.value as any)}
                       style={{ padding: '12px 20px', borderRadius: '12px', border: '2px solid #eee', fontWeight: 700, cursor: 'pointer' }}
                     >
                       <option value="Diproses">Sedang Diproses</option>
                       <option value="Selesai">Masalah Selesai</option>
                     </select>
                     <button className="btn btn-primary" onClick={handleSubmitReply} disabled={isReplying || !replyText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isReplying ? <Loader2 size={18} className="spinner" /> : <Send size={18} />} Kirim Update
                     </button>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* --- FORM VIEW --- */}
      {view === 'form' && (
        <div className="page-inner" style={{ padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
          <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--maroon)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', marginBottom: '32px' }}>
            <ArrowLeft size={20} /> Kembali ke Daftar
          </button>
          
          <h2 className="page-heading" style={{ fontSize: '36px', fontWeight: 900, color: 'var(--maroon)', margin: '0 0 8px 0' }}>Kirim Umpan Balik</h2>
          <p className="page-sub" style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Bagikan pengalaman Anda tentang program Makan Bergizi Gratis.</p>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 30px 70px rgba(0,0,0,0.05)' }}>
             <form onSubmit={handleSubmitFeedback}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Nama Sekolah / Instansi</label>
                  <input 
                    type="text" 
                    value={formSchool}
                    onChange={(e) => setFormSchool(e.target.value)}
                    placeholder="Misal: SDN 01 Menteng"
                    style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Peran Anda</label>
                  <select 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{ width: '100%', padding: '14px 20px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px', fontWeight: 600 }}
                  >
                    <option>Guru</option>
                    <option>Siswa</option>
                    <option>Kepala Sekolah</option>
                    <option>Orang Tua</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Rating Program</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        type="button"
                        onClick={() => setFormStars(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Star size={32} fill={s <= formStars ? 'var(--gold)' : 'none'} color={s <= formStars ? 'var(--gold)' : '#ddd'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: 'var(--maroon)', marginBottom: '8px', textTransform: 'uppercase' }}>Isi Umpan Balik</label>
                  <textarea 
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Ceritakan pengalaman Anda secara detail..."
                    style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid #eee', minHeight: '160px', fontSize: '15px' }}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {isSubmitting ? <><Loader2 size={20} className="spinner" /> Menganalisis...</> : 'Kirim Umpan Balik'}
                </button>
             </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .feedback-card:hover {
          border-color: var(--coral) !important;
          box-shadow: 0 15px 45px rgba(139,28,63,0.1) !important;
          transform: translateY(-4px);
        }
        .tab:hover {
          color: var(--maroon) !important;
          border-color: var(--maroon) !important;
        }
      `}</style>
    </div>
  );
}
