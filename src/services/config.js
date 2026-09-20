import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { result } from './shared';

const settingsDoc = doc(db, 'settings', 'shop');

const DEFAULT_SETTINGS = {
  shopName:       'Gear Link Spares and Accessories',
  whatsappNumber: '254700000000',
  contactNumber:  '0728490713 / 0716778794',
  paybillNumber:  '247247',
  paybillAccount: '0728490713',
};

/**
 * One-shot fetch of shop settings, falling back to defaults if the document
 * does not yet exist or if a network error occurs.
 *
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export const getSettings = async () => {
  try {
    const snapshot = await getDoc(settingsDoc);
    return snapshot.exists()
      ? { ...DEFAULT_SETTINGS, ...snapshot.data() }
      : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Merge-updates the shop settings document.
 *
 * @param {Partial<typeof DEFAULT_SETTINGS>} settingsData
 */
export const updateSettings = async (settingsData) => {
  try {
    await setDoc(settingsDoc, settingsData, { merge: true });
    return result(true);
  } catch (error) {
    console.error('Error updating settings:', error);
    return result(false, null, error.message);
  }
};

/**
 * Real-time subscription to shop settings. Calls `callback` immediately with
 * the current value, then again on every subsequent change.
 *
 * @param {(settings: typeof DEFAULT_SETTINGS) => void} callback
 * @returns {() => void} Unsubscribe function.
 */
export const subscribeSettings = (callback) =>
  onSnapshot(
    settingsDoc,
    (snapshot) => {
      callback(
        snapshot.exists()
          ? { ...DEFAULT_SETTINGS, ...snapshot.data() }
          : DEFAULT_SETTINGS
      );
    },
    (error) => {
      console.error('Error subscribing to settings:', error);
    }
  );
