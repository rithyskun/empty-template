export function useToast() {
  function success(message: string) {
    console.log('[Toast Success]', message);
  }

  function error(message: string) {
    console.error('[Toast Error]', message);
  }

  function info(message: string) {
    console.info('[Toast Info]', message);
  }

  function warning(message: string) {
    console.warn('[Toast Warning]', message);
  }

  return {
    success,
    error,
    info,
    warning,
  };
}
