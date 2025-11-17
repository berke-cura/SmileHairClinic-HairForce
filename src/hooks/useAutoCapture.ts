import { useEffect, useRef, useState } from 'react';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Pose } from '../types/pose';
import { analyzePhoto } from '../services/photoAnalysisService';
import { isCurrentlySpeaking } from '../services/speechService';

interface UseAutoCaptureOptions {
  cameraRef: React.RefObject<CameraView | null>;
  isStable: boolean;
  currentPose: Pose;
  isAnalyzing: boolean; // Analiz devam ederken yeni fotoğraf çekilmesin
  onPhotoStart?: () => void; // Fotoğraf çekimi başladığında
  onPhotoCaptured: (uri: string, pose: Pose) => void;
  onPhotoAnalyzed: (result: { confirmed: boolean; feedback?: string }, pose: Pose) => void;
  onAllPosesCompleted: (totalPhotos: number) => void;
}

export const useAutoCapture = ({
  cameraRef,
  isStable,
  currentPose,
  isAnalyzing,
  onPhotoStart,
  onPhotoCaptured,
  onPhotoAnalyzed,
  onAllPosesCompleted,
}: UseAutoCaptureOptions) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const capturedCountRef = useRef(0);
  const isAnalyzingRef = useRef(false); // Ref ile analiz durumunu takip et

  // isAnalyzing state'ini ref'e senkronize et
  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    // Analiz devam ederken veya zaten çekim yapılırken yeni fotoğraf çekme
    // isAnalyzing kontrolü kritik - analiz bitene kadar kesinlikle yeni fotoğraf çekilmemeli
    // Hem state hem ref kontrolü yapıyoruz - ref daha hızlı güncellenir
    // Never capture a photo while TTS is speaking
    if (
      isStable &&
      !isCapturing &&
      !isAnalyzing &&
      !isAnalyzingRef.current &&
      cameraRef.current &&
      !isCurrentlySpeaking()
    ) {
      capturePhoto();
    }
  }, [isStable, isCapturing, isAnalyzing]);

  const capturePhoto = async () => {
    setIsCapturing(true);
    
    // Fotoğraf çekimi başladı callback'i
    if (onPhotoStart) {
      onPhotoStart();
    }

    // Haptic feedback
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic error:', error);
    }

    try {
      // Kaliteyi düşür (maliyet için) ve base64 al
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.5, // Düşük kalite
        base64: true, // Base64 formatında al
      });

      if (photo?.uri) {
        capturedCountRef.current += 1;
        
        // Analiz durumunu hemen true yap - yeni fotoğraf çekilmesini engelle
        isAnalyzingRef.current = true;
        
        // Callback'i çağır - bu setIsAnalyzing(true) yapacak
        onPhotoCaptured(photo.uri, currentPose);
        
        // isCapturing'i false yap ama analiz bitene kadar yeni fotoğraf çekilmeyecek
        // çünkü isAnalyzingRef.current = true
        setIsCapturing(false);
        
        // OpenAI ile analiz et
        try {
          const analysisResult = await analyzePhoto(photo.base64 || '', currentPose);
          // Analiz sonucunu callback'e gönder - bu setIsAnalyzing(false) yapacak
          // State güncellemesi useEffect ile ref'e senkronize edilecek
          onPhotoAnalyzed(analysisResult, currentPose);
        } catch (analysisError) {
          console.error('Photo analysis error:', analysisError);
          // Analiz hatası olsa bile devam et
          onPhotoAnalyzed({ confirmed: false, feedback: 'Analiz yapılamadı' }, currentPose);
        }
        // Ref, state güncellemesi ile useEffect tarafından otomatik senkronize edilecek
      } else {
        setIsCapturing(false);
        // Fotoğraf çekilemediyse analiz durumunu sıfırla
        isAnalyzingRef.current = false;
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      setIsCapturing(false);
    }
  };

  const resetCapture = () => {
    setIsCapturing(false);
    capturedCountRef.current = 0;
  };

  const getCapturedCount = () => capturedCountRef.current;

  return {
    isCapturing,
    resetCapture,
    getCapturedCount,
  };
};

