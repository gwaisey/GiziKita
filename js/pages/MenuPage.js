import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class MenuPage extends Component {
  constructor() {
    super('page-menu');
  }

  render() {
    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:-20px;top:40px;width:200px;opacity:.15;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>

        <div class="page-inner wide" style="flex:1;">
          <h1 class="page-heading">Intip Menu Makanan Sehat<br/>Minggu Ini!</h1>
          <p class="page-sub">Klik pada kartu hari untuk melihat penjelasan manfaat gizi dari AI.</p>

          <div class="menu-grid" id="menu-grid"></div>

          <div id="menu-ai-section" style="display:none;max-width:780px;">
            <h3 style="font-family:'Playfair Display',serif;font-size:20px;margin-bottom:10px;color:var(--maroon);">Manfaat Gizi — <span id="menu-ai-day"></span></h3>
            <div class="ai-box">
              <div class="ai-label">
                <i data-lucide="sparkles" style="width:14px;height:14px;margin-right:6px;"></i>
                Analisis Gizi Pintar
              </div>
              <div id="menu-ai-content"></div>
            </div>
          </div>
        </div>

        ${Footer.render()}
      </div>
      <style>
        .menu-day-card {
          background: var(--peach-card); border-radius: 14px; padding: 20px; border: 2px solid transparent;
          transition: border-color .2s, box-shadow .2s; cursor: pointer;
        }
        .menu-day-card:hover { border-color: var(--coral); box-shadow: 0 4px 18px rgba(232,103,58,.18); }
        .menu-day-card.selected { border-color: var(--maroon); box-shadow: 0 4px 18px rgba(139,28,63,.18); }
        .menu-day-card h3 { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--coral); margin-bottom: 12px; text-align: center; }
        .menu-day-card ul { list-style: none; }
        .menu-day-card ul li { font-size: 13px; color: var(--text); padding: 4px 0; border-bottom: 1px dotted rgba(139,28,63,.15); text-align: center; }
        .menu-day-card ul li:last-child { border-bottom: none; }
      </style>
    `;
  }

  afterMount() {
    this.renderMenuGrid();
    if (window.lucide) window.lucide.createIcons();
  }

  renderMenuGrid() {
    const grid = this.container.querySelector('#menu-grid');
    const menuData = window.app.services.menu.getMenu();
    
    grid.innerHTML = '';
    Object.entries(menuData).forEach(([day, items]) => {
      const card = document.createElement('div');
      card.className = 'menu-day-card';
      card.innerHTML = `<h3>${day}</h3><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
      card.addEventListener('click', () => this.handleMenuClick(day, items, card));
      grid.appendChild(card);
    });
  }

  async handleMenuClick(day, items, cardEl) {
    this.container.querySelectorAll('.menu-day-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    
    const section = this.container.querySelector('#menu-ai-section');
    section.style.display = 'block';
    this.container.querySelector('#menu-ai-day').textContent = day;
    
    const content = this.container.querySelector('#menu-ai-content');
    
    // Tampilkan animasi loading agar terasa "hidup"
    content.innerHTML = `<div class="ai-loading"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Asisten AI sedang berpikir...</span></div>`;
    
    section.scrollIntoView({behavior:'smooth', block:'start'});

    // Ambil data (instan dari library)
    const explanation = await window.app.services.ai.getMenuAnalysis(day, items);
    
    // Berikan jeda sedikit agar efek "berpikir" terasa nyata
    setTimeout(() => {
      content.innerHTML = `<p style="line-height:1.75;font-size:14px;">${explanation.replace(/\\n/g,'<br/>')}</p>`;
    }, 1000);
  }
}
