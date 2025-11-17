import * as ExpoHaptics from 'expo-haptics';
import { create } from 'zustand';
import { POSE_SEQUENCE } from '../constants/poseSequence';
import { stopAllSpeech } from '../services/speechService';
import { Pose } from '../types/pose';

// Geri bildirim mesajının tipini daha yapısal hale getir
type FeedbackType = 'success' | 'warning' | 'error' | 'info' | null;

// Saniyedeki titreşim sayısını belirler (500ms = saniyede 2 kez)
const HAPTIC_THROTTLE_INTERVAL = 500;

interface PoseCameraState {
  currentPose: Pose;
  currentIndex: number;
  totalPoses: number;
  isStable: boolean;
  isCapturing: boolean;
  isActive: boolean; // Tüm overlay'i kontrol etmek için
  showNextPoseArrows: boolean; // Okların görünürlüğünü kontrol eder
  feedback: {
    message: string;
    type: FeedbackType;
  };
  lastHapticTime: number; // Son titreşim zamanı (throttle için)
  capturedPhotos: Array<{ uri: string; pose: Pose }>; // Yakalanan fotoğraflar

  // Eylemler (Actions)
  setActive: (isActive: boolean) => void;
  setShowNextPoseArrows: (show: boolean) => void;
  setFeedback: (message: string, type?: FeedbackType) => void;
  clearFeedback: () => void;
  setStable: (isStable: boolean) => void;
  startCapture: () => void;
  endCapture: () => void;
  setCurrentPose: (pose: Pose) => void;
  setCurrentIndex: (index: number) => void;
  setTotalPoses: (total: number) => void;
  setNextPose: (nextPose: Pose) => void; // currentIndex'i artırır ve pozu ayarlar
  addPhoto: (uri: string, pose: Pose) => void; // Fotoğraf ekle
  
  // Sequence management methods
  nextSequence: () => void; // Move to next pose in sequence
  startSequence: () => void; // Start the pose sequence
  stopSequence: () => void; // Stop the pose sequence
  resetSequence: () => void; // Reset to first pose
}

export const usePoseCameraStore = create<PoseCameraState>((set, get) => ({
  currentPose: POSE_SEQUENCE[0],
  currentIndex: 0,
  totalPoses: POSE_SEQUENCE.length,
  isStable: false,
  isCapturing: false,
  isActive: false,
  showNextPoseArrows: false, // Varsayılan olarak oklar gizli
  feedback: { message: '', type: null },
  lastHapticTime: 0, // Başlangıç değeri
  capturedPhotos: [], // Yakalanan fotoğraflar

  setActive: (isActive) => set({ isActive }),

  setShowNextPoseArrows: (show) => set({ showNextPoseArrows: show }),

  setFeedback: (message, type) => {
    // Eğer type belirtilmemişse, mesajdan otomatik çıkar
    let feedbackType: FeedbackType = type || null;
    if (!feedbackType && message) {
      if (message.includes('✅')) {
        feedbackType = 'success';
      } else if (message.includes('⚠️')) {
        feedbackType = 'warning';
      } else if (message.includes('🔄')) {
        feedbackType = 'error';
      } else {
        feedbackType = 'info';
      }
    }
    
    // 1. Adım: UI mesajını HEMEN güncelle (titreşimi bekleme)
    set({ feedback: { message, type: feedbackType } });

    // *** ADIM 2: Warning veya error durumunda okları göster ***
    if (feedbackType === 'warning' || feedbackType === 'error') {
      set({ showNextPoseArrows: true });
    }

    const now = Date.now();
    
    // 2. Adım: Titreşim için "throttle" (azaltma) uygula
    // Son titreşimden bu yana 500ms'den az geçtiyse, YENİ titreşim yapma.
    if (now - get().lastHapticTime < HAPTIC_THROTTLE_INTERVAL) {
      return;
    }

    // 3. Adım: 500ms geçtiyse, titreşimi tetikle ve zamanı kaydet
    set({ lastHapticTime: now });

    // Feedback tipine göre haptik tetikle
    if (feedbackType === 'success') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    } else if (feedbackType === 'error' || feedbackType === 'warning') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
    }
  },

  clearFeedback: () => set({ feedback: { message: '', type: null } }),

  setStable: (isStable) =>
    set((state) => {
      // Eğer yeni değer mevcut değerle aynıysa, HİÇBİR ŞEY YAPMA.
      // Boş obje ({}) döndürmek, Zustand'a state'i değiştirmemesini söyler.
      if (state.isStable === isStable) {
        return {};
      }

      // Eğer değer farklıysa, state'i güncelle.
      return { isStable };
    }),

  startCapture: () => set({ isCapturing: true }),

  endCapture: () => set({ isCapturing: false }),

  setCurrentPose: (pose) => set({ currentPose: pose }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setTotalPoses: (total) => set({ totalPoses: total }),

  addPhoto: (uri, pose) =>
    set((state) => ({
      capturedPhotos: [...state.capturedPhotos, { uri, pose }],
    })),

  setNextPose: (nextPose) => {
    const newIndex = get().currentIndex + 1;
    if (newIndex < get().totalPoses) {
      set({
        currentPose: nextPose,
        currentIndex: newIndex,
        isStable: false, // Yeni poz için stabiliteyi sıfırla
        feedback: { message: 'Poz değişti!', type: 'info' }, // Örnek
      });
      // Poz geçişinde hafif bir haptik
      ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
    } else {
      // Tamamlandı
      set({ isActive: false }); // Asistanı kapat
    }
  },

  // Sequence management methods
  nextSequence: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < POSE_SEQUENCE.length) {
      set({
        currentPose: POSE_SEQUENCE[nextIndex],
        currentIndex: nextIndex,
        isStable: false, // Yeni poz için stabiliteyi sıfırla
        showNextPoseArrows: false, // Her yeni poza geçildiğinde okları gizle
      });
    } else {
      // Sequence tamamlandı
      set({ isActive: false });
    }
  },

  startSequence: () => {
    set({
      currentIndex: 0,
      currentPose: POSE_SEQUENCE[0],
      isActive: true,
      isStable: false,
      totalPoses: POSE_SEQUENCE.length,
      showNextPoseArrows: false, // Başlangıçta oklar gizli
    });
  },

  stopSequence: () => {
    set({ isActive: false });
  },

  resetSequence: () => {
    // Önce sesi durdur
    stopAllSpeech();
    
    set({
      currentIndex: 0,
      currentPose: POSE_SEQUENCE[0],
      isActive: false,
      isStable: false,
      totalPoses: POSE_SEQUENCE.length,
      showNextPoseArrows: false, // Reset'te oklar gizli
      capturedPhotos: [], // Fotoğrafları sıfırla
    });
  },
}));

