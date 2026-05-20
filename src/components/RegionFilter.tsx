'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useVehicleStore } from '@/js/store/vehicleStore';
import { INDONESIA_514_REGIONS } from '@/js/data/indonesia_regions';
import { MapPin, Search, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function RegionFilter() {
  const selectedCity = useVehicleStore((state) => state.selectedCity);
  const { setSelectedCity } = useVehicleStore((state) => state.actions);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter regions based on search query
  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return INDONESIA_514_REGIONS;
    
    return INDONESIA_514_REGIONS.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.province.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group by province
  const groupedRegions = useMemo(() => {
    const groups: Record<string, typeof INDONESIA_514_REGIONS> = {};
    filteredRegions.forEach(r => {
      if (!groups[r.province]) groups[r.province] = [];
      groups[r.province].push(r);
    });
    return groups;
  }, [filteredRegions]);

  const provinces = useMemo(() => Object.keys(groupedRegions).sort(), [groupedRegions]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="region-filter-container" ref={dropdownRef}>
      <div className="filter-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="trigger-left">
          <MapPin size={18} className="pin-icon" />
          <div className="trigger-text">
            <span className="label">Wilayah Distribusi</span>
            <span className="current">{selectedCity === 'Semua' ? 'Seluruh Indonesia' : selectedCity}</span>
          </div>
        </div>
        <div className="trigger-right">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isOpen && (
        <div className="filter-dropdown">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari Kabupaten atau Kota..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="dropdown-scroll">
            <div 
              className={`region-item all-option ${selectedCity === 'Semua' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCity('Semua');
                setIsOpen(false);
              }}
            >
              Semua Wilayah (Indonesia)
            </div>

            {provinces.length === 0 ? (
              <div className="no-results">Tidak ada wilayah ditemukan.</div>
            ) : (
              provinces.map(prov => (
                <div key={prov} className="province-group">
                  <div className="province-header">{prov}</div>
                  <div className="regions-grid">
                    {groupedRegions[prov].map(reg => (
                      <div 
                        key={reg.name} 
                        className={`region-item ${selectedCity === reg.name ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCity(reg.name);
                          setIsOpen(false);
                        }}
                      >
                        {reg.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .region-filter-container {
          position: relative;
          width: 100%;
          margin-bottom: 24px;
          z-index: 100;
        }

        .filter-trigger {
          background: #fff;
          border: 1px solid rgba(139, 28, 63, 0.12);
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(139, 28, 63, 0.05);
          border-left: 5px solid var(--gold);
        }

        .filter-trigger:hover {
          border-color: var(--maroon);
          box-shadow: 0 6px 24px rgba(139, 28, 63, 0.08);
        }

        .trigger-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pin-icon {
          color: var(--maroon);
        }

        .trigger-text {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .current {
          font-size: 15px;
          font-weight: 800;
          color: var(--maroon);
          font-family: var(--font-playfair);
        }

        .trigger-right {
          color: var(--text-muted);
        }

        .filter-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-box {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--cream);
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .clear-btn {
          background: rgba(0,0,0,0.05);
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
        }

        .dropdown-scroll {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
          scrollbar-width: thin;
        }

        .all-option {
          margin-bottom: 16px;
          font-weight: 800;
          border: 2px dashed rgba(139, 28, 63, 0.2);
          text-align: center;
        }

        .province-group {
          margin-bottom: 20px;
        }

        .province-header {
          font-size: 11px;
          font-weight: 900;
          color: var(--maroon);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          padding-left: 4px;
          opacity: 0.7;
        }

        .regions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 6px;
        }

        .region-item {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .region-item:hover {
          background: var(--cream);
          color: var(--maroon);
          border-color: rgba(139, 28, 63, 0.1);
        }

        .region-item.active {
          background: var(--maroon);
          color: #fff;
          border-color: var(--maroon);
          box-shadow: 0 4px 12px rgba(139, 28, 63, 0.2);
        }

        .no-results {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
