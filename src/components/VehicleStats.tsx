'use client';

import { useVehicleStore } from '@/js/store/vehicleStore';
import { Truck, Navigation, AlertTriangle, Battery } from 'lucide-react';

export default function VehicleStats() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedCity = useVehicleStore((state) => state.selectedCity);

  const filtered = selectedCity === 'Semua' 
    ? vehicles 
    : vehicles.filter(v => v.city === selectedCity);

  const stats = {
    total: filtered.length,
    moving: filtered.filter(v => v.status === 'en_route').length,
    idle: filtered.filter(v => v.status === 'idle').length,
    delayed: filtered.filter(v => v.status === 'delayed' || v.status === 'accident').length,
  };

  return (
    <div className="stats-grid">
      <div className="stat-card total">
        <div className="stat-icon"><Truck size={20} /></div>
        <div className="stat-content">
          <span className="stat-label">Total Armada</span>
          <span className="stat-value">{stats.total}</span>
        </div>
      </div>
      
      <div className="stat-card moving">
        <div className="stat-icon"><Navigation size={20} /></div>
        <div className="stat-content">
          <span className="stat-label">Sedang Jalan</span>
          <span className="stat-value">{stats.moving}</span>
        </div>
      </div>

      <div className="stat-card idle">
        <div className="stat-icon"><Battery size={20} /></div>
        <div className="stat-content">
          <span className="stat-label">Siaga / Idle</span>
          <span className="stat-value">{stats.idle}</span>
        </div>
      </div>

      <div className="stat-card alert">
        <div className="stat-icon"><AlertTriangle size={20} /></div>
        <div className="stat-content">
          <span className="stat-label">Kendala</span>
          <span className="stat-value">{stats.delayed}</span>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(139, 28, 63, 0.06);
          border: 1.5px solid transparent;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .total .stat-icon { background: rgba(139, 28, 63, 0.08); color: var(--maroon); }
        .moving .stat-icon { background: rgba(13, 110, 253, 0.08); color: #0d6efd; }
        .idle .stat-icon { background: rgba(108, 117, 125, 0.08); color: #6c757d; }
        .alert .stat-icon { background: rgba(220, 53, 69, 0.08); color: #dc3545; }

        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 20px; font-weight: 900; color: var(--text); }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
