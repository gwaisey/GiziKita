'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import AuthService from '@/js/services/AuthService';
import { useAuthStore } from '@/js/store/authStore';
import { useUIStore } from '@/js/store/uiStore';
import { UserProfile } from '@/js/types';

const roleLabels: Record<string, string> = {
  admin_pusat: 'Admin Pusat',
  admin_sekolah: 'Admin Sekolah',
  user_umum: 'Pengguna Umum',
};


export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, isInitialized } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [instansi, setInstansi] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !currentUser) {
      router.push('/login');
    }

    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setInstansi(currentUser.instansi || '');
      setAvatarPreview(currentUser.avatar_url || null);

      if (currentUser.role === 'admin_pusat') {
        fetchPendingUsers();
      }
    }
  }, [isInitialized, currentUser, router]);

  const fetchPendingUsers = async () => {
    if (isLoadingPending) return;
    setIsLoadingPending(true);
    try {
      const pending = await AuthService.getPendingUsers();
      setPendingUsers(pending);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      showToast('Gagal memuat antrean persetujuan.');
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const result = await AuthService.updateProfile({
        name,
        username,
        instansi,
        password: password || undefined,
      });

      if (result.success) {
        showToast('Profil berhasil diperbarui.');
        setPassword('');
      } else {
        showToast(result.message || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const result = await AuthService.approveUser(userId);
      if (result.success) {
        showToast('Akun berhasil disetujui.');
        fetchPendingUsers();
      } else {
        showToast(result.message || 'Gagal menyetujui akun.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan.');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setAvatarPreview(url);
      showToast('Pratinjau foto diperbarui.');
    }
  };

  if (!isInitialized || !currentUser) {
    return (
      <div className="profile-loading">
        <Loader2 className="spinner" size={40} color="var(--maroon)" />
      </div>
    );
  }

  const isAdminPusat = currentUser.role === 'admin_pusat';
  const isAdminSekolah = currentUser.role === 'admin_sekolah';
  const isPendingApproval = isAdminSekolah && !currentUser.isApproved;
  const pageTitle = isAdminPusat ? 'Panel Admin Pusat' : 'Profil Akun';
  const pageSubtitle = isAdminPusat
    ? 'Kelola identitas admin, akses operasional, dan persetujuan akun sekolah.'
    : 'Perbarui detail akun dan akses fitur operasional sesuai status instansi.';

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div>
            <span className="eyebrow">{roleLabels[currentUser.role] || 'Profil'}</span>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <button className="quiet-action" onClick={handleLogout}>
            <LogOut size={18} />
            Keluar
          </button>
        </header>

        {isPendingApproval && (
          <section className="status-alert">
            <ClockIcon />
            <div>
              <h2>Akun menunggu persetujuan</h2>
              <p>Akun instansi Anda sedang diverifikasi oleh Admin Pusat. Akses distribusi akan terbuka setelah akun disetujui.</p>
            </div>
          </section>
        )}

        <section className="profile-grid">
          <div className="panel account-panel">
            <div className="section-heading">
              <div>
                <span>Detail Akun</span>
                <h2>Informasi pengguna</h2>
              </div>
              <ShieldCheck size={22} />
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Nama lengkap</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="field">
                <span>Username</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>

              <label className="field field-wide">
                <span>Instansi / unit kerja</span>
                <input value={instansi} onChange={(e) => setInstansi(e.target.value)} />
              </label>

              <label className="field field-wide">
                <span>Password baru</span>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ganti"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                Simpan perubahan
              </button>
            </div>
          </div>

          <aside className="panel identity-panel">
            <div className="avatar-block">
              <div className="avatar-frame">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Foto profil" />
                ) : (
                  <User size={56} color="var(--maroon)" />
                )}
                <button type="button" onClick={() => document.getElementById('prof-photo-input')?.click()} aria-label="Ganti foto profil">
                  <Camera size={18} />
                </button>
              </div>
              <input id="prof-photo-input" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="identity-copy">
              <h2>{currentUser.name || 'Pengguna GiziKita'}</h2>
              <span className="role-pill">{roleLabels[currentUser.role] || currentUser.role}</span>
              <p>{currentUser.instansi || currentUser.schoolName || 'Instansi belum diisi'}</p>
            </div>

            <div className="identity-facts">
              <div>
                <span>Status</span>
                <strong>{currentUser.isApproved ? 'Aktif' : 'Menunggu'}</strong>
              </div>
              <div>
                <span>Username</span>
                <strong>@{currentUser.username || '-'}</strong>
              </div>
            </div>
          </aside>
        </section>


        {isAdminPusat && (
          <section className="approval-section">
            <div className="section-title-row">
              <div>
                <span className="eyebrow">Persetujuan</span>
                <h2>Antrean akun sekolah</h2>
              </div>
              {!isLoadingPending && (
                <div className="count-badge">{pendingUsers.length} menunggu</div>
              )}
            </div>

            <div className="approval-panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Instansi</th>
                      <th>Pendaftar</th>
                      <th>Username</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingPending ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="table-state">
                            <Loader2 className="spinner" size={24} />
                            <span>Sedang memeriksa antrean...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pendingUsers.length > 0 ? (
                      pendingUsers.map((user) => (
                        <tr key={user.id}>
                          <td data-label="Instansi">
                            <div className="school-cell">
                              <Building2 size={18} />
                              <span>{user.instansi || user.schoolName || 'Instansi belum diisi'}</span>
                            </div>
                          </td>
                          <td data-label="Pendaftar">{user.name || '-'}</td>
                          <td data-label="Username">@{user.username || '-'}</td>
                          <td data-label="Status">
                            <span className="pending-pill">
                              <AlertCircle size={14} />
                              Menunggu
                            </span>
                          </td>
                          <td data-label="Aksi">
                            <button className="approve-btn" onClick={() => handleApproveUser(user.id)}>
                              <CheckCircle2 size={16} />
                              Setujui
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="table-state empty">
                            <BadgeCheck size={28} />
                            <span>Tidak ada antrean persetujuan saat ini.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: var(--cream);
          color: var(--text);
        }

        .profile-shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 36px 0 72px;
        }

        .profile-loading {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream);
        }

        .profile-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .eyebrow {
          display: inline-flex;
          margin-bottom: 8px;
          color: var(--maroon);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .profile-header h1,
        .section-title-row h2 {
          font-family: var(--font-playfair);
          color: var(--maroon);
          margin: 0;
        }

        .profile-header h1 {
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.05;
        }

        .profile-header p {
          max-width: 620px;
          margin: 10px 0 0;
          color: var(--text-muted);
          line-height: 1.65;
          font-size: 15px;
        }

        .quiet-action,
        .approve-btn {
          border: 1px solid rgba(139, 28, 63, 0.14);
          background: #fff;
          color: var(--maroon);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 800;
          transition: background .15s ease, transform .15s ease, border-color .15s ease;
        }

        .quiet-action {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .quiet-action:hover,
        .approve-btn:hover {
          background: rgba(139, 28, 63, 0.06);
          border-color: rgba(139, 28, 63, 0.24);
        }

        .status-alert {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 18px 20px;
          margin-bottom: 24px;
          border-radius: 12px;
          border: 1px solid rgba(244, 198, 98, 0.75);
          background: #fff9e8;
          color: #72540d;
        }

        .status-alert h2 {
          margin: 0 0 4px;
          font-size: 17px;
        }

        .status-alert p {
          margin: 0;
          line-height: 1.6;
          font-size: 14px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
          align-items: start;
        }

        .panel,
        .approval-panel {
          background: #fff;
          border: 1px solid rgba(139, 28, 63, 0.08);
          border-radius: 16px;
          box-shadow: 0 10px 28px rgba(44, 24, 16, 0.06);
        }

        .account-panel {
          padding: 28px;
        }

        .identity-panel {
          padding: 24px;
          position: sticky;
          top: 92px;
        }

        .section-heading,
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .section-heading {
          padding-bottom: 20px;
          margin-bottom: 22px;
          border-bottom: 1px solid rgba(139, 28, 63, 0.08);
          color: var(--maroon);
        }

        .section-heading span {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 22px;
          color: var(--text);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-wide {
          grid-column: 1 / -1;
        }

        .field span {
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }

        .field input {
          width: 100%;
          height: 44px;
          border: 1.5px solid rgba(44, 24, 16, 0.14);
          border-radius: 10px;
          padding: 0 14px;
          color: var(--text);
          background: #fff;
          font: inherit;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .field input:focus {
          border-color: var(--maroon);
          box-shadow: 0 0 0 3px rgba(139, 28, 63, 0.1);
        }

        .password-field {
          position: relative;
        }

        .password-field input {
          padding-right: 46px;
        }

        .password-field button {
          position: absolute;
          right: 8px;
          top: 50%;
          width: 32px;
          height: 32px;
          transform: translateY(-50%);
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--maroon);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-field button:hover {
          background: rgba(139, 28, 63, 0.08);
        }

        .form-actions {
          display: flex;
          justify-content: flex-start;
          margin-top: 24px;
        }

        .form-actions .btn {
          border-radius: 10px;
          min-height: 44px;
          padding: 0 20px;
        }

        .avatar-block {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .avatar-frame {
          width: 124px;
          height: 124px;
          border-radius: 50%;
          border: 3px solid rgba(139, 28, 63, 0.18);
          background: rgba(139, 28, 63, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
        }

        .avatar-frame img {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          object-fit: cover;
        }

        .avatar-frame button {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 36px;
          height: 36px;
          border: 3px solid #fff;
          border-radius: 50%;
          background: var(--maroon);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-block input {
          display: none;
        }

        .identity-copy {
          text-align: center;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(139, 28, 63, 0.08);
        }

        .identity-copy h2 {
          margin: 0 0 10px;
          font-size: 22px;
          line-height: 1.2;
          color: var(--text);
        }

        .role-pill,
        .pending-pill,
        .count-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .role-pill {
          padding: 5px 10px;
          color: var(--maroon);
          background: rgba(139, 28, 63, 0.08);
        }

        .identity-copy p {
          margin: 12px 0 0;
          color: var(--text-muted);
          line-height: 1.55;
          font-size: 14px;
        }

        .identity-facts {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .identity-facts div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
        }

        .identity-facts span {
          color: var(--text-muted);
        }

        .identity-facts strong {
          text-align: right;
          color: var(--text);
        }

        .admin-section,
        .approval-section {
          margin-top: 32px;
        }

        .section-title-row {
          margin-bottom: 16px;
        }

        .section-title-row h2 {
          font-size: 28px;
        }

        .shortcut-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .shortcut-card {
          min-height: 184px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(139, 28, 63, 0.08);
          background: #fff;
          box-shadow: 0 10px 26px rgba(44, 24, 16, 0.05);
          color: inherit;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .shortcut-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 28, 63, 0.2);
          box-shadow: 0 14px 32px rgba(44, 24, 16, 0.08);
        }

        .shortcut-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(139, 28, 63, 0.08);
          color: var(--maroon);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shortcut-card h3 {
          margin: 0 0 8px;
          color: var(--text);
          font-size: 16px;
        }

        .shortcut-card p {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.55;
        }

        .shortcut-arrow {
          position: absolute;
          right: 18px;
          top: 20px;
          color: rgba(139, 28, 63, 0.45);
        }

        .count-badge {
          padding: 7px 12px;
          color: var(--maroon);
          background: rgba(139, 28, 63, 0.08);
          white-space: nowrap;
        }

        .approval-panel {
          overflow: hidden;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }

        th {
          padding: 16px 18px;
          color: var(--maroon);
          background: rgba(244, 198, 98, 0.28);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .04em;
        }

        td {
          padding: 16px 18px;
          border-top: 1px solid rgba(139, 28, 63, 0.08);
          vertical-align: middle;
        }

        .school-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
        }

        .school-cell svg {
          color: var(--maroon);
          flex-shrink: 0;
        }

        .pending-pill {
          padding: 5px 9px;
          color: #8a5f00;
          background: #fff4cf;
        }

        .approve-btn {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 9px;
        }

        .table-state {
          min-height: 132px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text-muted);
          text-align: center;
        }

        .table-state.empty {
          flex-direction: column;
          gap: 8px;
        }

        .table-state.empty svg {
          color: var(--maroon);
        }

        .spinner {
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 980px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .identity-panel {
            position: static;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 20px;
            align-items: center;
          }

          .avatar-block,
          .identity-copy {
            margin: 0;
          }

          .identity-copy {
            text-align: left;
            padding: 0;
            border: 0;
          }

          .identity-facts {
            grid-column: 1 / -1;
            margin-top: 0;
          }

          .shortcut-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .profile-shell {
            width: min(100% - 28px, 1180px);
            padding: 24px 0 56px;
          }

          .profile-header {
            flex-direction: column;
          }

          .quiet-action {
            width: 100%;
          }

          .account-panel,
          .identity-panel {
            padding: 20px;
          }

          .form-grid,
          .shortcut-grid {
            grid-template-columns: 1fr;
          }

          .identity-panel {
            grid-template-columns: 1fr;
          }

          .identity-copy {
            text-align: center;
          }

          .section-title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          table,
          thead,
          tbody,
          tr,
          td {
            display: block;
          }

          thead {
            display: none;
          }

          tr {
            padding: 16px;
            border-top: 1px solid rgba(139, 28, 63, 0.08);
          }

          tr:first-child {
            border-top: 0;
          }

          td {
            border: 0;
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }

          td::before {
            content: attr(data-label);
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .03em;
          }

          td[colspan] {
            display: block;
          }

          td[colspan]::before {
            content: none;
          }

          .approve-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function ClockIcon() {
  return (
    <div className="clock-icon">
      <Loader2 size={22} />
      <style jsx>{`
        .clock-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(244, 198, 98, 0.35);
          color: #856404;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
