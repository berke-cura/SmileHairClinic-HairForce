import CameraScreen from '@/src/screens/CameraScreen';
import { Stack } from 'expo-router';

export default function CameraModal() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraScreen />
    </>
  );
}

