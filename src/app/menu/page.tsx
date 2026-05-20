'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import MenuService, { MenuData } from '@/js/services/MenuService';
import AIService from '@/js/services/AIService';

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuData>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenu(MenuService.getMenu());
  }, []);

  const handleMenuClick = async (day: string, items: string[]) => {
    setSelectedDay(day);
    setIsLoadingAI(true);
    setAiAnalysis(null);

    // Scroll to analysis section
    if (analysisRef.current) {
      analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      const result = await AIService.getMenuAnalysis(day, items);
      // Give a small delay to make the AI "thinking" feel real and premium
      setTimeout(() => {
        setAiAnalysis(result);
        setIsLoadingAI(false);
      }, 800);
    } catch (err) {
      setAiAnalysis("Maaf, asisten AI sedang sibuk. Namun secara umum, menu ini telah disesuaikan dengan standar gizi nasional.");
      setIsLoadingAI(false);
    }
  };

  return (
    <div style={{ background: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Decorations */}
      <svg className="deco-flower" style={{ position: 'absolute', right: '-20px', top: '40px', width: '200px', opacity: 0.15 }} viewBox="0 0 200 200">
        <g transform="translate(100,100)">
          <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
        </g>
      </svg>

      <div className="page-inner wide" style={{ flex: 1, padding: '40px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 className="page-heading" style={{ fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 900, color: 'var(--maroon)', lineHeight: 1.1, marginBottom: '16px' }}>
          Intip Menu Makanan Sehat<br/>Minggu Ini!
        </h1>
        <p className="page-sub" style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Klik pada kartu hari untuk melihat penjelasan manfaat gizi dari AI.
        </p>

        <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '60px' }}>
          {Object.entries(menu).map(([day, items]) => (
            <div 
              key={day} 
              className={`menu-day-card ${selectedDay === day ? 'selected' : ''}`}
              onClick={() => handleMenuClick(day, items)}
              style={{
                background: 'var(--peach-card)',
                borderRadius: '14px',
                padding: '24px',
                border: '2px solid transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                borderColor: selectedDay === day ? 'var(--maroon)' : 'transparent',
                boxShadow: selectedDay === day ? '0 4px 18px rgba(139,28,63,0.18)' : 'none'
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: 'var(--coral)', marginBottom: '16px', textAlign: 'center' }}>{day}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: 'var(--text)', padding: '6px 0', borderBottom: '1px dotted rgba(139,28,63,0.15)', textAlign: 'center' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div ref={analysisRef} style={{ display: selectedDay ? 'block' : 'none', maxWidth: '780px', marginBottom: '80px' }}>
          <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', marginBottom: '16px', color: 'var(--maroon)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={24} /> Manfaat Gizi — <span>{selectedDay}</span>
          </h3>
          <div className="ai-box" style={{ background: '#fff', borderRadius: '18px', padding: '32px', boxShadow: '0 10px 40px rgba(139,28,63,0.08)', border: '1px solid rgba(139,28,63,0.05)' }}>
            <div className="ai-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
              <Sparkles size={16} />
              Analisis Gizi Pintar
            </div>
            
            <div id="menu-ai-content">
              {isLoadingAI ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '15px', padding: '20px 0' }}>
                  <Loader2 className="spinner" size={20} />
                  <span>Asisten AI sedang menganalisis nutrisi...</span>
                </div>
              ) : (
                <p style={{ lineHeight: 1.8, fontSize: '15px', color: 'var(--text)', margin: 0 }}>
                  {aiAnalysis?.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .menu-day-card:hover { 
          border-color: var(--coral) !important; 
          box-shadow: 0 4px 18px rgba(232,103,58,0.18) !important;
          transform: translateY(-4px);
        }
        .menu-day-card li:last-child { border-bottom: none !important; }
      `}</style>
    </div>
  );
}
