import Component from '../core/Component.js';
import Footer from '../components/Footer.js';
import TourService from '../services/TourService.js';

export default class HelpPage extends Component {
  constructor() {
    super('page-help');
  }

  render() {
    const canAccessTutorial = TourService.canAccessTutorial();
    const tutorialLabel = TourService.getTutorialAudienceLabel();
    const chatHistory = window.app.services.ai.helpHistory;

    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:-20px;bottom:80px;width:240px;opacity:.16;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>
        <svg class="deco-flower" style="left:-20px;top:40px;width:180px;opacity:.12;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(45)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#8B1C3F"/><ellipse rx="45" ry="22" transform="rotate(135)" fill="#8B1C3F"/><circle r="30" fill="#FFF0C0"/><circle r="16" fill="#F4C662"/>
          </g>
        </svg>

        <div class="page-inner" style="flex:1;">
          <h1 class="page-heading">Untuk bantuan,<br/>hubungi Kami:</h1>
          <div style="max-width:620px;margin-bottom:36px;">
            <div class="contact-item">
              <div class="contact-icon"><i data-lucide="mail"></i></div>
              <div><div class="contact-label">Email</div><div class="contact-value">support@gizikita.id</div></div>
            </div>
            <div class="contact-item">
              <div class="contact-icon"><i data-lucide="phone"></i></div>
              <div><div class="contact-label">Nomor Telepon</div><div class="contact-value">0812-3456-7890</div></div>
            </div>
            <div class="contact-item">
              <div class="contact-icon"><i data-lucide="map-pin"></i></div>
              <div><div class="contact-label">Alamat Kami</div><div class="contact-value">Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 10110</div></div>
            </div>
          </div>

          <hr class="section-divider"/>

          ${canAccessTutorial ? `
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:8px;color:var(--maroon);display:flex;align-items:center;gap:10px;">
            <i data-lucide="book-open" style="width:24px;height:24px;"></i>
            Panduan Aplikasi
          </h2>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:18px;">${tutorialLabel}</p>
           <button class="btn btn-outline" id="restart-tour-btn" style="margin-bottom:32px; border-color:var(--maroon); color:var(--maroon); border-radius:12px; padding:12px 24px;">Lihat Tutorial Ulang</button>
           ` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <div>
              <h2 style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:8px;color:var(--maroon);display:flex;align-items:center;gap:10px;">
                <i data-lucide="sparkles" style="width:24px;height:24px;"></i>
                Asisten Gizi Pintar
              </h2>
              <p style="color:var(--text-muted);font-size:14px;margin:0;">Tanyakan tentang program MBG, transparansi data, atau cara pendaftaran.</p>
            </div>
            ${chatHistory.length > 0 ? `
              <button id="clear-history-btn" style="background:none; border:none; color:var(--coral); cursor:pointer; display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; padding:8px; border-radius:8px; transition:all 0.2s;">
                <i data-lucide="trash-2" style="width:16px; height:16px;"></i> Hapus Riwayat
              </button>
            ` : ''}
          </div>

          <div style="background:#fff;border-radius:18px;padding:24px;box-shadow:var(--shadow);max-width:680px;">
            <div id="help-chat-messages" style="min-height:120px;max-height:340px;overflow-y:auto;margin-bottom:16px;display:flex;flex-direction:column;gap:12px;">
              ${chatHistory.map(msg => this._renderMessage(msg)).join('')}
              <div id="typing-indicator" style="display:none;">
                <div style="background:var(--peach-card);border-radius:10px 10px 10px 2px;padding:8px 14px;font-size:14px;max-width:80%;line-height:1.6;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div class="ai-loading" style="gap:4px; flex-shrink:0;">
                      <div class="dot" style="width:4px; height:4px;"></div>
                      <div class="dot" style="width:4px; height:4px;"></div>
                      <div class="dot" style="width:4px; height:4px;"></div>
                    </div>
                    <span id="loading-text" style="color:var(--text-muted); font-size:12px; font-style:italic; white-space:nowrap;">GiziBot sedang berpikir...</span>
                  </div>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:10px;">
              <input type="text" id="help-input" placeholder="Tulis pertanyaan Anda..." style="flex:1;padding:11px 14px;border:1.5px solid #ddd;border-radius:30px;font-size:14px;outline:none;"/>
              <button class="btn btn-primary btn-sm" id="help-send-btn" style="border-radius:30px;padding:11px 20px;">Kirim</button>
            </div>
          </div>
        </div>
        ${Footer.render()}
        <style>
          .contact-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid rgba(139,28,63,.1); }
          .contact-item:last-child { border-bottom: none; }
          .contact-icon { font-size: 22px; min-width: 34px; }
          .contact-label { font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; color: var(--coral); margin-bottom: 3px; }
          .contact-value { font-size: 15px; color: var(--text); }
        </style>
      </div>
    `;
  }

  _renderMessage(msg) {
    const isUser = msg.role === 'user';
    const style = isUser 
      ? 'background:var(--maroon);color:#fff;border-radius:10px 10px 2px 10px;padding:11px 14px;font-size:14px;max-width:80%;align-self:flex-end;margin-left:auto;line-height:1.6;'
      : 'background:var(--peach-card);border-radius:10px 10px 10px 2px;padding:12px 14px;font-size:14px;max-width:80%;line-height:1.6;';
    
    // Formatting simple markdown-like syntax
    let content = Component.escapeHTML(msg.content);
    content = content.replace(/\n/g, '<br/>')
                     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `<div style="${style}">${content}</div>`;
  }

  afterMount() {
    const aiService = window.app.services.ai;
    const input = this.container.querySelector('#help-input');
    const sendBtn = this.container.querySelector('#help-send-btn');
    const messages = this.container.querySelector('#help-chat-messages');
    const indicator = this.container.querySelector('#typing-indicator');

    // Restore typing state if already loading
    if (aiService.isHelpLoading) {
      indicator.style.display = 'block';
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span class="spinner"></span>';
    }
    messages.scrollTop = messages.scrollHeight;

    // Set listener for background updates
    aiService.onHelpUpdate = () => {
      const currentHTML = aiService.helpHistory.map(m => this._renderMessage(m)).join('');
      const loadingText = aiService.helpLoadingStatus || "GiziBot sedang berpikir...";
      
      messages.innerHTML = currentHTML + `
        <div id="typing-indicator" style="display:${aiService.isHelpLoading ? 'block' : 'none'};">
          <div style="background:var(--peach-card);border-radius:10px 10px 10px 2px;padding:8px 14px;font-size:14px;max-width:80%;line-height:1.6;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="ai-loading" style="gap:4px; flex-shrink:0;">
                <div class="dot" style="width:4px; height:4px;"></div>
                <div class="dot" style="width:4px; height:4px;"></div>
                <div class="dot" style="width:4px; height:4px;"></div>
              </div>
              <span style="color:var(--text-muted); font-size:12px; font-style:italic; white-space:nowrap;">${loadingText}</span>
            </div>
          </div>
        </div>
      `;
      
      sendBtn.disabled = aiService.isHelpLoading;
      sendBtn.innerHTML = aiService.isHelpLoading ? '<span class="spinner"></span>' : 'Kirim';
      messages.scrollTop = messages.scrollHeight;
    };

    input.addEventListener('keydown', (e) => { if(e.key==='Enter') this.sendHelp(); });
    sendBtn.addEventListener('click', () => this.sendHelp());

    const restartTourBtn = this.container.querySelector('#restart-tour-btn');
    if (restartTourBtn) {
      restartTourBtn.addEventListener('click', () => {
        const user = window.app.services.auth.currentUser;
        if (user) {
          localStorage.removeItem(`gizikita_tour_done_${user.username}`);
          TourService.start(true);
        }
      });
    }

    const clearHistoryBtn = this.container.querySelector('#clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan?')) {
          aiService.clearHelpHistory();
          // Force re-render to update UI (remove button and clear messages)
          this.mount(document.getElementById('app-root'));
        }
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  onUnmount() {
    // Clean up listener to prevent memory leaks or dual-renders
    window.app.services.ai.onHelpUpdate = null;
  }

  async sendHelp() {
    const input = this.container.querySelector('#help-input');
    const msg = input.value.trim();
    if (!msg || window.app.services.ai.isHelpLoading) return;
    
    input.value = '';
    await window.app.services.ai.askHelp(msg);
  }
}
