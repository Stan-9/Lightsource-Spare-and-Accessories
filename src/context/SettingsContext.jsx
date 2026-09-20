import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeSettings } from '../services/config';

const DEFAULT_SETTINGS = {
  shopName:       '',
  whatsappNumber: '',
  contactNumber:  '',
  paybillNumber:  '',
  paybillAccount: '',
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSettingsState: () => {},
});

/**
 * Provides a single `subscribeSettings` listener for the entire app.
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = subscribeSettings((data) => {
      setSettings(data);
    });
    return unsubscribe;
  }, []);

  const updateSettingsState = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettingsState }}>
      {children}
    </SettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;
