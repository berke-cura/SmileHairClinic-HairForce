import { useEffect, useRef } from 'react';
import { Gyroscope } from 'expo-sensors';

export const useGyroscope = (onData: (data: any) => void) => {
  const callbackRef = useRef(onData);

  // Callback'i her zaman güncel tut
  useEffect(() => {
    callbackRef.current = onData;
  }, [onData]);

  useEffect(() => {
    let subscription: any = null;
    let isMounted = true;

    const setupGyroscope = async () => {
      try {
        // İzinleri kontrol et ve iste
        const { status } = await Gyroscope.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Gyroscope.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            console.warn('Gyroscope permission not granted');
            return;
          }
        }

        // Sensor'ün mevcut olup olmadığını kontrol et
        const available = await Gyroscope.isAvailableAsync();
        if (!available) {
          console.warn('Gyroscope not available on this device');
          return;
        }

        // Update interval'ı ayarla (100ms)
        Gyroscope.setUpdateInterval(100);

        // Listener ekle
        subscription = Gyroscope.addListener((data) => {
          if (isMounted) {
            callbackRef.current(data);
          }
        });
      } catch (error) {
        console.error('Error setting up Gyroscope:', error);
      }
    };

    setupGyroscope();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []); // Boş dependency array - sadece mount/unmount'ta çalışır
};

