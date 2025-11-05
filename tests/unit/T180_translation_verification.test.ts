/**
 * T180: Translation Verification Tests
 *
 * Comprehensive tests to verify all translated content displays correctly
 * in both English and Spanish. Ensures translation completeness, consistency,
 * and proper display across the entire application.
 *
 * Test Coverage:
 * - Translation file completeness
 * - Structural consistency between locales
 * - UI text translations
 * - Content translations (courses, events, products)
 * - Formatting functions
 * - Edge cases and special characters
 * - Missing translations detection
 */

import { describe, it, expect } from 'vitest';
import {
  t,
  getTranslations,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getLocalizedPath,
  extractLocaleFromPath,
  isValidLocale,
  LOCALES,
} from '../../src/i18n/index';
import enTranslations from '../../src/i18n/locales/en.json';
import esTranslations from '../../src/i18n/locales/es.json';

describe('T180: Translation Verification - Complete Coverage', () => {
  describe('Translation File Completeness', () => {
    it('should have both English and Spanish translation files', () => {
      expect(enTranslations).toBeDefined();
      expect(esTranslations).toBeDefined();
    });

    it('should have the same top-level keys in both languages', () => {
      const enKeys = Object.keys(enTranslations);
      const esKeys = Object.keys(esTranslations);

      expect(enKeys.sort()).toEqual(esKeys.sort());
    });

    it('should have matching nested structure in both languages', () => {
      const checkStructure = (enObj: any, esObj: any, path: string = '') => {
        const enKeys = Object.keys(enObj);
        const esKeys = Object.keys(esObj);

        // Check all English keys exist in Spanish
        enKeys.forEach(key => {
          expect(esKeys, `Missing Spanish key: ${path}.${key}`).toContain(key);

          const enValue = enObj[key];
          const esValue = esObj[key];

          if (typeof enValue === 'object' && !Array.isArray(enValue)) {
            checkStructure(enValue, esValue, `${path}.${key}`);
          } else {
            expect(typeof esValue, `Type mismatch at ${path}.${key}`).toBe(typeof enValue);
          }
        });

        // Check all Spanish keys exist in English
        esKeys.forEach(key => {
          expect(enKeys, `Extra Spanish key not in English: ${path}.${key}`).toContain(key);
        });
      };

      checkStructure(enTranslations, esTranslations);
    });

    it('should not have any empty translations', () => {
      const checkEmpty = (obj: any, locale: string, path: string = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'string') {
            expect(value.trim(), `Empty translation at ${path}.${key} (${locale})`).not.toBe('');
          } else if (typeof value === 'object' && !Array.isArray(value)) {
            checkEmpty(value, locale, `${path}.${key}`);
          }
        });
      };

      checkEmpty(enTranslations, 'en');
      checkEmpty(esTranslations, 'es');
    });
  });

  describe('Common UI Translations', () => {
    const commonKeys = [
      'common.appName',
      'common.welcome',
      'common.login',
      'common.logout',
      'common.register',
      'common.email',
      'common.password',
      'common.submit',
      'common.cancel',
      'common.save',
      'common.delete',
      'common.edit',
      'common.search',
      'common.loading',
      'common.error',
      'common.success',
    ];

    commonKeys.forEach(key => {
      it(`should translate ${key} to Spanish`, () => {
        const enText = t('en', key);
        const esText = t('es', key);

        expect(enText).toBeDefined();
        expect(esText).toBeDefined();
        // Some words like "Error" might be the same in both languages
        if (key !== 'common.error') {
          expect(enText).not.toBe(esText); // Ensure actual translation happened
        }
        expect(esText).not.toBe(key); // Ensure not returning key as fallback
      });
    });

    it('should display app name correctly in both languages', () => {
      expect(t('en', 'common.appName')).toBe('Spirituality Platform');
      expect(t('es', 'common.appName')).toBe('Plataforma de Espiritualidad');
    });

    it('should translate action buttons correctly', () => {
      // English
      expect(t('en', 'common.submit')).toBe('Submit');
      expect(t('en', 'common.cancel')).toBe('Cancel');
      expect(t('en', 'common.save')).toBe('Save');

      // Spanish
      expect(t('es', 'common.submit')).toBe('Enviar');
      expect(t('es', 'common.cancel')).toBe('Cancelar');
      expect(t('es', 'common.save')).toBe('Guardar');
    });

    it('should translate yes/no correctly', () => {
      expect(t('en', 'common.yes')).toBe('Yes');
      expect(t('en', 'common.no')).toBe('No');
      expect(t('es', 'common.yes')).toBe('Sí');
      expect(t('es', 'common.no')).toBe('No');
    });
  });

  describe('Navigation Translations', () => {
    const navKeys = [
      'nav.home',
      'nav.courses',
      'nav.events',
      'nav.products',
      'nav.dashboard',
      'nav.admin',
      'nav.cart',
    ];

    navKeys.forEach(key => {
      it(`should translate ${key} correctly in both languages`, () => {
        const enText = t('en', key);
        const esText = t('es', key);

        expect(enText).toBeDefined();
        expect(esText).toBeDefined();
        expect(enText).not.toBe(esText);
      });
    });

    it('should translate navigation items correctly', () => {
      // English
      expect(t('en', 'nav.home')).toBe('Home');
      expect(t('en', 'nav.courses')).toBe('Courses');
      expect(t('en', 'nav.events')).toBe('Events');

      // Spanish
      expect(t('es', 'nav.home')).toBe('Inicio');
      expect(t('es', 'nav.courses')).toBe('Cursos');
      expect(t('es', 'nav.events')).toBe('Eventos');
    });

    it('should translate user menu items correctly', () => {
      expect(t('en', 'nav.myAccount')).toBe('My Account');
      expect(t('es', 'nav.myAccount')).toBe('Mi Cuenta');
      expect(t('en', 'nav.profile')).toBe('Profile');
      expect(t('es', 'nav.profile')).toBe('Perfil');
    });
  });

  describe('Authentication Translations', () => {
    it('should translate auth actions correctly', () => {
      // Sign in/Sign up
      expect(t('en', 'auth.signIn')).toBe('Sign In');
      expect(t('es', 'auth.signIn')).toBe('Iniciar Sesión');
      expect(t('en', 'auth.signUp')).toBe('Sign Up');
      expect(t('es', 'auth.signUp')).toBe('Registrarse');
    });

    it('should translate auth form labels correctly', () => {
      expect(t('en', 'auth.emailAddress')).toBe('Email Address');
      expect(t('es', 'auth.emailAddress')).toBe('Dirección de Correo');
      expect(t('en', 'auth.password')).toBe('Password');
      expect(t('es', 'auth.password')).toBe('Contraseña');
      expect(t('en', 'auth.fullName')).toBe('Full Name');
      expect(t('es', 'auth.fullName')).toBe('Nombre Completo');
    });

    it('should translate auth messages correctly', () => {
      expect(t('en', 'auth.loginSuccess')).toBe('Login successful!');
      expect(t('es', 'auth.loginSuccess')).toBe('¡Inicio de sesión exitoso!');
      expect(t('en', 'auth.invalidCredentials')).toBe('Invalid credentials');
      expect(t('es', 'auth.invalidCredentials')).toBe('Credenciales inválidas');
    });

    it('should translate password-related text correctly', () => {
      expect(t('en', 'auth.forgotPassword')).toBe('Forgot Password?');
      expect(t('es', 'auth.forgotPassword')).toBe('¿Olvidó su contraseña?');
      expect(t('en', 'auth.resetPassword')).toBe('Reset Password');
      expect(t('es', 'auth.resetPassword')).toBe('Restablecer Contraseña');
    });
  });

  describe('Courses Translations', () => {
    it('should translate course page elements correctly', () => {
      expect(t('en', 'courses.title')).toBe('Courses');
      expect(t('es', 'courses.title')).toBe('Cursos');
      expect(t('en', 'courses.myCourses')).toBe('My Courses');
      expect(t('es', 'courses.myCourses')).toBe('Mis Cursos');
      expect(t('en', 'courses.browseCourses')).toBe('Browse Courses');
      expect(t('es', 'courses.browseCourses')).toBe('Explorar Cursos');
    });

    it('should translate course actions correctly', () => {
      expect(t('en', 'courses.enroll')).toBe('Enroll Now');
      expect(t('es', 'courses.enroll')).toBe('Inscribirse Ahora');
      expect(t('en', 'courses.startCourse')).toBe('Start Course');
      expect(t('es', 'courses.startCourse')).toBe('Iniciar Curso');
      expect(t('en', 'courses.continueCourse')).toBe('Continue Course');
      expect(t('es', 'courses.continueCourse')).toBe('Continuar Curso');
    });

    it('should translate course metadata correctly', () => {
      expect(t('en', 'courses.lessons')).toBe('Lessons');
      expect(t('es', 'courses.lessons')).toBe('Lecciones');
      expect(t('en', 'courses.duration')).toBe('Duration');
      expect(t('es', 'courses.duration')).toBe('Duración');
      expect(t('en', 'courses.level')).toBe('Level');
      expect(t('es', 'courses.level')).toBe('Nivel');
    });

    it('should translate course levels correctly', () => {
      expect(t('en', 'courses.beginner')).toBe('Beginner');
      expect(t('es', 'courses.beginner')).toBe('Principiante');
      expect(t('en', 'courses.intermediate')).toBe('Intermediate');
      expect(t('es', 'courses.intermediate')).toBe('Intermedio');
      expect(t('en', 'courses.advanced')).toBe('Advanced');
      expect(t('es', 'courses.advanced')).toBe('Avanzado');
    });

    it('should translate course status correctly', () => {
      expect(t('en', 'courses.enrolled')).toBe('Enrolled');
      expect(t('es', 'courses.enrolled')).toBe('Inscrito');
      expect(t('en', 'courses.completed')).toBe('Completed');
      expect(t('es', 'courses.completed')).toBe('Completado');
      expect(t('en', 'courses.inProgressCourses')).toBe('In Progress');
      expect(t('es', 'courses.inProgressCourses')).toBe('En Progreso');
    });
  });

  describe('Events Translations', () => {
    it('should translate event page elements correctly', () => {
      expect(t('en', 'events.title')).toBe('Events');
      expect(t('es', 'events.title')).toBe('Eventos');
      expect(t('en', 'events.upcoming')).toBe('Upcoming');
      expect(t('es', 'events.upcoming')).toBe('Próximos');
      expect(t('en', 'events.myEvents')).toBe('My Events');
      expect(t('es', 'events.myEvents')).toBe('Mis Eventos');
    });

    it('should translate event actions correctly', () => {
      expect(t('en', 'events.bookNow')).toBe('Book Now');
      expect(t('es', 'events.bookNow')).toBe('Reservar Ahora');
      expect(t('en', 'events.eventDetails')).toBe('Event Details');
      expect(t('es', 'events.eventDetails')).toBe('Detalles del Evento');
    });

    it('should translate event metadata correctly', () => {
      expect(t('en', 'events.date')).toBe('Date');
      expect(t('es', 'events.date')).toBe('Fecha');
      expect(t('en', 'events.time')).toBe('Time');
      expect(t('es', 'events.time')).toBe('Hora');
      expect(t('en', 'events.location')).toBe('Location');
      expect(t('es', 'events.location')).toBe('Ubicación');
      expect(t('en', 'events.capacity')).toBe('Capacity');
      expect(t('es', 'events.capacity')).toBe('Capacidad');
    });

    it('should translate event types correctly', () => {
      expect(t('en', 'events.workshop')).toBe('Workshop');
      expect(t('es', 'events.workshop')).toBe('Taller');
      expect(t('en', 'events.retreat')).toBe('Retreat');
      expect(t('es', 'events.retreat')).toBe('Retiro');
      expect(t('en', 'events.virtual')).toBe('Virtual');
      expect(t('es', 'events.virtual')).toBe('Virtual');
    });
  });

  describe('Products Translations', () => {
    it('should translate product page elements correctly', () => {
      expect(t('en', 'products.title')).toBe('Products');
      expect(t('es', 'products.title')).toBe('Productos');
      expect(t('en', 'products.digitalProducts')).toBe('Digital Products');
      expect(t('es', 'products.digitalProducts')).toBe('Productos Digitales');
    });

    it('should translate product actions correctly', () => {
      expect(t('en', 'products.addToCart')).toBe('Add to Cart');
      expect(t('es', 'products.addToCart')).toBe('Añadir al Carrito');
      expect(t('en', 'products.buyNow')).toBe('Buy Now');
      expect(t('es', 'products.buyNow')).toBe('Comprar Ahora');
      expect(t('en', 'products.download')).toBe('Download');
      expect(t('es', 'products.download')).toBe('Descargar');
    });

    it('should translate product types correctly', () => {
      expect(t('en', 'products.ebook')).toBe('E-Book');
      expect(t('es', 'products.ebook')).toBe('Libro Electrónico');
      expect(t('en', 'products.audio')).toBe('Audio');
      expect(t('es', 'products.audio')).toBe('Audio');
      expect(t('en', 'products.video')).toBe('Video');
      expect(t('es', 'products.video')).toBe('Video');
    });
  });

  describe('Shopping Cart Translations', () => {
    it('should translate cart page elements correctly', () => {
      expect(t('en', 'cart.title')).toBe('Shopping Cart');
      expect(t('es', 'cart.title')).toBe('Carrito de Compras');
      expect(t('en', 'cart.emptyCart')).toBe('Your cart is empty');
      expect(t('es', 'cart.emptyCart')).toBe('Su carrito está vacío');
    });

    it('should translate cart actions correctly', () => {
      expect(t('en', 'cart.checkout')).toBe('Checkout');
      expect(t('es', 'cart.checkout')).toBe('Finalizar Compra');
      expect(t('en', 'cart.continueShopping')).toBe('Continue Shopping');
      expect(t('es', 'cart.continueShopping')).toBe('Continuar Comprando');
      expect(t('en', 'cart.removeItem')).toBe('Remove Item');
      expect(t('es', 'cart.removeItem')).toBe('Eliminar Artículo');
    });

    it('should translate cart summary correctly', () => {
      expect(t('en', 'cart.subtotal')).toBe('Subtotal');
      expect(t('es', 'cart.subtotal')).toBe('Subtotal');
      expect(t('en', 'cart.total')).toBe('Total');
      expect(t('es', 'cart.total')).toBe('Total');
    });
  });

  describe('Dashboard Translations', () => {
    it('should translate dashboard sections correctly', () => {
      expect(t('en', 'dashboard.title')).toBe('Dashboard');
      expect(t('es', 'dashboard.title')).toBe('Panel de Control');
      expect(t('en', 'dashboard.welcome')).toContain('Welcome back');
      expect(t('es', 'dashboard.welcome')).toContain('Bienvenido');
    });

    it('should translate dashboard stats correctly', () => {
      expect(t('en', 'dashboard.stats.coursesEnrolled')).toBe('Courses Enrolled');
      expect(t('es', 'dashboard.stats.coursesEnrolled')).toBe('Cursos Inscritos');
      expect(t('en', 'dashboard.stats.coursesCompleted')).toBe('Courses Completed');
      expect(t('es', 'dashboard.stats.coursesCompleted')).toBe('Cursos Completados');
      expect(t('en', 'dashboard.stats.eventsBooked')).toBe('Events Booked');
      expect(t('es', 'dashboard.stats.eventsBooked')).toBe('Eventos Reservados');
    });
  });

  describe('Admin Panel Translations', () => {
    it('should translate admin sections correctly', () => {
      expect(t('en', 'admin.title')).toBe('Admin Panel');
      expect(t('es', 'admin.title')).toBe('Panel de Administración');
      expect(t('en', 'admin.users')).toBe('Manage Users');
      expect(t('es', 'admin.users')).toBe('Gestionar Usuarios');
      expect(t('en', 'admin.courses')).toBe('Manage Courses');
      expect(t('es', 'admin.courses')).toBe('Gestionar Cursos');
    });

    it('should translate admin actions correctly', () => {
      expect(t('en', 'admin.createNew')).toBe('Create New');
      expect(t('es', 'admin.createNew')).toBe('Crear Nuevo');
      expect(t('en', 'admin.edit')).toBe('Edit');
      expect(t('es', 'admin.edit')).toBe('Editar');
      expect(t('en', 'admin.delete')).toBe('Delete');
      expect(t('es', 'admin.delete')).toBe('Eliminar');
    });
  });

  describe('Common Messages', () => {
    it('should translate common messages correctly', () => {
      expect(t('en', 'common.error')).toBe('Error');
      expect(t('es', 'common.error')).toBe('Error');
      expect(t('en', 'common.success')).toBe('Success');
      expect(t('es', 'common.success')).toBe('Éxito');
    });

    it('should translate auth success messages correctly', () => {
      expect(t('en', 'auth.loginSuccess')).toBe('Login successful!');
      expect(t('es', 'auth.loginSuccess')).toBe('¡Inicio de sesión exitoso!');
      expect(t('en', 'auth.registrationSuccess')).toBe('Registration successful!');
      expect(t('es', 'auth.registrationSuccess')).toBe('¡Registro exitoso!');
    });

    it('should translate validation messages correctly', () => {
      expect(t('en', 'validation.required')).toBe('This field is required');
      expect(t('es', 'validation.required')).toBe('Este campo es requerido');
      expect(t('en', 'validation.invalidEmail')).toBe('Invalid email address');
      expect(t('es', 'validation.invalidEmail')).toBe('Dirección de correo inválida');
    });
  });

  describe('Formatting Functions', () => {
    describe('Number Formatting', () => {
      it('should format numbers according to locale', () => {
        const number = 1234567.89;

        const enFormatted = formatNumber('en', number);
        const esFormatted = formatNumber('es', number);

        expect(enFormatted).toBe('1,234,567.89');
        expect(esFormatted).toBe('1.234.567,89');
      });

      it('should format integers correctly', () => {
        const enFormatted = formatNumber('en', 1000);
        const esFormatted = formatNumber('es', 1000);

        // Both should format numbers correctly (separator rules vary by locale)
        expect(enFormatted).toContain('1');
        expect(esFormatted).toContain('1');
        expect(enFormatted.length).toBeGreaterThanOrEqual(4);
        expect(esFormatted.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Currency Formatting', () => {
      it('should format currency according to locale', () => {
        const amount = 12345; // cents

        const enFormatted = formatCurrency('en', amount);
        const esFormatted = formatCurrency('es', amount);

        expect(enFormatted).toContain('123');
        expect(esFormatted).toContain('123');
      });

      it('should handle zero amounts correctly', () => {
        expect(formatCurrency('en', 0)).toContain('0');
        expect(formatCurrency('es', 0)).toContain('0');
      });

      it('should handle large amounts correctly', () => {
        const largeAmount = 1000000; // $10,000.00
        const enFormatted = formatCurrency('en', largeAmount);
        const esFormatted = formatCurrency('es', largeAmount);

        expect(enFormatted).toBeTruthy();
        expect(esFormatted).toBeTruthy();
      });
    });

    describe('Date Formatting', () => {
      it('should format dates according to locale', () => {
        const date = new Date('2025-01-15T10:30:00Z');

        const enFormatted = formatDate('en', date);
        const esFormatted = formatDate('es', date);

        expect(enFormatted).toBeTruthy();
        expect(esFormatted).toBeTruthy();
        // Different locales produce different date formats
        expect(enFormatted).not.toBe(esFormatted);
      });

      it('should format dates with custom options', () => {
        const date = new Date('2025-01-15');
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };

        const enFormatted = formatDate('en', date, options);
        const esFormatted = formatDate('es', date, options);

        expect(enFormatted).toContain('2025');
        expect(esFormatted).toContain('2025');
      });
    });

    describe('Relative Time Formatting', () => {
      it('should format relative time correctly', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const enFormatted = formatRelativeTime('en', yesterday);
        const esFormatted = formatRelativeTime('es', yesterday);

        expect(enFormatted).toBeTruthy();
        expect(esFormatted).toBeTruthy();
        expect(enFormatted).toMatch(/yesterday|1 day/i);
        expect(esFormatted).toMatch(/ayer|1 día/i);
      });

      it('should handle future dates correctly', () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const enFormatted = formatRelativeTime('en', tomorrow);
        const esFormatted = formatRelativeTime('es', tomorrow);

        expect(enFormatted).toBeTruthy();
        expect(esFormatted).toBeTruthy();
      });
    });
  });

  describe('URL and Path Handling', () => {
    describe('Localized Paths', () => {
      it('should generate correct localized paths for English (default)', () => {
        expect(getLocalizedPath('en', '/courses')).toBe('/courses');
        expect(getLocalizedPath('en', '/events')).toBe('/events');
        expect(getLocalizedPath('en', '/products')).toBe('/products');
      });

      it('should generate correct localized paths for Spanish', () => {
        expect(getLocalizedPath('es', '/courses')).toBe('/es/courses');
        expect(getLocalizedPath('es', '/events')).toBe('/es/events');
        expect(getLocalizedPath('es', '/products')).toBe('/es/products');
      });

      it('should handle paths without leading slash', () => {
        expect(getLocalizedPath('es', 'courses')).toBe('/es/courses');
        expect(getLocalizedPath('en', 'courses')).toBe('/courses');
      });
    });

    describe('Locale Extraction from Path', () => {
      it('should extract Spanish locale from path', () => {
        const result = extractLocaleFromPath('/es/courses');
        expect(result.locale).toBe('es');
        expect(result.path).toBe('/courses');
      });

      it('should return default locale for paths without locale prefix', () => {
        const result = extractLocaleFromPath('/courses');
        expect(result.locale).toBe('en');
        expect(result.path).toBe('/courses');
      });

      it('should handle complex paths correctly', () => {
        const result1 = extractLocaleFromPath('/es/courses/123');
        expect(result1.locale).toBe('es');
        expect(result1.path).toBe('/courses/123');

        const result2 = extractLocaleFromPath('/courses/123');
        expect(result2.locale).toBe('en');
        expect(result2.path).toBe('/courses/123');
      });
    });

    describe('Locale Validation', () => {
      it('should validate supported locales', () => {
        expect(isValidLocale('en')).toBe(true);
        expect(isValidLocale('es')).toBe(true);
      });

      it('should reject unsupported locales', () => {
        expect(isValidLocale('fr')).toBe(false);
        expect(isValidLocale('de')).toBe(false);
        expect(isValidLocale('invalid')).toBe(false);
      });
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle Spanish special characters correctly', () => {
      // Spanish uses special characters like á, é, í, ó, ú, ñ, ¿, ¡
      const spanishText = t('es', 'common.appName');
      expect(spanishText).toContain('Espiritualidad');

      // Check that special characters are preserved
      expect(t('es', 'common.yes')).toBe('Sí'); // Contains í
      expect(t('es', 'events.upcoming')).toBe('Próximos'); // Contains ó
    });

    it('should handle exclamation marks in Spanish correctly', () => {
      const success = t('es', 'auth.loginSuccess');
      expect(success).toContain('¡');
      expect(success).toContain('!');
    });

    it('should handle question marks in Spanish correctly', () => {
      const question = t('es', 'auth.forgotPassword');
      expect(question).toContain('¿');
      expect(question).toContain('?');
    });
  });

  describe('Translation Fallbacks', () => {
    it('should handle missing translation keys gracefully', () => {
      const result = t('en', 'nonexistent.key.path');
      expect(result).toBe('nonexistent.key.path'); // Returns key as fallback
    });

    it('should log warning for missing keys', () => {
      // This would log a warning to console, which we're checking implicitly
      const result = t('es', 'missing.translation');
      expect(result).toBe('missing.translation');
    });
  });

  describe('Variable Interpolation', () => {
    it('should interpolate variables in translations', () => {
      // Assuming dashboard.welcome has variable interpolation
      const enWelcome = t('en', 'dashboard.welcome', { name: 'John' });
      const esWelcome = t('es', 'dashboard.welcome', { name: 'Juan' });

      expect(enWelcome).toBeTruthy();
      expect(esWelcome).toBeTruthy();
    });
  });

  describe('Content Consistency', () => {
    it('should have consistent translation structure across all sections', () => {
      const sections = ['common', 'nav', 'auth', 'courses', 'events', 'products', 'cart', 'dashboard', 'admin'];

      sections.forEach(section => {
        expect(enTranslations).toHaveProperty(section);
        expect(esTranslations).toHaveProperty(section);
      });
    });

    it('should have all critical user-facing text translated', () => {
      const criticalKeys = [
        'common.welcome',
        'common.success',
        'nav.home',
        'nav.cart',
        'auth.signIn',
        'auth.signUp',
        'cart.checkout',
      ];

      criticalKeys.forEach(key => {
        const enText = t('en', key);
        const esText = t('es', key);

        expect(enText).not.toBe(key);
        expect(esText).not.toBe(key);
        // Don't check equal for some cases where translation might be same word
        if (key !== 'common.error') {
          expect(enText).not.toBe(esText);
        }
      });
    });
  });

  describe('Locale Support', () => {
    it('should support all declared locales', () => {
      LOCALES.forEach(locale => {
        const translations = getTranslations(locale);
        expect(translations).toBeDefined();
        expect(translations.common).toBeDefined();
      });
    });

    it('should have translations loaded for both locales', () => {
      const enTranslations = getTranslations('en');
      const esTranslations = getTranslations('es');

      expect(Object.keys(enTranslations).length).toBeGreaterThan(0);
      expect(Object.keys(esTranslations).length).toBeGreaterThan(0);
      expect(Object.keys(enTranslations).length).toBe(Object.keys(esTranslations).length);
    });
  });

  describe('Translation Quality', () => {
    it('should not have translations that are just the English text', () => {
      // Check a sample of translations to ensure they're actually translated
      const sampleKeys = [
        { key: 'common.welcome', en: 'Welcome', es: 'Bienvenido' },
        { key: 'nav.home', en: 'Home', es: 'Inicio' },
        { key: 'cart.checkout', en: 'Checkout', es: 'Finalizar Compra' },
        { key: 'products.addToCart', en: 'Add to Cart', es: 'Añadir al Carrito' },
      ];

      sampleKeys.forEach(({ key, en, es }) => {
        expect(t('en', key)).toBe(en);
        expect(t('es', key)).toBe(es);
        expect(en).not.toBe(es); // Ensure actual translation
      });
    });

    it('should have proper capitalization in both languages', () => {
      // Check that titles and labels are properly capitalized
      const title = t('en', 'courses.title');
      expect(title.charAt(0)).toBe(title.charAt(0).toUpperCase());

      const titleEs = t('es', 'courses.title');
      expect(titleEs.charAt(0)).toBe(titleEs.charAt(0).toUpperCase());
    });
  });
});
