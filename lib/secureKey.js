import * as SecureStore from 'expo-secure-store';

/**
 * Save Gemini API key securely on device
 */
export async function saveGeminiKey(key) {
  await SecureStore.setItemAsync('GEMINI_KEY', key);
}

/**
 * Get Gemini API key from secure storage
 */
export async function getGeminiKey() {
  return await SecureStore.getItemAsync('GEMINI_KEY');
}

/**
 * Check if Gemini key exists
 */
export async function hasGeminiKey() {
  const key = await getGeminiKey();
  return key !== null && key !== '';
}

/**
 * Delete Gemini key (for logout/reset)
 */
export async function deleteGeminiKey() {
  await SecureStore.deleteItemAsync('GEMINI_KEY');
}

