import * as Speech from 'expo-speech';

// ============================================================================
// Configuration Constants
// ============================================================================
const SPEECH_DEBOUNCE = 2000; // Minimum time between normal priority messages (ms)
const REPEAT_DEBOUNCE = 5000; // Minimum time before repeating the same message (ms)
const INTER_MESSAGE_DELAY = 300; // Delay between queued messages (ms)
const STOP_DELAY = 200; // Delay after stopping speech before starting new one (ms)
const QUEUE_POLL_INTERVAL = 100; // Polling interval for waitForSpeechToFinish (ms)
const FINISH_SAFETY_DELAY = 200; // Extra safety delay after speech finishes (ms)

// ============================================================================
// Language Detection & Conversion
// ============================================================================
/**
 * Converts language code (e.g., 'tr', 'de') to locale format (e.g., 'tr-TR', 'de-DE')
 * Required by expo-speech API
 */
const convertLanguageToLocale = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'tr': 'tr-TR',
    'de': 'de-DE',
    'ar': 'ar-SA', // Arabic (Saudi Arabia)
    'fr': 'fr-FR',
    'it': 'it-IT',
  };
  
  return languageMap[languageCode] || 'en-US';
};

/**
 * Auto-detects language from text content (fallback method)
 * Returns 'tr-TR' for Turkish, 'en-US' for English (default)
 * Detects Turkish by checking for Turkish-specific characters
 */
const detectLanguage = (text: string): string => {
  // Turkish-specific characters: ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
  
  // Common Turkish words for better detection
  const turkishWords = /\b(ve|ile|için|bu|şu|o|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|var|yok|evet|hayır|tamam|merhaba|hoşgeldiniz|lütfen|teşekkür|sağol|nasıl|ne|kim|nerede|neden|iyi|kötü|güzel|çirkin|büyük|küçük|yeni|eski|hızlı|yavaş|açık|kapalı|kolay|zor|mutlu|üzgün|aç|tok|hasta|sağlıklı|zengin|fakir|akıllı|aptal|genç|yaşlı|uzun|kısa|kalın|ince|geniş|dar|yüksek|alçak|temiz|kirli|dolu|boş|ağır|hafif|sert|yumuşak|parlak|mat|renkli|renksiz|canlı|ölü|hareketli|sabit|erken|geç|önce|sonra|şimdi|dün|bugün|yarın|biz|siz|onlar|ben|sen|benim|senin|onun|bizim|sizin|onların)\b/i;
  
  if (turkishChars.test(text) || turkishWords.test(text)) {
    return 'tr-TR';
  }
  return 'en-US';
};

// ============================================================================
// State Management
// ============================================================================
interface SpeechItem {
  text: string;
  priority: 'high' | 'normal';
  timestamp: number;
  language?: string; // Optional language code (e.g., 'tr', 'de', 'ar')
}

let isSpeaking = false;
let lastSpeechTime = 0;
let speechQueue: SpeechItem[] = [];
let isProcessingQueue = false;
let currentSpeechPromise: Promise<void> | null = null;
let queueProcessingPromise: Promise<void> | null = null;
const messageDebounce: Record<string, number> = {};

// Global bayrak: Hizmetin devre dışı bırakılıp bırakılmadığını kontrol eder (örn: süreç iptal edildiğinde)
let isServiceDisabled = false;

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Safely stops current speech and waits for it to fully stop
 */
const safelyStopSpeech = async (): Promise<void> => {
  try {
    if (isSpeaking) {
      Speech.stop();
      // Wait for speech to fully stop
      await new Promise(resolve => setTimeout(resolve, STOP_DELAY));
    }
  } catch (error) {
    console.warn('[SpeechService] Error stopping speech:', error);
  }
};

/**
 * Resets all speech state (used on errors)
 */
const resetSpeechState = (): void => {
  isSpeaking = false;
  isProcessingQueue = false;
  currentSpeechPromise = null;
  queueProcessingPromise = null;
  // Don't clear queue on reset - let it continue processing
};

/**
 * Plays a single speech item and returns a promise that resolves when done
 */
const playSpeechItem = async (item: SpeechItem): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Use preferred language if provided, otherwise fallback to detection
      const language = item.language 
        ? convertLanguageToLocale(item.language)
        : detectLanguage(item.text);
      
      console.log(`[SpeechService] Speaking: "${item.text.substring(0, 50)}..." (${item.priority}, ${language})`);
      
      const speechOptions = {
        language,
        pitch: 1.0,
        rate: 0.97, // Normal speed (was 1.25)
        onDone: () => {
          console.log(`[SpeechService] Speech completed: "${item.text.substring(0, 50)}..."`);
          isSpeaking = false;
          resolve();
        },
        onStopped: () => {
          console.log(`[SpeechService] Speech stopped: "${item.text.substring(0, 50)}..."`);
          isSpeaking = false;
          resolve();
        },
        onError: (error: any) => {
          console.error(`[SpeechService] Speech error: "${item.text.substring(0, 50)}..."`, error);
          isSpeaking = false;
          reject(error);
        },
      };

      isSpeaking = true;
      lastSpeechTime = Date.now();
      Speech.speak(item.text, speechOptions);
    } catch (error) {
      console.error('[SpeechService] Error in playSpeechItem:', error);
      isSpeaking = false;
      reject(error);
    }
  });
};

/**
 * Processes the speech queue sequentially
 * Only one queue processor can run at a time
 */
const processQueue = async (): Promise<void> => {
  // Prevent concurrent queue processing
  if (isProcessingQueue) {
    console.log('[SpeechService] Queue already processing, skipping');
    return;
  }

  if (speechQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  queueProcessingPromise = (async () => {
    try {
      console.log(`[SpeechService] Starting queue processing (${speechQueue.length} items)`);
      
      while (speechQueue.length > 0) {
        // Stop any current speech before processing next item
        await safelyStopSpeech();
        
        const item = speechQueue.shift();
        if (!item) {
          break;
        }

        try {
          // Play the speech item
          currentSpeechPromise = playSpeechItem(item);
          await currentSpeechPromise;
          currentSpeechPromise = null;

          // Inter-message delay (except for last item)
          if (speechQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, INTER_MESSAGE_DELAY));
          }
        } catch (error) {
          console.error('[SpeechService] Error processing queue item:', error);
          // Continue with next item on error
          resetSpeechState();
        }
      }

      console.log('[SpeechService] Queue processing completed');
    } catch (error) {
      console.error('[SpeechService] Fatal error in queue processing:', error);
      resetSpeechState();
    } finally {
      isProcessingQueue = false;
      queueProcessingPromise = null;
    }
  })();

  await queueProcessingPromise;
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Speaks the given text with optional priority and language
 * @param text - Text to speak
 * @param priority - 'high' interrupts current speech, 'normal' queues
 * @param language - Language code (e.g., 'tr', 'de', 'ar'). If not provided, auto-detects from text
 */
export const speak = async (
  text: string, 
  priority: 'high' | 'normal' = 'normal',
  language?: string
): Promise<void> => {
  // --- KRİTİK KONTROL ---
  if (isServiceDisabled) {
    console.log('[SpeechService] Service is disabled. Ignoring speak request.');
    return; // Hizmet devre dışıysa hemen çık
  }
  // -----------------------

  if (!text || text.trim().length === 0) {
    console.warn('[SpeechService] Empty text provided to speak()');
    return;
  }

  try {
    const now = Date.now();
    const trimmedText = text.trim();

    // Debounce: Prevent repeating the same message too soon
    const lastPlayed = messageDebounce[trimmedText];
    if (lastPlayed && now - lastPlayed < REPEAT_DEBOUNCE) {
      console.log(`[SpeechService] Skipping duplicate message (debounced): "${trimmedText.substring(0, 50)}..."`);
      return;
    }

    // Throttle: Prevent normal priority messages too close together
    if (priority === 'normal' && now - lastSpeechTime < SPEECH_DEBOUNCE) {
      console.log(`[SpeechService] Skipping normal priority message (throttled): "${trimmedText.substring(0, 50)}..."`);
      return;
    }

    // Record message timestamp for debouncing
    messageDebounce[trimmedText] = now;

    // High priority: Interrupt current speech and clear queue
    if (priority === 'high') {
      console.log(`[SpeechService] High priority message received: "${trimmedText.substring(0, 50)}..."`);
      
      // Stop current speech and wait
      await safelyStopSpeech();
      
      // Clear queue and reset state
      speechQueue = [];
      resetSpeechState();
      
      // Wait a bit more to ensure clean state
      await new Promise(resolve => setTimeout(resolve, STOP_DELAY));
      
      // Play immediately
      try {
        currentSpeechPromise = playSpeechItem({ text: trimmedText, priority, timestamp: now, language });
        await currentSpeechPromise;
        currentSpeechPromise = null;
      } catch (error) {
        console.error('[SpeechService] Error playing high priority speech:', error);
        resetSpeechState();
        throw error;
      }
      
      return;
    }

    // Normal priority: Add to queue if not already speaking
    if (isSpeaking || isProcessingQueue) {
      // Check if same message already in queue
      const alreadyQueued = speechQueue.some(item => item.text === trimmedText);
      if (!alreadyQueued) {
        console.log(`[SpeechService] Queuing normal priority message: "${trimmedText.substring(0, 50)}..."`);
        speechQueue.push({ text: trimmedText, priority, timestamp: now, language });
        
        // Start queue processing if not already running
        if (!isProcessingQueue) {
          processQueue().catch(error => {
            console.error('[SpeechService] Error in processQueue:', error);
            resetSpeechState();
          });
        }
      } else {
        console.log(`[SpeechService] Message already in queue, skipping: "${trimmedText.substring(0, 50)}..."`);
      }
      return;
    }

    // No speech active: Play immediately
    console.log(`[SpeechService] Playing message immediately: "${trimmedText.substring(0, 50)}..."`);
    try {
      currentSpeechPromise = playSpeechItem({ text: trimmedText, priority, timestamp: now, language });
      await currentSpeechPromise;
      currentSpeechPromise = null;

      // Process queue if any items are waiting
      if (speechQueue.length > 0) {
        await processQueue();
      }
    } catch (error) {
      console.error('[SpeechService] Error playing speech:', error);
      resetSpeechState();
      
      // Try to process queue even after error
      if (speechQueue.length > 0) {
        processQueue().catch(err => {
          console.error('[SpeechService] Error processing queue after speech error:', err);
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('[SpeechService] Fatal error in speak():', error);
    resetSpeechState();
    throw error;
  }
};

/**
 * Returns true if speech is currently playing or queued
 */
export const isCurrentlySpeaking = (): boolean => {
  return isSpeaking || isProcessingQueue || speechQueue.length > 0;
};

/**
 * Waits for all speech to finish (current + queue)
 * Polls at regular intervals until everything is done
 */
export const waitForSpeechToFinish = async (): Promise<void> => {
  const maxWaitTime = 60000; // 60 seconds max wait
  const startTime = Date.now();

  while (isCurrentlySpeaking()) {
    // Safety check: Don't wait forever
    if (Date.now() - startTime > maxWaitTime) {
      console.warn('[SpeechService] waitForSpeechToFinish timeout after 60s, forcing stop');
      stopSpeaking();
      break;
    }

    await new Promise(resolve => setTimeout(resolve, QUEUE_POLL_INTERVAL));
  }

  // Extra safety delay to ensure speech is fully finished
  await new Promise(resolve => setTimeout(resolve, FINISH_SAFETY_DELAY));
  
  console.log('[SpeechService] All speech finished');
};

/**
 * Immediately stops all speech and clears the queue
 */
export const stopSpeaking = (): void => {
  try {
    console.log('[SpeechService] stopSpeaking() called');
    
    // Stop Expo Speech API
    Speech.stop();
    
    // Clear queue
    speechQueue = [];
    
    // Reset all state
    resetSpeechState();
    
    console.log('[SpeechService] Speech stopped and queue cleared');
  } catch (error) {
    console.error('[SpeechService] Error in stopSpeaking():', error);
    resetSpeechState();
  }
};

/**
 * Oynatılan tüm sesleri durdurur ve beklemedeki kuyruğu temizler.
 * Kamera sürecinin iptal edildiği veya tamamlandığı durumlarda kullanılır.
 */
export const stopAllSpeech = (): void => {
  try {
    console.log('[SpeechService] stopAllSpeech() called');
    
    // --- KRİTİK DEĞİŞİKLİK ---
    // Hizmeti KÖKTEN kapat
    isServiceDisabled = true;
    // -----------------------
    
    // O an oynayan sesi kes
    Speech.stop();
    
    // Kuyruğu temizle
    speechQueue = [];
    
    // Tüm state'i sıfırla
    resetSpeechState();
    
    console.log('[SpeechService] All speech stopped and queue cleared. Service disabled.');
  } catch (error) {
    console.error('[SpeechService] Error in stopAllSpeech():', error);
    resetSpeechState();
  }
};

/**
 * Speech servisini tekrar etkinleştirir.
 * Yeni bir fotoğraf çekme oturumu başladığında çağrılmalıdır.
 */
export const enableSpeech = (): void => {
  isServiceDisabled = false;
  console.log('[SpeechService] Service re-enabled');
};
