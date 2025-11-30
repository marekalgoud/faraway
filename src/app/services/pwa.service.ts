import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  public isOnline = signal(navigator.onLine);
  public isStandalone = signal(this.checkStandalone());
  public canInstall = signal(false);
  public updateAvailable = signal(false);

  private deferredPrompt: any = null;

  constructor() {
    this.registerServiceWorker();
    this.setupOnlineListener();
    this.setupInstallPrompt();
  }

  /**
   * Vérifie si l'app est en mode standalone (installée)
   */
  private checkStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Enregistre le Service Worker
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[PWA] Service Worker enregistré:', registration.scope);

        // Vérifier les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Mise à jour disponible');
                this.updateAvailable.set(true);
              }
            });
          }
        });

        // Vérifier périodiquement les mises à jour (toutes les heures)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    }
  }

  /**
   * Écoute les changements de connexion
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('[PWA] Connexion rétablie');
      this.isOnline.set(true);
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Connexion perdue');
      this.isOnline.set(false);
    });
  }

  /**
   * Capture l'événement beforeinstallprompt
   */
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
      console.log('[PWA] Installation disponible');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Application installée');
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  }

  /**
   * Déclenche l'installation de la PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log('[PWA] Résultat de l\'installation:', outcome);
    
    this.deferredPrompt = null;
    this.canInstall.set(false);

    return outcome === 'accepted';
  }

  /**
   * Force la mise à jour de l'application
   */
  async forceUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications non supportées');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Affiche une notification
   */
  async showNotification(title: string, options?: NotificationOptions) {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          icon: '/android-chrome-192x192.png',
          badge: '/favicon-32x32.png',
          ...options
        });
      }
    }
  }
}
