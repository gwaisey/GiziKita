'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, BookOpen, Sparkles, Trash2, Send, Loader2 } from 'lucide-react';
import AIService from '@/js/services/AIService';
import TourService from '@/js/services/TourService';

export default function HelpPage() {
  const [chatHistory, setChatHistory] = useState(AIService.helpHistory);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(AIService.isHelpLoading);
  const [loadingStatus, setLoadingStatus] = useState(AIService.helpLoadingStatus);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with AIService
  useEffect(() => {
    AIService.onHelpUpdate = () => {
      setChatHistory([...AIService.helpHistory]);
      setIsLoading(AIService.isHelpLoading);
      setLoadingStatus(AIService.helpLoadingStatus);
    };

    return () => {
      AIService.onHelpUpdate = null;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const msg = inputValue.trim();
    setInputValue('');
    await AIService.askHelp(msg);
  };

  const handleClearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan?')) {
      AIService.clearHelpHistory();
    }
  };

  const startTutorial = () => {
    TourService.start(true);
  };

  const canAccessTutorial = TourService.canAccessTutorial();
  const tutorialLabel = TourService.getTutorialAudienceLabel();

  return (
    <div style={{ background: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorations */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '-20px', bottom: '80px', width: '240px', opacity: 0.16 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>
      <svg className="deco-flower" style={{ position: 'absolute', left: '-20px', top: '40px', width: '180px', opacity: 0.12 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(45)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(135)" fill="#8B1C3F"/><circle r="30" fill="#FFF0C0"/><circle r="16" fill="#F4C662"/>
        </g>
      </svg>

      <div className="page-inner" style={{ flex: 1, padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 className="page-heading" style={{ fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 900, color: 'var(--maroon)', lineHeight: 1.1, marginBottom: '40px' }}>
          Untuk bantuan,<br/>hubungi Kami:
        </h1>

        <div style={{ maxWidth: '620px', marginBottom: '48px' }}>
          <ContactItem icon={<Mail size={22} />} label="Email" value="support@gizikita.id" />
          <ContactItem icon={<Phone size={22} />} label="Nomor Telepon" value="0812-3456-7890" />
          <ContactItem icon={<MapPin size={22} />} label="Alamat Kami" value="Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 10110" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(139,28,63,0.1)', margin: '48px 0' }} />

        {canAccessTutorial && (
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', marginBottom: '8px', color: 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={24} /> Panduan Aplikasi
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '18px' }}>{tutorialLabel}</p>
            <button className="btn btn-outline" onClick={startTutorial} style={{ borderColor: 'var(--maroon)', color: 'var(--maroon)', borderRadius: '12px', padding: '12px 24px' }}>
              Lihat Tutorial Ulang
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', maxWidth: '680px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', marginBottom: '8px', color: 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={24} /> Asisten Gizi Pintar
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tanyakan tentang program MBG, transparansi data, atau cara pendaftaran.</p>
          </div>
          {chatHistory.length > 1 && (
            <button onClick={handleClearHistory} style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px', borderRadius: '8px' }}>
              <Trash2 size={16} /> Hapus Riwayat
            </button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 60px rgba(139,28,63,0.08)', maxWidth: '680px', border: '1px solid rgba(139,28,63,0.05)' }}>
          <div id="help-chat-messages" style={{ minHeight: '120px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            {chatHistory.map((msg, idx) => (
              <ChatMessage key={idx} role={msg.role} content={msg.content} />
            ))}
            
            {isLoading && (
              <div style={{ background: 'var(--peach-card)', borderRadius: '10px 10px 10px 2px', padding: '12px 16px', fontSize: '14px', maxWidth: '80%', alignSelf: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Loader2 size={16} className="spinner" />
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{loadingStatus || 'GiziBot sedang berpikir...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Tulis pertanyaan Anda..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              style={{ flex: 1, padding: '12px 20px', border: '1.5px solid #eee', borderRadius: '30px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              style={{ borderRadius: '30px', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isLoading ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function ContactItem({ icon, label, value }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 0', borderBottom: '1px solid rgba(139,28,63,0.1)' }}>
      <div style={{ color: 'var(--maroon)', marginTop: '4px' }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--coral)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function ChatMessage({ role, content }: any) {
  const isUser = role === 'user';
  
  // Basic markdown-like parsing for bold text
  const formattedContent = content.split('\n').map((line: string, i: number) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    );
  });

  return (
    <div style={{ 
      background: isUser ? 'var(--maroon)' : 'var(--peach-card)', 
      color: isUser ? '#fff' : 'var(--text)',
      borderRadius: isUser ? '18px 18px 2px 18px' : '18px 18px 18px 2px', 
      padding: '12px 18px', 
      fontSize: '14px', 
      maxWidth: '85%', 
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      lineHeight: 1.6,
      boxShadow: isUser ? '0 4px 12px rgba(139,28,63,0.15)' : 'none'
    }}>
      {formattedContent}
    </div>
  );
}
