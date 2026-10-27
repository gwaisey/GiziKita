'use client';

import { useMemo } from 'react';
import { useVehicleStore } from '@/js/store/vehicleStore';
import { Truck, Navigation, Battery, MapPin } from 'lucide-react';
import { computeFleetStats } from '@/js/utils/vehicleStatus';

export default function VehicleStats() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedCity = useVehicleStore((state) => state.selectedCity);

  const filtered = useMemo(() => {
    return selectedCity === 'Semua' 
      ? vehicles 
      : vehicles.filter(v => v.city === selectedCity);
  }, [vehicles, selectedCity]);

  const stats = useMemo(() => computeFleetStats(filtered), [filtered]);

  return (
    <div className="stats-grid">
      <div 
        className="stat-card total"
        title={stats.other > 0 ? `${stats.other} armada berstatus khusus / non-operasional` : undefined}
      >
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

      <div className="stat-card unloading">
        <div className="stat-icon"><MapPin size={20} /></div>
        <div className="stat-content">
          <span className="stat-label">Menurunkan</span>
          <span className="stat-value">{stats.unloading}</span>
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
        .unloading .stat-icon { background: rgba(46, 125, 50, 0.08); color: #2e7d32; }

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

