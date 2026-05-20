import Component from '../core/Component.js';
import Footer from '../components/Footer.js';

export default class AccessDeniedPage extends Component {
  constructor() {
    super('page-access-denied');
  }

  render() {
    return `
      <div style="background:var(--cream);position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column;">
        <svg class="deco-flower" style="right:40px;bottom:60px;width:220px;opacity:.25;" viewBox="0 0 200 200">
          <g transform="translate(100,100)">
            <ellipse rx="45" ry="22" transform="rotate(0)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(30)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(60)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(90)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(120)" fill="#E8673A"/><ellipse rx="45" ry="22" transform="rotate(150)" fill="#E8673A"/><circle r="32" fill="#FFF0C0"/><circle r="18" fill="#F4C662"/>
          </g>
        </svg>
        
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;text-align:center;padding:40px;position:relative;z-index:2;">
          <p style="font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--text);">Akses ditolak!<br>Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
          <button class="btn btn-primary" id="btn-login-redirect">Ke Halaman Login</button>
        </div>
        
        ${Footer.render()}
      </div>
    `;
  }

  afterMount() {
    this.container.querySelector('#btn-login-redirect').addEventListener('click', () => {
      window.app.router.navigate('login');
    });
  }
}
