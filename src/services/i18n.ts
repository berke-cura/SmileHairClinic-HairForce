// src/services/i18n.ts
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
// Store import'unu BURADAN KALDIRIN

// Tüm dil dosyalarını import et
import en from '../../locales/en.json';
import tr from '../../locales/tr.json';
import de from '../../locales/de.json';
import ar from '../../locales/ar.json';
import fr from '../../locales/fr.json';
import it from '../../locales/it.json';

const i18n = new I18n({
  en, tr, de, ar, fr, it,
});

// --- DİLİ AYARLAMA KISMINI TAMAMEN KALDIR ---
// (Artık _layout.tsx dosyasında yapılacak)

// Sadece cihazın varsayılan dilini GEÇİCİ olarak ayarla
// (Uygulama yüklenene kadar bir şey göstermek için)
const userLocale = Localization.getLocales()[0]?.languageCode || 'en';
i18n.locale = userLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// RTL ayarlarını BURADAN KALDIR (Artık _layout.tsx dosyasında yapılacak)

export const t = (key: string, options?: any) => i18n.t(key, options);

export default i18n; // 'i18n' örneğini (instance) dışa aktar

