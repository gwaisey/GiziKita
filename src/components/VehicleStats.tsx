'use client';

import { useMemo, useState, useEffect } from 'react';
import { useVehicleStore, Vehicle } from '@/js/store/vehicleStore';
import { Truck, Navigation, Battery, MapPin, X, Search, Clock, ExternalLink } from 'lucide-react';
import { computeFleetStats, STATUS_TO_CATEGORY, VehicleStatCategory } from '@/js/utils/vehicleStatus';
import { VEHICLE_STATUS_META } from '@/js/services/VehicleService';

interface VehicleStatsProps {
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export default function VehicleStats({ onVehicleSelect }: VehicleStatsProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const selectedCity = useVehicleStore((state) => state.selectedCity);
  const selectedCategory = useVehicleStore((state) => state.selectedCategory);
  const { setSelectedCategory } = useVehicleStore((state) => state.actions);

  const [modalCategory, setModalCategory] = useState<VehicleStatCategory | 'all' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter vehicles by city
  const cityVehicles = useMemo(() => {
    return selectedCity === 'Semua' 
      ? vehicles 
      : vehicles.filter(v => v.city === selectedCity);
  }, [vehicles, selectedCity]);

  // Compute summary stats
  const stats = useMemo(() => computeFleetStats(cityVehicles), [cityVehicles]);

  // Filter vehicles for modal view based on selected category & search query
  const modalVehicles = useMemo(() => {
    if (!modalCategory) return [];
    let list = cityVehicles;
    if (modalCategory !== 'all') {
      list = list.filter(v => STATUS_TO_CATEGORY[v.status] === modalCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(v => 
        (v.license_plate && v.license_plate.toLowerCase().includes(q)) ||
        (v.driver_name && v.driver_name.toLowerCase().includes(q)) ||
        (v.destination_school_name && v.destination_school_name.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q))
      );
    }
    return list;
  }, [cityVehicles, modalCategory, searchTerm]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalCategory(null);
    };
    if (modalCategory) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalCategory]);

  const handleCardClick = (cat: VehicleStatCategory | 'all') => {
    // Toggle global filter
    setSelectedCategory(selectedCategory === cat ? 'all' : cat);
    // Open detailed data modal
    setModalCategory(cat);
    setSearchTerm('');
  };

  const getCategoryMeta = (cat: VehicleStatCategory | 'all') => {
    switch (cat) {
      case 'moving':
        return {
          title: 'Armada Sedang Jalan',
          desc: 'Kendaraan yang saat ini dalam perjalanan aktif mengantar makanan bergizi ke sekolah.',
          count: stats.moving,
          color: '#0d6efd',
          icon: <Navigation size={22} />
        };
      case 'unloading':
        return {
          title: 'Armada Menurunkan Makanan',
          desc: 'Kendaraan yang telah tiba di sekolah penerima dan sedang dalam proses bongkar muat.',
          count: stats.unloading,
          color: '#2e7d32',
          icon: <MapPin size={22} />
        };
      case 'idle':
        return {
          title: 'Armada Siaga / Di Gudang SPPG',
          desc: 'Kendaraan yang standby di pangkalan logistik SPPG dan siap diberangkatkan.',
          count: stats.idle,
          color: '#6c757d',
          icon: <Battery size={22} />
        };
      case 'all':
      default:
        return {
          title: 'Seluruh Armada Terdaftar',
          desc: `Total seluruh unit kendaraan operasional pada wilayah ${selectedCity}.`,
          count: stats.total,
          color: 'var(--maroon)',
          icon: <Truck size={22} />
        };
    }
  };

  const currentModalMeta = modalCategory ? getCategoryMeta(modalCategory) : null;

  return (
    <>
      <div className="stats-grid">
        {/* Total Armada */}
        <div 
          className={`stat-card total ${selectedCategory === 'all' && modalCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCardClick('all')}
          role="button"
          tabIndex={0}
          title="Klik untuk melihat seluruh data armada"
        >
          <div className="stat-icon"><Truck size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Armada</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-action-hint">Lihat Data &rarr;</span>
          </div>
        </div>
        
        {/* Sedang Jalan */}
        <div 
          className={`stat-card moving ${selectedCategory === 'moving' ? 'active' : ''}`}
          onClick={() => handleCardClick('moving')}
          role="button"
          tabIndex={0}
          title="Klik untuk melihat armada yang sedang berjalan"
        >
          <div className="stat-icon"><Navigation size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Sedang Jalan</span>
            <span className="stat-value">{stats.moving}</span>
            <span className="stat-action-hint">Lihat Data &rarr;</span>
          </div>
        </div>

        {/* Siaga / Idle */}
        <div 
          className={`stat-card idle ${selectedCategory === 'idle' ? 'active' : ''}`}
          onClick={() => handleCardClick('idle')}
          role="button"
          tabIndex={0}
          title="Klik untuk melihat armada yang sedang siaga"
        >
          <div className="stat-icon"><Battery size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Siaga / Idle</span>
            <span className="stat-value">{stats.idle}</span>
            <span className="stat-action-hint">Lihat Data &rarr;</span>
          </div>
        </div>

        {/* Menurunkan */}
        <div 
          className={`stat-card unloading ${selectedCategory === 'unloading' ? 'active' : ''}`}
          onClick={() => handleCardClick('unloading')}
          role="button"
          tabIndex={0}
          title="Klik untuk melihat armada yang sudah tiba dan menurunkan"
        >
          <div className="stat-icon"><MapPin size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Menurunkan</span>
            <span className="stat-value">{stats.unloading}</span>
            <span className="stat-action-hint">Lihat Data &rarr;</span>
          </div>
        </div>
      </div>

      {/* Detail Modal Dialog */}
      {modalCategory && currentModalMeta && (
        <div className="modal-backdrop" onClick={() => setModalCategory(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon-badge" style={{ color: currentModalMeta.color, background: `${currentModalMeta.color}15` }}>
                  {currentModalMeta.icon}
                </div>
                <div>
                  <h3 className="modal-title">
                    {currentModalMeta.title}
                    <span className="modal-count-badge" style={{ background: currentModalMeta.color }}>
                      {currentModalMeta.count} Unit
                    </span>
                  </h3>
                  <p className="modal-subtitle">{currentModalMeta.desc}</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setModalCategory(null)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="modal-search-bar">
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Cari berdasarkan plat nomor, driver, sekolah tujuan, atau kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchTerm('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Vehicles List Body */}
            <div className="modal-body">
              {modalVehicles.length === 0 ? (
                <div className="modal-empty-state">
                  <Truck size={40} style={{ opacity: 0.25, marginBottom: 8 }} />
                  <p style={{ fontWeight: 700, margin: '4px 0', color: 'var(--text)' }}>
                    Tidak ada kendaraan yang sesuai
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    {searchTerm ? 'Coba gunakan kata kunci pencarian yang lain.' : `Belum ada armada berstatus ini di ${selectedCity}.`}
                  </p>
                </div>
              ) : (
                <div className="modal-vehicles-grid">
                  {modalVehicles.map((v) => {
                    const statusMeta = VEHICLE_STATUS_META[v.status] || { label: v.status, color: '#666' };
                    const updatedTime = v.updated_at
                      ? new Date(v.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '-';

                    return (
                      <div key={v.id} className="vehicle-detail-card">
                        <div className="card-top">
                          <div className="plate-and-city">
                            <span className="plate-badge">{v.license_plate}</span>
                            <span className="city-pill">{v.city || 'Indonesia'}</span>
                          </div>
                          <span 
                            className="status-pill"
                            style={{ 
                              color: statusMeta.color, 
                              background: `${statusMeta.color}15`,
                              borderColor: `${statusMeta.color}30` 
                            }}
                          >
                            <span className="dot" style={{ background: statusMeta.color }} />
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="card-specs">
                          <div className="spec-item">
                            <span className="spec-label">Pengemudi:</span>
                            <span className="spec-val">{v.driver_name || 'Driver belum diisi'}</span>
                          </div>
                          <div className="spec-item">
                            <span className="spec-label">Sekolah Tujuan:</span>
                            <span className="spec-val highlight">
                              {v.destination_school_name || 'Pangkalan SPPG (Idle)'}
                            </span>
                          </div>
                          <div className="spec-item">
                            <span className="spec-label">Posisi Koordinat:</span>
                            <span className="spec-val mono">
                              {Number.isFinite(v.last_lat) && Number.isFinite(v.last_lng)
                                ? `${v.last_lat?.toFixed(4)}, ${v.last_lng?.toFixed(4)}`
                                : '-'}
                            </span>
                          </div>
                          <div className="spec-item">
                            <span className="spec-label">Pembaruan:</span>
                            <span className="spec-val clock">
                              <Clock size={12} style={{ marginRight: 4 }} /> {updatedTime}
                            </span>
                          </div>
                        </div>

                        <div className="card-footer">
                          <button 
                            type="button" 
                            className="track-map-btn"
                            onClick={() => {
                              onVehicleSelect?.(v);
                              setModalCategory(null);
                              // Smooth scroll to map section
                              document.querySelector('.vehicles-map-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <ExternalLink size={14} /> Lacak Rute di Peta
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="footer-info">
                Menampilkan <strong>{modalVehicles.length}</strong> dari total {currentModalMeta.count} unit di kategori ini.
              </span>
              <button 
                type="button" 
                className="btn-close-modal" 
                onClick={() => setModalCategory(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(139, 28, 63, 0.12);
          border-color: rgba(139, 28, 63, 0.2);
        }

        .stat-card:active {
          transform: translateY(-1px);
        }

        .stat-card.active {
          border-color: var(--maroon);
          background: #fffdf9;
          box-shadow: 0 8px 26px rgba(139, 28, 63, 0.16);
        }

        .stat-card.moving.active {
          border-color: #0d6efd;
          box-shadow: 0 8px 26px rgba(13, 110, 253, 0.18);
        }

        .stat-card.idle.active {
          border-color: #6c757d;
          box-shadow: 0 8px 26px rgba(108, 117, 125, 0.18);
        }

        .stat-card.unloading.active {
          border-color: #2e7d32;
          box-shadow: 0 8px 26px rgba(46, 125, 50, 0.18);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.08);
        }

        .total .stat-icon { background: rgba(139, 28, 63, 0.08); color: var(--maroon); }
        .moving .stat-icon { background: rgba(13, 110, 253, 0.08); color: #0d6efd; }
        .idle .stat-icon { background: rgba(108, 117, 125, 0.08); color: #6c757d; }
        .unloading .stat-icon { background: rgba(46, 125, 50, 0.08); color: #2e7d32; }

        .stat-content { 
          display: flex; 
          flex-direction: column; 
          flex: 1; 
        }

        .stat-label { 
          font-size: 11px; 
          font-weight: 700; 
          color: var(--text-muted); 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }

        .stat-value { 
          font-size: 20px; 
          font-weight: 900; 
          color: var(--text); 
          line-height: 1.2;
          margin-top: 2px;
        }

        .stat-action-hint {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0.7;
          margin-top: 4px;
          display: inline-block;
          transition: opacity 0.2s, color 0.2s;
        }

        .stat-card:hover .stat-action-hint {
          opacity: 1;
          color: var(--maroon);
        }

        .stat-card.moving:hover .stat-action-hint { color: #0d6efd; }
        .stat-card.idle:hover .stat-action-hint { color: #6c757d; }
        .stat-card.unloading:hover .stat-action-hint { color: #2e7d32; }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(44, 24, 16, 0.5);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          width: 100%;
          max-width: 820px;
          max-height: 85vh;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(139, 28, 63, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .modal-icon-badge {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--maroon);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-count-badge {
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }

        .modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .modal-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(139, 28, 63, 0.06);
          color: var(--maroon);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(139, 28, 63, 0.14);
          transform: scale(1.05);
        }

        .modal-search-bar {
          padding: 12px 24px;
          background: #fbf9f6;
          border-bottom: 1px solid rgba(139, 28, 63, 0.06);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-search-bar input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 13px;
          color: var(--text);
          outline: none;
        }

        .search-clear-btn {
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-empty-state {
          padding: 48px 24px;
          text-align: center;
          color: var(--text-muted);
        }

        .modal-vehicles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 14px;
        }

        .vehicle-detail-card {
          background: #ffffff;
          border: 1px solid rgba(139, 28, 63, 0.1);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .vehicle-detail-card:hover {
          border-color: rgba(139, 28, 63, 0.25);
          box-shadow: 0 6px 18px rgba(139, 28, 63, 0.08);
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .plate-and-city {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .plate-badge {
          font-weight: 900;
          font-size: 14px;
          color: var(--maroon);
          letter-spacing: 0.5px;
        }

        .city-pill {
          font-size: 10px;
          font-weight: 700;
          background: rgba(139, 28, 63, 0.06);
          color: var(--maroon);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .status-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid transparent;
        }

        .status-pill .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .card-specs {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          background: #fbf9f6;
          padding: 10px 12px;
          border-radius: 10px;
        }

        .spec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .spec-label {
          color: var(--text-muted);
          font-weight: 600;
        }

        .spec-val {
          font-weight: 700;
          color: var(--text);
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 60%;
        }

        .spec-val.highlight {
          color: var(--maroon);
        }

        .spec-val.mono {
          font-family: monospace;
          font-size: 11px;
        }

        .spec-val.clock {
          display: flex;
          align-items: center;
        }

        .card-footer {
          margin-top: 2px;
        }

        .track-map-btn {
          width: 100%;
          padding: 8px 12px;
          background: var(--maroon);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .track-map-btn:hover {
          background: #731734;
          transform: translateY(-1px);
        }

        .modal-footer {
          padding: 14px 24px;
          border-top: 1px solid rgba(139, 28, 63, 0.08);
          background: #fbf9f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-info {
          font-size: 12px;
          color: var(--text-muted);
        }

        .btn-close-modal {
          padding: 7px 16px;
          background: #ffffff;
          border: 1px solid rgba(139, 28, 63, 0.2);
          border-radius: 8px;
          color: var(--maroon);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-close-modal:hover {
          background: #f8f0f2;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 680px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .modal-vehicles-grid { grid-template-columns: 1fr; }
          .modal-card { max-height: 92vh; }
        }
      `}</style>
    </>
  );
}
