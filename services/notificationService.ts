
export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop.');
      return false;
    }

    if (Notification.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async sendNotification(title: string, body: string, icon?: string) {
    if (Notification.permission !== 'granted') return;

    // Tenta usar Service Worker se disponível, senão usa a API padrão
    try {
      const options = {
        body,
        icon: icon || 'https://naujnnypepexlyalfeta.supabase.co/storage/v1/object/public/public_assets/logo_finance.png',
        badge: 'https://naujnnypepexlyalfeta.supabase.co/storage/v1/object/public/public_assets/logo_finance.png',
        tag: 'financepro-reminder',
        renotify: true
      };

      new Notification(title, options);
    } catch (e) {
      console.error('Erro ao disparar notificação:', e);
    }
  },

  getPermissionStatus() {
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  }
};
