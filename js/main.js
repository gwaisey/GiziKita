import Router from './core/Router.js';
import AuthService from './services/AuthService';
import FeedbackService from './services/FeedbackService.js';
import AIService from './services/AIService.js';
import MenuService from './services/MenuService.js';
import SchoolService from './services/SchoolService';
import DistributionService from './services/DistributionService';
import TourService from './services/TourService.js';

import Navbar from './components/Navbar.js';
import Toast from './components/Toast.js';

import HomePage from './pages/HomePage.js';
import LoginPage from './pages/LoginPage.js';
import SignupPage from './pages/SignupPage.js';
import AccessDeniedPage from './pages/AccessDeniedPage.js';
import RegistrationPage from './pages/RegistrationPage.js';
import MenuPage from './pages/MenuPage.js';
import FeedbackPage from './pages/FeedbackPage.js';
import HelpPage from './pages/HelpPage.js';
import ProfilePage from './pages/ProfilePage.js';
import SchoolListPage from './pages/SchoolListPage.js';
import DistributionPage from './pages/DistributionPage.js';
import AboutPage from './pages/AboutPage.js';
import PrivacyPage from './pages/PrivacyPage.js';

window.app = {
  router: Router,
  services: {
    auth: AuthService,
    feedback: FeedbackService,
    ai: AIService,
    menu: MenuService,
    schools: SchoolService,
    distribution: DistributionService
  },
  components: {}
};

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Global Components
  window.app.components.toast = new Toast();
  window.app.components.navbar = new Navbar();

  // Initialize Auth
  await window.app.services.auth.init();

  // Background prefetch data to speed up navigation
  window.app.services.schools.prefetch();
  window.app.services.distribution.prefetch();

  // Register Routes
  Router.addRoute('home', HomePage);
  Router.addRoute('login', LoginPage);
  Router.addRoute('signup', SignupPage);
  Router.addRoute('access-denied', AccessDeniedPage);
  Router.addRoute('register-school', RegistrationPage);
  Router.addRoute('menu', MenuPage);
  Router.addRoute('feedback', FeedbackPage);
  Router.addRoute('help', HelpPage);
  Router.addRoute('profile', ProfilePage);
  Router.addRoute('school-list', SchoolListPage);
  Router.addRoute('distribusi', DistributionPage);
  Router.addRoute('about', AboutPage);
  Router.addRoute('privacy', PrivacyPage);

  // Initial Navigation
  const initialPath = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  Router.navigate(initialPath);

   // Global data-page interceptor for non-anchor CTAs
   document.addEventListener('click', (e) => {
     const target = e.target.closest('[data-page]');
     if (target && target.tagName !== 'A') {
       e.preventDefault();
       const page = target.getAttribute('data-page');
       Router.navigate(page);
     }
   });
});
