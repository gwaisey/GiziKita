import Toast from '../components/Toast.js';
import TourService from '../services/TourService.js';

class Router {
  constructor() {
    this.routes = {};
    this.appRoot = document.getElementById('app-root');
    this.currentPage = null;
    
    // Listen for browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.path) {
        this.navigate(event.state.path, event.state.params, false);
      } else {
        this.navigate('home', {}, false);
      }
    });
  }

  addRoute(path, ComponentClass) {
    this.routes[path] = ComponentClass;
  }

  navigate(path, params = {}, pushToHistory = true) {
    const authService = window.app.services.auth;
    const protectedRoutes = ['register-school', 'menu', 'profile', 'distribusi', 'school-list'];
    const authRoutes = ['login', 'signup'];

    // Guard: Redirect if already logged in
    if (authRoutes.includes(path) && authService.isAuthenticated()) {
      path = 'home';
    }

    // Guard: Protected routes
    if (protectedRoutes.includes(path) && !authService.isAuthenticated()) {
      if (window.app.components.toast) {
        window.app.components.toast.show('Silakan login untuk mengakses halaman ini.');
      }
      path = 'login';
    }

    if (!this.routes[path]) {
      path = 'home';
    }

    // Update History if needed
    if (pushToHistory) {
      const url = path === 'home' ? '/' : `/${path}`;
      window.history.pushState({ path, params }, '', url);
    }

    // Unmount previous if needed
    if (this.currentPage && typeof this.currentPage.unmount === 'function') {
      this.currentPage.unmount();
    }

    const ComponentClass = this.routes[path];
    this.currentPage = new ComponentClass(params);
    this.currentPage.mount(this.appRoot);

    // Update Navbar
    if (window.app.components.navbar) {
      window.app.components.navbar.render(path);
    }

    if (path === 'home' && authService.isAuthenticated()) {
      window.setTimeout(() => TourService.start(), 250);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export default new Router();
