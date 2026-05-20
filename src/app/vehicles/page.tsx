'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, MapPinOff, Truck, AlertTriangle, Clock, Wrench, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/js/store/authStore';
import { useVehicleStore, Vehicle, VehicleStatus } from '@/js/store/vehicleStore';
import { VEHICLE_STATUS_META } from '@/js/services/VehicleService';

import VehicleStats from '@/src/components/VehicleStats';
import RegionFilter from '@/src/components/RegionFilter';

const VehicleMap = dynamic(() => import('@/src/components/VehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="vehicle-map-placeholder">
      <div className="map-spinner" />
      <p>Memuat komponen peta...</p>
    </div>
  ),
});

const STATUS_ICONS: Record<VehicleStatus, React.ReactNode> = {
  idle:        <Clock size={14} />,
  en_route:    <Truck size={14} />,
  loading:     <MapPin size={14} />,
  unloading:   <MapPin size={14} />,
  delayed:     <AlertTriangle size={14} />,
  accident:    <AlertTriangle size={14} />,
  maintenance: <Wrench size={14} />,
  off_route:   <MapPinOff size={14} />,
  offline:     <WifiOff size={14} />,
};

export default function VehiclesPage() {
  const { currentUser } = useAuthStore();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedCity = useVehicleStore((state) => state.selectedCity);
  const { loadVehicles, subscribeRealtime } = useVehicleStore((state) => state.actions);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    loadVehicles();
    const unsubscribe = subscribeRealtime();
    return unsubscribe;
  }, [currentUser, loadVehicles, subscribeRealtime]);

  // --- ATOMIC SELECTION RESET: Keep UI in sync with fleet data ---
  useEffect(() => {
    if (selectedVehicle && !vehicles.some(v => v.id === selectedVehicle.id)) {
      setSelectedVehicle(null);
    }
  }, [vehicles, selectedVehicle]);

  // Filter vehicles based on selected city
  const filteredList = useMemo(() => {
    return selectedCity === 'Semua' 
      ? vehicles 
      : vehicles.filter(v => v.city === selectedCity);
  }, [vehicles, selectedCity]);

  // Auth guard: redirect or show message if not logged in
  if (!currentUser) {
    return (
      <div style={{ background: 'var(--cream)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Truck size={64} color="var(--maroon)" style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'var(--font-playfair)', color: 'var(--maroon)', marginBottom: '8px' }}>Silakan Login</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Anda perlu login untuk mengakses Vehicle Tracker.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-page">
      {/* Header */}
      <div className="vehicles-header">
        <div className="vehicles-header-text">
          <h1 className="vehicles-title">
            <Truck size={32} /> Vehicle Tracker
          </h1>
          <p className="vehicles-subtitle">
            Pantau posisi dan status kendaraan distribusi MBG secara real-time.
          </p>
        </div>
      </div>

      {/* Stats & Filtering */}
      <div className="vehicles-control-panel">
        <VehicleStats />
        <RegionFilter />
      </div>

      {/* Main content: Map + sidebar */}
      <div className="vehicles-content">
        <div className="vehicles-map-section">
          <VehicleMap 
            onVehicleSelect={setSelectedVehicle} 
            selectedVehicle={selectedVehicle}
          />
        </div>

        {/* Sidebar: vehicle list */}
        <aside className="vehicles-sidebar">
          <h3 className="sidebar-title">Daftar Kendaraan</h3>
          <div className="vehicle-list">
            {filteredList.length === 0 ? (
              <div className="vehicle-list-empty">
                <Truck size={32} style={{ opacity: 0.2 }} />
                <p>Belum ada data kendaraan di {selectedCity}.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Klik &quot;Demo Unit&quot; pada toolbar peta untuk memulai.
                </p>
              </div>
            ) : (
              filteredList.map((v) => (
                <div
                  key={v.id}
                  className={`vehicle-card ${selectedVehicle?.id === v.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicle(v)}
                >
                  <div className="vehicle-card-header">
                    <div>
                      <span className="vehicle-plate">{v.license_plate}</span>
                      <span style={{ 
                        fontSize: '10px', 
                        background: '#f0f0f0', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        marginLeft: '8px',
                        color: '#666',
                        fontWeight: 600
                      }}>{v.city}</span>
                    </div>
                    <span
                      className="vehicle-status-dot"
                      style={{ background: VEHICLE_STATUS_META[v.status].color }}
                      title={VEHICLE_STATUS_META[v.status].label}
                    />
                  </div>
                  <div className="vehicle-card-body">
                    <span className="vehicle-driver">{v.driver_name ?? '-'}</span>
                    <span className="vehicle-status-tag" style={{ color: VEHICLE_STATUS_META[v.status].color }}>
                      {STATUS_ICONS[v.status]} {VEHICLE_STATUS_META[v.status].label}
                    </span>
                  </div>
                  <div className="vehicle-card-time">
                    {new Date(v.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .vehicles-page {
          background: var(--cream);
          min-height: 100vh;
          padding: 0 0 60px;
        }

        /* --- Header --- */
        .vehicles-header {
          padding: 40px 40px 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .vehicles-title {
          font-family: var(--font-playfair);
          font-size: 36px;
          font-weight: 900;
          color: var(--maroon);
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 8px;
        }
        .vehicles-subtitle {
          font-size: 15px;
          color: var(--text-muted);
          margin: 0;
        }

        .vehicles-control-panel {
          padding: 0 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .vehicles-control-panel :global(.stats-grid) {
          margin-bottom: 16px;
        }

        .vehicles-control-panel :global(.city-filter-container) {
          margin-bottom: 20px;
        }

        /* --- Status bar --- */
        .vehicles-status-bar {
          display: flex;
          gap: 8px;
          padding: 0 40px 20px;
          max-width: 1400px;
          margin: 0 auto;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .vehicles-status-bar::-webkit-scrollbar { display: none; }

        .status-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: #fff;
          border: 1.5px solid rgba(139,28,63,0.08);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.2s;
          cursor: default;
        }
        .status-chip.active {
          border-color: var(--chip-color);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .chip-label { color: var(--text); }
        .chip-count {
          background: rgba(139,28,63,0.06);
          padding: 1px 7px;
          border-radius: 10px;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* --- Main content --- */
        .vehicles-content {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          padding: 0 40px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 560px;
        }

        /* --- Map section --- */
        .vehicles-map-section {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(139,28,63,0.08);
          min-height: 560px;
        }

        /* --- Sidebar --- */
        .vehicles-sidebar {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 24px rgba(139,28,63,0.08);
          overflow-y: auto;
          max-height: 600px;
        }
        .sidebar-title {
          font-family: var(--font-playfair);
          font-size: 18px;
          font-weight: 900;
          color: var(--maroon);
          margin: 0 0 16px;
        }

        .vehicle-list { display: flex; flex-direction: column; gap: 8px; }
        .vehicle-list-empty {
          text-align: center;
          padding: 40px 16px;
          color: var(--text-muted);
          font-size: 13px;
        }

        .vehicle-card {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(139,28,63,0.06);
          cursor: pointer;
          transition: all 0.2s;
        }
        .vehicle-card:hover {
          border-color: rgba(139,28,63,0.15);
          box-shadow: 0 2px 8px rgba(139,28,63,0.06);
        }
        .vehicle-card.selected {
          border-color: var(--maroon);
          background: rgba(139,28,63,0.03);
        }
        .vehicle-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .vehicle-plate {
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          letter-spacing: 0.5px;
        }
        .vehicle-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .vehicle-card-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .vehicle-driver {
          font-size: 12px;
          color: var(--text-muted);
        }
        .vehicle-status-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        .vehicle-card-time {
          font-size: 11px;
          color: var(--text-muted);
          opacity: 0.6;
        }

        /* --- Map component inner styles --- */
        :global(.vehicle-map-wrapper) {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        :global(.vehicle-map-container) {
          flex: 1;
          min-height: 480px;
        }
        :global(.vehicle-map-controls) {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(255,251,245,0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(139,28,63,0.06);
        }
        :global(.vehicle-count-badge) {
          margin-left: auto;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: rgba(139,28,63,0.06);
          padding: 4px 12px;
          border-radius: 12px;
        }
        :global(.vehicle-map-loading),
        :global(.vehicle-map-placeholder) {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 480px;
          color: var(--text-muted);
          font-size: 14px;
          gap: 12px;
        }
        :global(.vehicle-map-error) {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 480px;
          padding: 40px;
          text-align: center;
          color: #721C24;
          font-size: 14px;
        }
        :global(.map-spinner) {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(139,28,63,0.15);
          border-top-color: var(--maroon);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Info Window */
        :global(.vehicle-info-window) {
          font-family: 'DM Sans', sans-serif;
          min-width: 200px;
        }
        :global(.info-header) {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          margin-bottom: 8px;
        }
        :global(.info-icon) { font-size: 18px; }
        :global(.info-body p) {
          margin: 4px 0;
          font-size: 13px;
          color: #333;
        }
        :global(.info-label) {
          font-weight: 600;
          color: #555;
        }
        :global(.info-status-badge) {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
        }
        :global(.info-desc) {
          font-style: italic;
          color: var(--text-muted) !important;
          font-size: 12px !important;
        }
        :global(.info-time) {
          font-size: 11px !important;
          color: #999 !important;
          margin-top: 6px !important;
        }

        /* --- Responsive --- */
        @media (max-width: 900px) {
          .vehicles-header { padding: 24px 20px 16px; }
          .vehicles-title { font-size: 26px; }
          .vehicles-control-panel { padding: 0 20px; }
          .vehicles-status-bar { padding: 0 20px 16px; }
          .vehicles-content {
            grid-template-columns: 1fr;
            padding: 0 20px;
          }
          .vehicles-sidebar {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
