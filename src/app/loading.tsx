

/**
 * Global Loading Component
 * Uses standard CSS animations from global.css for maximum compatibility.
 */
export default function Loading() {
  return (
    <div style={{ 
      background: 'var(--cream)', 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '24px'
    }}>
      <div style={{ position: 'relative' }}>
         <div className="spinner" style={{ 
           width: '64px', 
           height: '64px', 
           borderWidth: '4px',
           borderColor: 'rgba(139,28,63,0.1)', 
           borderTopColor: 'var(--maroon)'
         }}></div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
         <h2 style={{ 
           fontFamily: 'var(--font-playfair)', 
           fontSize: '24px', 
           fontWeight: 800, 
           color: 'var(--maroon)', 
           marginBottom: '8px' 
         }}>Sedang Menyiapkan Konten</h2>
         <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>Mohon tunggu sejenak...</p>
      </div>
    </div>
  );
}
