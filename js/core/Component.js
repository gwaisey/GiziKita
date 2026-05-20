export default class Component {
  constructor(id = '') {
    this.id = id;
    this.container = document.createElement('div');
    if (id) this.container.id = id;
  }

  static escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  render() {
    return '';
  }

  afterMount() {}

  mount(parent) {
    parent.innerHTML = '';
    this.container.innerHTML = this.render();
    parent.appendChild(this.container);
    this.afterMount();
  }
}
