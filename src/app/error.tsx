'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div style={{ 
      background: 'var(--cream)', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      textAlign: 'center' 
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '60px 40px', 
        borderRadius: '32px', 
        boxShadow: '0 30px 80px rgba(139,28,63,0.1)', 
        maxWidth: '500px' 
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'rgba(232,103,58,0.1)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          color: 'var(--coral)'
        }}>
          <AlertCircle size={48} />
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-playfair)', 
          fontSize: '32px', 
          fontWeight: 900, 
          color: 'var(--maroon)', 
          marginBottom: '16px' 
        }}>Terjadi Gangguan Sistem</h1>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '16px', 
          lineHeight: 1.6, 
          marginBottom: '32px' 
        }}>
          Maaf atas ketidaknyamanannya. Sistem kami mengalami sedikit kendala teknis. Tim kami telah menerima laporan ini.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => reset()}
            style={{ padding: '14px 28px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCcw size={18} /> Coba Lagi
          </button>
          <a 
            href="/"
            style={{ 
              padding: '14px 28px', 
              borderRadius: '12px', 
              border: '1px solid #ddd', 
              color: 'var(--text-muted)', 
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Home size={18} /> Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
