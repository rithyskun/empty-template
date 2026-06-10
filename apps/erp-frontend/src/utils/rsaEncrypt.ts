import { JSEncrypt } from 'jsencrypt';
import { useFetchApi } from '@/composables/useFetchApi';

export async function fetchRsaPublicKey(): Promise<string | null> {
  try {
    const { fetchApi } = useFetchApi();
    const res = await fetchApi<{ enabled: boolean; publicKey?: string }>(
      '/api/v1/auth/rsa-key',
    );
    if (res.data.enabled && res.data.publicKey) {
      return res.data.publicKey;
    }
    return null;
  } catch {
    return null;
  }
}

export function encryptWithRsa(
  plainText: string,
  publicKey: string,
): string | false {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  return encryptor.encrypt(plainText);
}
