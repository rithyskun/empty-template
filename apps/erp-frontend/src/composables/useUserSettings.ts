import { ref } from 'vue';

interface SettingValue {
  value?: string;
  parsedValue?: string;
}

const settings = ref<Record<string, SettingValue | string>>({});

export function useUserSettings() {
  const getSetting = (key: string): unknown => {
    return settings.value[key];
  };
  return {
    settings,
    getSetting,
  };
}
