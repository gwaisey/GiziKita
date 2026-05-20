export default class Toast {
  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'toast';
    this.el.style.cssText = `
      position: fixed; bottom: 48px; left: 50%; transform: translateX(-50%) translateY(120px);
      background: var(--maroon); color: #fff; padding: 14px 32px; border-radius: 40px;
      font-size: 14px; font-weight: 600; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 100000; transition: all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none; opacity: 0;
    `;
    document.body.appendChild(this.el);
    this.timeout = null;

    // Global style for show
    const style = document.createElement('style');
    style.innerHTML = `#toast.show { transform: translateX(-50%) translateY(0) !important; opacity: 1 !important; }`;
    document.head.appendChild(style);
  }

  show(message) {
    this.el.textContent = message;
    this.el.classList.add('show');
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.el.classList.remove('show');
    }, 3000);
  }
}
