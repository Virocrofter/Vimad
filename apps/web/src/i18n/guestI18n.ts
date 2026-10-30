/* apps/web/src/i18n/guestI18n.ts — P6: guest-portal chrome i18n (EN/ZU/AF).
 * Scope: navigation chrome + shared labels via the layout; page bodies are
 * translated incrementally. setGuestLocale persists and reloads, so
 * module-level t() calls in the layout stay correct. */

export type GuestLocale = 'en' | 'zu' | 'af';

const dict = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.key': 'Key',
    'nav.stay': 'Stay',
    'nav.billing': 'Billing',
    'nav.more': 'More',
    'nav.help': 'Help',
    'nav.profile': 'Profile',
    'nav.signOut': 'Sign out',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.retry': 'Retry',
    'locale.label': 'Language',
  },
  zu: {
    'nav.dashboard': 'Ideshibhodi',
    'nav.key': 'UKhiye',
    'nav.stay': 'Ukuhlala',
    'nav.billing': 'Ibhili',
    'nav.more': 'Okuningi',
    'nav.help': 'Usizo',
    'nav.profile': 'Iphrofayela',
    'nav.signOut': 'Phuma',
    'common.save': 'Gcina',
    'common.cancel': 'Khansela',
    'common.retry': 'Zama futhi',
    'locale.label': 'Ulimi',
  },
  af: {
    'nav.dashboard': 'Dashboard',
    'nav.key': 'Sleutel',
    'nav.stay': 'Verblyf',
    'nav.billing': 'Rekening',
    'nav.more': 'Meer',
    'nav.help': 'Hulp',
    'nav.profile': 'Profiel',
    'nav.signOut': 'Meld af',
    'common.save': 'Stoor',
    'common.cancel': 'Kanselleer',
    'common.retry': 'Probeer weer',
    'locale.label': 'Taal',
  },
} as const;

export type GuestI18nKey = keyof (typeof dict)['en'];

const STORAGE_KEY = 'gp_locale';

function detect(): GuestLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zu' || saved === 'af') return saved;
  } catch {
    /* private mode */
  }
  const nav = (navigator.language ?? 'en').slice(0, 2).toLowerCase();
  if (nav === 'zu' || nav === 'af') return nav;
  return 'en';
}

let current: GuestLocale = detect();

export function getGuestLocale(): GuestLocale {
  return current;
}

export function setGuestLocale(locale: GuestLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* private mode */
  }
  window.location.reload();
}

export function t(key: GuestI18nKey): string {
  return dict[current][key] ?? dict.en[key] ?? key;
}
