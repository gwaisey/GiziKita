'use client';


import { useUIStore } from '@/js/store/uiStore';

export default function Toast() {
  const { toast } = useUIStore();

  if (!toast.visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(139, 28, 63, 0.95)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '50px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      fontFamily: 'var(--font-dm-sans)',
      fontSize: '14px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }}>
      <span style={{ fontSize: '18px' }}>✨</span>
      {toast.message}
      
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
