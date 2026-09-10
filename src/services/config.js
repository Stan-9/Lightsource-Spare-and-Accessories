import { 
  doc, 
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';

const settingsDoc = doc(db, 'settings', 'shop');

const result = (success, data = null, error = null) => ({ success, data, error });

const DEFAULT_SETTINGS = {
  shopName: "Gear Link Spares and Accessories",
  whatsappNumber: "254700000000",
  contactNumber: "0728490713 / 0716778794",
  paybillNumber: "247247",
  paybillAccount: "0728490713"
};

export const getSettings = async () => {
  try {
    const snapshot = await getDoc(settingsDoc);
    if (snapshot.exists()) {
      return { ...DEFAULT_SETTINGS, ...snapshot.data() };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error fetching settings: ", error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (settingsData) => {
  try {
    await setDoc(settingsDoc, settingsData, { merge: true });
    return result(true);
  } catch (error) {
    console.error("Error updating settings: ", error);
    return result(false, null, error.message);
  }
};

export const subscribeSettings = (callback) => {
  return onSnapshot(settingsDoc, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_SETTINGS, ...snapshot.data() });
    } else {
      callback(DEFAULT_SETTINGS);
    }
  }, (error) => {
    console.error("Error subscribing to settings: ", error);
  });
};
