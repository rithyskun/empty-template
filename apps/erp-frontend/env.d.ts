/// <reference types="vite/client" />

import 'vue-i18n';

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (typeof import('vue-i18n'))['useI18n']['t'];
    $i18n: (typeof import('vue-i18n'))['useI18n'];
  }
}
