// ChatGPT Typing Sounds Extension

// Constants
const REALISTIC_KEY_SOUND_DURATION = 0.08; // 80ms
const KEY_SOUND_ENVELOPE_DECAY = 50;
const KEY_SOUND_ENVELOPE_SQUARED_DECAY = 200;
const KEY_SOUND_NOISE_AMPLITUDE = 0.4;
const KEY_SOUND_CLICK1_FREQ = 2000;
const KEY_SOUND_CLICK1_AMPLITUDE = 0.3;
const KEY_SOUND_CLICK2_FREQ = 3500;
const KEY_SOUND_CLICK2_AMPLITUDE = 0.2;
const KEY_SOUND_CLICK3_FREQ = 5000;
const KEY_SOUND_CLICK3_AMPLITUDE = 0.1;
const KEY_SOUND_FINAL_AMPLITUDE = 0.15;
const NUM_KEYBOARD_SOUNDS = 7;
const KEY_SOUND_GAIN = 0.3;
const MIN_TYPING_DELAY_MS = 80;
const RANDOM_TYPING_DELAY_MS = 70;
const INITIAL_TYPING_DELAY_MS = 400;
const NO_CONTENT_UPDATE_STOP_TYPING_MS = 500;
const INACTIVITY_TIMEOUT_SAFETY_NET_MS = 1200;
const INITIAL_ACTIVITY_CHECK_DELAY_MS = 1000;

class TypingSoundManager {
  constructor() {
    this.isTyping = false;
    this.typingInterval = null;
    this.audioContext = null;
    this.keyboardSounds = [];
    this.lastUpdateTime = 0;
    this.inactivityTimeout = null;
    
    this.init();
  }

  async init() {
    console.log('🎵 ChatGPT Typing Sounds - מתחיל...');
    
    // יצירת צלילי הקלדה ריאליסטיים
    await this.createKeyboardSounds();
    
    // התחלת מעקב אחר שינויים בדף
    this.startObserving();
  }

  async createKeyboardSounds() {
    // יצירת AudioContext
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // יצירת מספר צלילי מקלדת שונים - צלילים יותר ריאליסטיים
    for (let i = 0; i < NUM_KEYBOARD_SOUNDS; i++) {
      const buffer = await this.createRealisticKeySound();
      this.keyboardSounds.push(buffer);
    }
    
    console.log('🔊 צלילי מקלדת ריאליסטיים נוצרו בהצלחה');
  }

  async createRealisticKeySound() {
    const sampleRate = this.audioContext.sampleRate;
    const duration = REALISTIC_KEY_SOUND_DURATION;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      
      // יצירת צליל הקלדה ריאליסטי - שילוב של רעש ותדרים
      let sample = 0;
      
      // רעש לבן לאפקט הפלסטיק
      const noise = (Math.random() - 0.5) * KEY_SOUND_NOISE_AMPLITUDE;
      
      // תדרים גבוהים לקליק
      const click1 = Math.sin(2 * Math.PI * KEY_SOUND_CLICK1_FREQ * t) * KEY_SOUND_CLICK1_AMPLITUDE;
      const click2 = Math.sin(2 * Math.PI * KEY_SOUND_CLICK2_FREQ * t) * KEY_SOUND_CLICK2_AMPLITUDE;
      const click3 = Math.sin(2 * Math.PI * KEY_SOUND_CLICK3_FREQ * t) * KEY_SOUND_CLICK3_AMPLITUDE;
      
      // envelope חד וקצר
      const envelope = Math.exp(-t * KEY_SOUND_ENVELOPE_DECAY) * Math.exp(-t * t * KEY_SOUND_ENVELOPE_SQUARED_DECAY);
      
      // שילוב הצלילים
      sample = (noise + click1 + click2 + click3) * envelope * KEY_SOUND_FINAL_AMPLITUDE;
      
      data[i] = sample;
    }

    return buffer;
  }

  playKeySound() {
    if (!this.audioContext || this.keyboardSounds.length === 0) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    // בחירת צליל רנדומלי
    const soundIndex = Math.floor(Math.random() * this.keyboardSounds.length);
    source.buffer = this.keyboardSounds[soundIndex];
    
    // עוצמת קול נמוכה
    gainNode.gain.value = KEY_SOUND_GAIN;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  startTyping() {
    if (this.isTyping) return;
    
    this.isTyping = true;
    console.log('⌨️ התחלת הקלדה...');
    
    // השמעת צליל כל 80-150ms (מהירות הקלדה טבעית)
    const playSound = () => {
      if (!this.isTyping) return;
      
      this.playKeySound();
      
      // זמן רנדומלי בין צלילים
      const nextDelay = MIN_TYPING_DELAY_MS + Math.random() * RANDOM_TYPING_DELAY_MS;
      this.typingInterval = setTimeout(playSound, nextDelay);
    };
    
    // השהיה של 400ms לפני התחלת הצלילים
    this.typingInterval = setTimeout(playSound, INITIAL_TYPING_DELAY_MS);
  }

  stopTyping() {
    if (!this.isTyping) return;
    
    this.isTyping = false;
    console.log('🛑 הפסקת הקלדה');
    
    if (this.typingInterval) {
      clearTimeout(this.typingInterval);
      this.typingInterval = null;
    }
    
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  startObserving() {
    // מעקב אחר שינויים בתוכן הדף
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.checkForTypingActivity();
        }
      });
    });

    // התחלת מעקב על כל הדף
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // בדיקה ראשונית
    setTimeout(() => this.checkForTypingActivity(), INITIAL_ACTIVITY_CHECK_DELAY_MS);
  }

  checkForTypingActivity() {
    let contentChanged = false;
    const now = Date.now();

    // בדיקה 1: האם יש כפתור Stop (אמצעי חיובי שהמודל כותב)
    const stopButtonSelectors = [
      'button[data-testid*="stop"]',
      'button[aria-label*="Stop"]',
      '[data-testid="stop-button"]'
    ];
    
    for (const selector of stopButtonSelectors) {
      const stopButton = document.querySelector(selector);
      if (stopButton && stopButton.offsetParent !== null && !stopButton.disabled) {
        contentChanged = true;
        this.lastUpdateTime = now;
        console.log('🔍 זוהה כפתור Stop - המודל כותב');
        break; // Found a stop button, no need to check other selectors
      }
    }
    
    // בדיקה 2: האם התוכן משתנה בהודעה האחרונה
    const lastMessage = document.querySelector('[data-message-author-role="assistant"]:last-child');
    if (lastMessage && this.isElementUpdating(lastMessage)) {
      contentChanged = true;
      this.lastUpdateTime = now;
      console.log('🔍 זוהה עדכון תוכן - המודל כותב');
    }

    // בדיקה 3: חיפוש אלמנטים דינמיים
    const streamingIndicators = [
      '[data-testid*="streaming"]',
      '[class*="streaming"]',
      '[class*="generating"]',
      '.cursor-blink',
      '[class*="cursor"]',
      '[class*="typing"]'
    ];

    for (let selector of streamingIndicators) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          if (el.offsetParent !== null) {
            contentChanged = true;
            this.lastUpdateTime = now;
            console.log(`🔍 זוהה אלמנט דינמי: ${selector}`);
          }
        });
      }
    }

    // החלטה: התחל הקלדה אם יש שינוי תוכן
    if (contentChanged && !this.isTyping) {
      this.startTyping();
      this.resetInactivityTimer();
    } 
    // אם אין שינוי כבר 2 שניות - הפסק הקלדה
    else if (this.isTyping && (now - this.lastUpdateTime > NO_CONTENT_UPDATE_STOP_TYPING_MS)) {
      console.log(`⏰ לא היה עדכון תוכן ${NO_CONTENT_UPDATE_STOP_TYPING_MS} מילישניות - הפסקת הקלדה`);
      this.stopTyping();
    }
    // אם יש שינוי והוא כבר מקליד - אפס טיימר
    else if (contentChanged && this.isTyping) {
      this.resetInactivityTimer();
    }
  }

  resetInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    // אם אין עדכון תוכן 3 שניות - הפסק הקלדה (safety net)
    this.inactivityTimeout = setTimeout(() => {
      if (this.isTyping) {
        console.log('⏰ timeout בטיחות - הפסקת הקלדה');
        this.stopTyping();
      }
    }, INACTIVITY_TIMEOUT_SAFETY_NET_MS);
  }

  isElementUpdating(element) {
    if (!element) return false;
    
    // שמירת התוכן הנוכחי
    const currentContent = element.textContent || element.innerHTML;
    
    if (!element._lastContent) {
      element._lastContent = currentContent;
      return false;
    }

    // בדיקה אם התוכן השתנה
    if (element._lastContent !== currentContent) {
      element._lastContent = currentContent;
      return true;
    }

    return false;
  }
}

// התחלת התוסף כשהדף נטען
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TypingSoundManager();
  });
} else {
  new TypingSoundManager();
} 