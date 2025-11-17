import { useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';

export const useMotion = (callback: (data: any) => void) => {
  const callbackRef = useRef(callback);

  // Callback'i her zaman güncel tut
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const setupMotion = async () => {
      try {
        // Sensor'ün mevcut olup olmadığını kontrol et
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (!isAvailable) {
          console.warn('DeviceMotion is not available on this device');
          return;
        }

        // İzinleri kontrol et ve iste
        const { status } = await DeviceMotion.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await DeviceMotion.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            console.warn('DeviceMotion permission not granted');
            return;
          }
        }

        // Update interval'ı ayarla (100ms)
        DeviceMotion.setUpdateInterval(100);

        // Listener ekle
        subscription = DeviceMotion.addListener((data) => {
          if (isMounted) {
            callbackRef.current(data);
          }
        });
      } catch (error) {
        console.error('Error setting up DeviceMotion:', error);
      }
    };

    setupMotion();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []); // Boş dependency array - sadece mount/unmount'ta çalışır
};

