import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class FeedbackPage extends Component {
  constructor() {
    super('page-feedback');
    this.currentRating = 0;
  }

  render() {
    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:-20px;bottom:120px;width:240px;opacity:.14;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#8B1C3F"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>

        <div id="fb-list-view" class="page-inner wide" style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px;">
            <div>
              <h1 class="page-heading">Umpan Balik</h1>
              <p class="page-sub">Lihat dan kelola umpan balik dari sekolah penerima program MBG.</p>
            </div>
            ${window.app.services.auth.isAuthenticated() 
              ? '<button class="btn btn-primary" id="btn-show-form">+ Kirim Umpan Balik</button>' 
              : '<button class="btn btn-primary" style="opacity:0.6;" onclick="window.app.router.navigate(\'login\')">Login untuk Kirim Umpan Balik</button>'}
          </div>

          <div class="tabs" id="fb-tabs">
            <div class="tab active" data-filter="all">Semua</div>
            <div class="tab" data-filter="pending">Belum Ditangani</div>
            <div class="tab" data-filter="resolved">Sudah Ditangani</div>
            <div class="tab" data-filter="bad">⚠️ Buruk</div>
            <div class="tab" data-filter="good">✅ Baik</div>
          </div>
          <div id="fb-list-container"></div>
        </div>

        <div id="fb-detail-view" class="page-inner" style="display:none;flex:1;max-width:720px;">
          <a href="#" class="fb-detail-back" id="btn-back-detail">← Kembali ke Daftar</a>
          <div id="fb-detail-content"></div>
        </div>

        <div id="fb-form-view" class="page-inner" style="display:none;flex:1;max-width:680px;">
          <a href="#" class="fb-detail-back" id="btn-back-form">← Kembali ke Daftar</a>
          <h2 class="page-heading" style="font-size:28px;">Kirim Umpan Balik</h2>
          <p class="page-sub">Bagikan pengalaman Anda tentang program Makan Bergizi Gratis.</p>
          
          ${window.app.services.auth.isAuthenticated() ? `
          <div style="background:#fff;border-radius:18px;padding:28px;box-shadow:var(--shadow);">
            <div class="form-group"><label>Nama Sekolah</label><input type="text" id="fb-school" placeholder="Nama sekolah Anda"/></div>
            <div class="form-group"><label>Peran Anda</label><select id="fb-role"><option>Guru</option><option>Siswa</option><option>Kepala Sekolah</option><option>Orang Tua</option></select></div>
            <div class="form-group"><label>Rating</label>
              <div class="star-rating" id="fb-stars">
                <span class="star" data-val="1">★</span><span class="star" data-val="2">★</span><span class="star" data-val="3">★</span><span class="star" data-val="4">★</span><span class="star" data-val="5">★</span>
              </div>
            </div>
            <div class="form-group"><label>Isi Umpan Balik</label><textarea id="fb-text" placeholder="Ceritakan pengalaman Anda..."></textarea></div>
            <button class="btn btn-primary" id="fb-submit-btn" style="min-width:160px;">Kirim Umpan Balik</button>
          </div>
          ` : `
          <div style="background:#fff;border-radius:18px;padding:48px;text-align:center;box-shadow:var(--shadow);">
            <div style="font-size:48px;margin-bottom:16px;">🔒</div>
            <h3 style="font-size:20px;margin-bottom:8px;">Akses Dibatasi</h3>
            <p style="color:var(--text-muted);margin-bottom:24px;">Silakan masuk ke akun Anda terlebih dahulu untuk memberikan umpan balik program.</p>
            <button class="btn btn-primary" onclick="window.app.router.navigate('login')">Masuk Sekarang</button>
          </div>
          `}
        </div>

        ${Footer.render()}
        <style>
          .feedback-card { background: var(--peach-card); border-radius: 14px; padding: 20px 22px; margin-bottom: 14px; cursor: pointer; transition: box-shadow .2s, transform .2s; display: flex; flex-direction: column; gap: 6px; border: 1.5px solid transparent; }
          .feedback-card:hover { box-shadow: 0 4px 18px rgba(139,28,63,.15); transform: translateY(-2px); border-color: var(--coral); }
          .fb-header { display: flex; justify-content: space-between; align-items: flex-start; }
          .fb-school { font-weight: 600; font-size: 15px; } .fb-date { font-size: 12px; color: var(--text-muted); }
          .fb-role { font-size: 12px; color: var(--text-muted); } .fb-text { font-size: 14px; line-height: 1.55; color: var(--text); margin-top: 2px; }
          .fb-detail-back { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--maroon); cursor: pointer; margin-bottom: 24px; text-decoration: none; }
          .fb-detail-back:hover { text-decoration: underline; }
          .custom-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
          .custom-check input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--maroon); }
        </style>
      </div>
    `;
  }

  afterMount() {
    this.renderList('all');

    const showFormBtn = this.container.querySelector('#btn-show-form');
    if (showFormBtn) showFormBtn.addEventListener('click', () => this.showView('form'));
    this.container.querySelector('#btn-back-detail').addEventListener('click', (e) => { e.preventDefault(); this.showView('list'); });
    this.container.querySelector('#btn-back-form').addEventListener('click', (e) => { e.preventDefault(); this.showView('list'); });

    // Tabs
    this.container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', (e) => {
        this.container.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        t.classList.add('active');
        this.renderList(t.getAttribute('data-filter'));
      });
    });

    // Stars
    const stars = this.container.querySelectorAll('.star');
    stars.forEach(s => {
      s.addEventListener('mouseover', () => {
        const val = parseInt(s.getAttribute('data-val'));
        stars.forEach((st, i) => st.classList.toggle('hover', i < val));
      });
      s.addEventListener('mouseout', () => {
        stars.forEach(st => st.classList.remove('hover'));
      });
      s.addEventListener('click', () => {
        this.currentRating = parseInt(s.getAttribute('data-val'));
        stars.forEach((st, i) => st.classList.toggle('active', i < this.currentRating));
      });
    });

    // Submit
    const submitBtn = this.container.querySelector('#fb-submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', () => this.submitFeedback());
  }

  showView(view) {
    this.container.querySelector('#fb-list-view').style.display = view === 'list' ? 'block' : 'none';
    this.container.querySelector('#fb-detail-view').style.display = view === 'detail' ? 'block' : 'none';
    this.container.querySelector('#fb-form-view').style.display = view === 'form' ? 'block' : 'none';
    if(view === 'list') this.renderList(this.container.querySelector('.tab.active').getAttribute('data-filter'));
    window.scrollTo({top:0, behavior:'smooth'});
  }

  getBadge(sentiment) {
    if (sentiment==='good') return '<span class="badge badge-good">✅ Baik</span>';
    if (sentiment==='bad')  return '<span class="badge badge-bad">⚠️ Buruk</span>';
    return '<span class="badge badge-neutral">⚪ Netral</span>';
  }

  async renderList(filter) {
    const container = this.container.querySelector('#fb-list-container');
    container.innerHTML = '<div style="padding:40px;text-align:center;"><span class="spinner" style="border-color:var(--maroon);border-bottom-color:transparent;width:30px;height:30px;"></span><p style="margin-top:12px;color:var(--text-muted);font-size:14px;">Memuat data dari server...</p></div>';

    const list = await window.app.services.feedback.getFeedbacks(filter);
    
    if (!list.length) {
      container.innerHTML = '<p style="color:var(--text-muted);padding:20px 0;font-size:14px;">Tidak ada umpan balik yang sesuai.</p>';
      return;
    }
    container.innerHTML = list.map(fb => `
      <div class="feedback-card" data-id="${fb.id}">
        <div class="fb-header"><strong class="fb-school">${Component.escapeHTML(fb.school)}</strong><span class="fb-date">${fb.date}</span></div>
        <div class="fb-role">${Component.escapeHTML(fb.role)}</div>
        <div class="stars-display">${'★'.repeat(fb.stars)}${'☆'.repeat(5-fb.stars)}</div>
        <p class="fb-text">${Component.escapeHTML(fb.text)}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${this.getBadge(fb.sentiment)} ${fb.resolved?'<span class="badge badge-resolved">✅ Ditindaklanjuti</span>':'<span class="badge badge-pending">⏳ Pending</span>'}</div>
      </div>
    `).join('');

    container.querySelectorAll('.feedback-card').forEach(card => {
      card.addEventListener('click', () => this.renderDetail(card.getAttribute('data-id')));
    });
  }

  async renderDetail(id) {
    this.showView('detail');
    const content = this.container.querySelector('#fb-detail-content');
    content.innerHTML = '<div style="padding:40px;text-align:center;"><span class="spinner" style="border-color:var(--maroon);border-bottom-color:transparent;width:30px;height:30px;"></span></div>';

    const fb = await window.app.services.feedback.getFeedbackById(id);
    if (!fb) {
      content.innerHTML = '<p>Umpan balik tidak ditemukan.</p>';
      return;
    }
    
    const repliesHTML = (fb.replies || []).map(reply => `
      <div style="border-left:2px solid var(--gold); padding-left:20px; margin-bottom:24px; position:relative;">
        <div style="position:absolute; left:-7px; top:0; width:12px; height:12px; border-radius:50%; background:var(--gold); border:2px solid #fff;"></div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">${reply.date} - <strong style="color:var(--maroon);">${reply.author}</strong></div>
        <p style="font-size:14px; margin-bottom:8px; line-height:1.5;">${reply.message}</p>
        <span class="badge ${reply.status === 'Selesai' ? 'badge-good' : 'badge-pending'}" style="font-size:11px; padding:4px 8px;">Status: ${reply.status}</span>
      </div>
    `).join('');

    const isAuth = window.app.services.auth.isAuthenticated();
    const isAdmin = isAuth && window.app.services.auth.currentUser && window.app.services.auth.currentUser.role === 'admin_pusat';

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h2 style="font-family:'Playfair Display',serif;font-size:26px;color:var(--text);margin:0;">Detail Umpan Balik</h2>
        ${fb.ticket_number ? `<span style="font-family:monospace; background:rgba(0,0,0,0.05); padding:6px 12px; border-radius:6px; font-size:14px; font-weight:700; color:var(--text-muted); border:1px solid rgba(0,0,0,0.1);">#${fb.ticket_number}</span>` : ''}
      </div>
      
      <div style="background:#fff;border-radius:14px;padding:26px;box-shadow:var(--shadow); margin-bottom:24px;">
        <div class="fb-header"><strong class="fb-school" style="font-size:18px;">${Component.escapeHTML(fb.school)}</strong><span class="fb-date">${fb.date}</span></div>
        <div class="fb-role" style="margin-top:6px;">Pelapor: ${Component.escapeHTML(fb.role)}</div>
        <div class="stars-display" style="margin:16px 0;">${'★'.repeat(fb.stars)}${'☆'.repeat(5-fb.stars)}</div>
        <div style="font-size:15px; padding:20px; background:#fafafa; border-radius:10px; border-left:4px solid ${fb.sentiment === 'bad' ? 'var(--coral)' : 'var(--maroon)'}; line-height:1.6;">
           ${Component.escapeHTML(fb.text)}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:20px;">
          ${this.getBadge(fb.sentiment)}
          ${fb.resolved?'<span class="badge badge-resolved" style="padding:6px 12px;">✅ Selesai Ditindaklanjuti</span>':'<span class="badge badge-pending" style="padding:6px 12px;">⏳ Menunggu Tindakan</span>'}
        </div>
      </div>

      <h3 style="font-size:18px; font-weight:700; margin-bottom:16px; color:var(--text);">Timeline Penyelesaian:</h3>
      <div style="background:#fff;border-radius:14px;padding:32px 26px;box-shadow:var(--shadow); margin-bottom:32px;">
        ${(fb.replies && fb.replies.length > 0) ? repliesHTML : '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:14px; font-style:italic;">Belum ada tanggapan atau tindakan perbaikan.</div>'}
        
        ${isAdmin ? `
          <hr class="section-divider" style="margin:32px 0 24px 0;" />
          <h4 style="font-size:16px; margin-bottom:16px; color:var(--maroon); font-weight:700;">Beri Tanggapan (Khusus Admin)</h4>
          <textarea id="fb-reply-text" placeholder="Ketik tindakan perbaikan atau update penyelesaian masalah..." style="width:100%; padding:16px; border-radius:10px; border:2px solid #eee; margin-bottom:16px; min-height:100px; font-family:inherit; font-size:14px;"></textarea>
          <div style="display:flex; gap:12px; align-items:center;">
             <select id="fb-reply-status" style="padding:12px 16px; border-radius:10px; border:2px solid #eee; font-weight:600; cursor:pointer;">
                <option value="Diproses">Tandai: Sedang Diproses</option>
                <option value="Selesai">Tandai: Masalah Selesai</option>
             </select>
             <button class="btn btn-primary" id="btn-submit-reply" style="padding:12px 32px; border-radius:10px;">Kirim Update</button>
          </div>
        ` : ''}
      </div>
    `;

    if (isAdmin) {
      const replyBtn = content.querySelector('#btn-submit-reply');
      if (replyBtn) {
        replyBtn.addEventListener('click', async (e) => {
          const text = content.querySelector('#fb-reply-text').value.trim();
          const status = content.querySelector('#fb-reply-status').value;
          if (!text) {
             window.app.components.toast.show('Tanggapan tidak boleh kosong!');
             return;
          }
          
          e.target.disabled = true;
          e.target.innerHTML = '<span class="spinner"></span>';
          
          try {
            await window.app.services.feedback.addReply(id, text, status);
            window.app.components.toast.show('Tanggapan dan update status berhasil dicatat!');
            this.renderDetail(id);
          } catch (err) {
            window.app.components.toast.show('Gagal mengirim tanggapan.');
            e.target.disabled = false;
            e.target.innerHTML = 'Kirim Update';
          }
        });
      }
    }
  }

  async submitFeedback() {
    const school = this.container.querySelector('#fb-school').value.trim();
    const role = this.container.querySelector('#fb-role').value;
    const text = this.container.querySelector('#fb-text').value.trim();

    if (!school || !text || !this.currentRating) {
      window.app.components.toast.show('Lengkapi semua field dan berikan rating!');
      return;
    }

    const btn = this.container.querySelector('#fb-submit-btn');
    btn.innerHTML = '<span class="spinner"></span> Menganalisis...';
    btn.disabled = true;

    try {
      const sentiment = await window.app.services.ai.analyzeSentiment(text, this.currentRating);
      await window.app.services.feedback.addFeedback({ school, role, stars: this.currentRating, text, sentiment });
      window.app.components.toast.show('Umpan balik terkirim!');
      
      this.container.querySelector('#fb-school').value = '';
      this.container.querySelector('#fb-text').value = '';
      this.currentRating = 0;
      this.container.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
      
      this.showView('list');
    } catch(e) {
      window.app.components.toast.show('Error: ' + e.message);
    } finally {
      btn.innerHTML = 'Kirim Umpan Balik';
      btn.disabled = false;
    }
  }
}
