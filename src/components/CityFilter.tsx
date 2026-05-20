'use client';

import { useVehicleStore } from '@/js/store/vehicleStore';
import { CITIES_CONFIG } from '@/js/services/VehicleService';
import { MapPin } from 'lucide-react';

export default function CityFilter() {
  const selectedCity = useVehicleStore((state) => state.selectedCity);
  const { setSelectedCity } = useVehicleStore((state) => state.actions);

  return (
    <div className="city-filter-container">
      <div className="filter-header">
        <div className="filter-title">
          <MapPin size={16} />
          <span>Filter Wilayah</span>
        </div>
        <span className="filter-current">{selectedCity}</span>
      </div>
      <div className="filter-scroll-shell">
        <div className="filter-chips" role="list" aria-label="Filter wilayah kendaraan">
          <button
            className={`filter-chip pinned ${selectedCity === 'Semua' ? 'active' : ''}`}
            onClick={() => setSelectedCity('Semua')}
            type="button"
          >
            Semua
          </button>
          {CITIES_CONFIG.map((city) => (
            <button
              key={city.name}
              className={`filter-chip ${selectedCity === city.name ? 'active' : ''}`}
              onClick={() => setSelectedCity(city.name)}
              type="button"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .city-filter-container {
          background: #fff;
          border-radius: 16px;
          padding: 14px 16px 12px;
          border: 1px solid rgba(139, 28, 63, 0.08);
          border-top: 3px solid var(--gold);
          box-shadow: 0 8px 22px rgba(139, 28, 63, 0.05);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-playfair);
          font-weight: 800;
          font-size: 14px;
          color: var(--maroon);
          min-width: 0;
        }

        .filter-current {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(139, 28, 63, 0.07);
          color: var(--maroon);
          font-size: 12px;
          font-weight: 800;
        }

        .filter-scroll-shell {
          position: relative;
          overflow: hidden;
          margin: 0;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 2px 0 8px 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 28, 63, 0.28) transparent;
          scroll-snap-type: x proximity;
          scroll-behavior: smooth;
        }

        .filter-chips::-webkit-scrollbar {
          height: 4px;
        }

        .filter-chips::-webkit-scrollbar-track {
          background: transparent;
        }

        .filter-chips::-webkit-scrollbar-thumb {
          background: rgba(139, 28, 63, 0.2);
          border-radius: 2px;
        }

        .filter-chip {
          flex: 0 0 auto;
          scroll-snap-align: start;
          min-height: 34px;
          padding: 0 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          background: var(--cream);
          color: var(--text-muted);
          border: 1px solid rgba(139, 28, 63, 0.08);
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }

        .filter-chip.pinned {
          position: static;
          z-index: 1;
          box-shadow: none;
        }

        .filter-chip:hover {
          background: rgba(139, 28, 63, 0.05);
          color: var(--maroon);
        }

        .filter-chip.active {
          background: var(--maroon);
          color: #fff;
          border-color: var(--maroon);
          box-shadow: 0 4px 10px rgba(139, 28, 63, 0.18);
        }

        @media (max-width: 700px) {
          .filter-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .filter-current {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
