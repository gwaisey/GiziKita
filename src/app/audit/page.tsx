'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Database, 
  Search, 
  ArrowLeft,
  Activity,
  Package,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/js/core/SupabaseClient';
import { useVehicleStore } from '@/js/store/vehicleStore';

interface AssetRecord {
  id: string;
  license_plate: string;
  vin: string;
  model: string;
  type: string;
  city: string;
  status: string;
  updated_at: string;
}

export default function AuditPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const activeVehicles = useVehicleStore((state) => state.vehicles);
  const loadActiveVehicles = useVehicleStore((state) => state.actions.loadVehicles);

  useEffect(() => {
    fetchAssets();
    loadActiveVehicles();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_inventory')
        .select('*')
        .order('city', { ascending: true });
      
      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error('Audit: Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  }

  // Audit Logic: Cross-reference assets with live tracking
  const auditStats = useMemo(() => {
    const totalRegistered = assets.length;
    const totalActive = activeVehicles.length;
    
    // Find missing assets (registered but no GPS signal)
    const activePlates = new Set(activeVehicles.map(v => v.license_plate));
    const missingCount = assets.filter(a => !activePlates.has(a.license_plate)).length;
    
    // Find unauthorized units (GPS signal but not in registry)
    const registeredPlates = new Set(assets.map(a => a.license_plate));
    const unauthorizedCount = activeVehicles.filter(v => !registeredPlates.has(v.license_plate)).length;

    const integrityScore = totalRegistered > 0 
      ? Math.round(((totalRegistered - missingCount) / totalRegistered) * 100) 
      : 100;

    return { totalRegistered, totalActive, missingCount, unauthorizedCount, integrityScore };
  }, [assets, activeVehicles]);

  const filteredAssets = assets.filter(a => 
    a.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="audit-page">
      <div className="audit-container">
        {/* Header */}
        <header className="audit-header">
          <Link href="/" className="back-link">
            <ArrowLeft size={18} /> Kembali ke Dashboard
          </Link>
          <div className="header-title-row">
            <div>
              <h1>Audit Aset Kendaraan</h1>
              <p>Basis Data Inventaris Pemerintah & Sinkronisasi GPS Real-time</p>
            </div>
            <div className={`integrity-badge ${auditStats.integrityScore < 100 ? 'warning' : 'healthy'}`}>
              {auditStats.integrityScore < 100 ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
              Asset Integrity: {auditStats.integrityScore}%
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="audit-stats-grid">
          <div className="stat-card">
            <div className="stat-icon registry"><Database size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Aset Terdaftar</span>
              <span className="stat-value">{auditStats.totalRegistered}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active"><Activity size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Unit Aktif (Live GPS)</span>
              <span className="stat-value">{auditStats.totalActive}</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon missing"><Package size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Aset Tidak Terdeteksi</span>
              <span className="stat-value">{auditStats.missingCount}</span>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon unauthorized"><AlertCircle size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Unit Tidak Terdaftar</span>
              <span className="stat-value">{auditStats.unauthorizedCount}</span>
            </div>
          </div>
        </div>

        {/* Audit Table Section */}
        <div className="audit-content">
          <div className="content-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Cari Plat Nomor, VIN, atau Wilayah..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="refresh-button" onClick={fetchAssets}>
              Segarkan Data
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state">Memproses Audit...</div>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Plat Nomor</th>
                    <th>Vehicle ID (VIN)</th>
                    <th>Model & Tipe</th>
                    <th>Wilayah Operasional</th>
                    <th>Status Registry</th>
                    <th>Status GPS Live</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const isLive = activeVehicles.some(v => v.license_plate === asset.license_plate);
                    return (
                      <tr key={asset.id}>
                        <td className="plate-cell"><strong>{asset.license_plate}</strong></td>
                        <td className="vin-cell">{asset.vin}</td>
                        <td className="model-cell">
                          <span className="model-name">{asset.model}</span>
                          <span className="type-tag">{asset.type}</span>
                        </td>
                        <td>{asset.city}</td>
                        <td>
                          <span className="status-tag registry">{asset.status}</span>
                        </td>
                        <td>
                          {isLive ? (
                            <span className="status-tag live">Terdeteksi</span>
                          ) : (
                            <span className="status-tag offline">Tidak Aktif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .audit-page {
          background: #fdfbf8;
          min-height: 100vh;
          padding: 40px 20px;
          color: #2c1810;
        }

        .audit-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .audit-header {
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #8b1c3f;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 20px;
          transition: transform 0.2s;
        }

        .back-link:hover {
          transform: translateX(-4px);
        }

        .header-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        h1 {
          font-family: var(--font-playfair);
          font-size: 32px;
          font-weight: 900;
          color: #8b1c3f;
          margin: 0 0 8px;
        }

        .header-title-row p {
          color: #6a5a54;
          margin: 0;
          font-size: 16px;
        }

        .integrity-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .integrity-badge.healthy {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1.5px solid #a5d6a7;
        }

        .integrity-badge.warning {
          background: #fff3e0;
          color: #ef6c00;
          border: 1.5px solid #ffcc80;
        }

        /* Stats Grid */
        .audit-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          border: 1.5px solid rgba(139, 28, 63, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(44, 24, 16, 0.04);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.registry { background: #f3e5f5; color: #7b1fa2; }
        .stat-icon.active { background: #e3f2fd; color: #1976d2; }
        .stat-icon.missing { background: #fff3e0; color: #f57c00; }
        .stat-icon.unauthorized { background: #ffebee; color: #d32f2f; }

        .stat-label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: #6a5a54;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 900;
          color: #2c1810;
        }

        /* Table Section */
        .audit-content {
          background: #fff;
          border-radius: 20px;
          border: 1.5px solid rgba(139, 28, 63, 0.08);
          box-shadow: 0 10px 40px rgba(44, 24, 16, 0.06);
          overflow: hidden;
        }

        .content-toolbar {
          padding: 20px;
          border-bottom: 1px solid rgba(139, 28, 63, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .search-box {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: #f8f5f2;
          padding: 0 16px;
          border-radius: 12px;
          border: 1.5px solid transparent;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          background: #fff;
          border-color: #8b1c3f;
          box-shadow: 0 4px 12px rgba(139, 28, 63, 0.05);
        }

        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 12px;
          font-size: 14px;
          outline: none;
          color: #2c1810;
        }

        .search-box :global(svg) {
          color: #6a5a54;
        }

        .refresh-button {
          padding: 10px 20px;
          background: #fff;
          border: 1.5px solid #8b1c3f;
          color: #8b1c3f;
          border-radius: 10px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background: #8b1c3f;
          color: #fff;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .audit-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .audit-table th {
          padding: 16px 20px;
          background: #fdfbf8;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6a5a54;
          border-bottom: 1.5px solid rgba(139, 28, 63, 0.06);
        }

        .audit-table td {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(139, 28, 63, 0.04);
          font-size: 14px;
        }

        .plate-cell {
          font-family: 'Courier New', Courier, monospace;
          letter-spacing: 1px;
        }

        .vin-cell {
          color: #6a5a54;
          font-size: 12px;
          font-family: monospace;
        }

        .model-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .model-name {
          font-weight: 700;
        }

        .type-tag {
          font-size: 10px;
          color: #8b1c3f;
          background: #fff0f3;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
          font-weight: 800;
        }

        .status-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-tag.registry { background: #e3f2fd; color: #1976d2; }
        .status-tag.live { background: #e8f5e9; color: #2e7d32; }
        .status-tag.offline { background: #f5f5f5; color: #757575; }

        .loading-state {
          padding: 60px;
          text-align: center;
          color: #6a5a54;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .header-title-row { flex-direction: column; align-items: flex-start; gap: 16px; }
          .audit-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
