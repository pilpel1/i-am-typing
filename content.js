// ChatGPT Typing Sounds Extension

// Constants
const TYPING_SOUND_FILE = 'sounds/typing.mp3'; // קובץ הצליל הארוך
const KEY_SOUND_GAIN = 0.3;
const INITIAL_TYPING_DELAY_MS = 400;
const NO_CONTENT_UPDATE_STOP_TYPING_MS = 500;
const INACTIVITY_TIMEOUT_SAFETY_NET_MS = 1200;
const INITIAL_ACTIVITY_CHECK_DELAY_MS = 1000;

class TypingSoundManager {
  constructor() {
    this.isTyping = false;
    this.audioContext = null;
    this.typingBuffer = null;
    this.currentSource = null;
    this.gainNode = null;
    this.lastUpdateTime = 0;
    this.inactivityTimeout = null;
    
    this.init();
  }

  async init() {
    console.log('🎵 ChatGPT Typing Sounds - מתחיל...');
    
    // טעינת צליל ההקלדה
    await this.loadTypingSound();
    
    // התחלת מעקב אחר שינויים בדף
    this.startObserving();
  }

  async loadTypingSound() {
    // יצירת AudioContext
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // טעינת קובץ הצליל
    this.typingBuffer = await this.loadAudioFile(TYPING_SOUND_FILE);
    
    if (this.typingBuffer) {
      console.log('🔊 צליל הקלדה נטען בהצלחה');
    } else {
      console.error('❌ לא ניתן לטעון את קובץ הצליל');
    }
  }

  async loadAudioFile(url) {
    try {
      // קבלת URL מלא של התוסף
      const fullUrl = chrome.runtime.getURL(url);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error(`❌ לא ניתן לטעון ${url}:`, error);
      return null;
    }
  }

  startTyping() {
    if (this.isTyping || !this.typingBuffer) return;
    
    this.isTyping = true;
    console.log('⌨️ התחלת הקלדה...');
    
    // השהיה לפני התחלת הצליל
    setTimeout(() => {
      if (this.isTyping) {
        this.playTypingLoop();
      }
    }, INITIAL_TYPING_DELAY_MS);
  }

  playTypingLoop() {
    if (!this.isTyping || !this.typingBuffer) return;

    // יצירת source חדש
    this.currentSource = this.audioContext.createBufferSource();
    this.gainNode = this.audioContext.createGain();
    
    this.currentSource.buffer = this.typingBuffer;
    this.currentSource.loop = true; // לופ אינסופי
    
    // עוצמת קול
    this.gainNode.gain.value = KEY_SOUND_GAIN;
    
    // חיבור השרשרת
    this.currentSource.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    
    // התחלת הצליל
    this.currentSource.start();
  }

  stopTyping() {
    if (!this.isTyping) return;
    
    this.isTyping = false;
    console.log('🛑 הפסקת הקלדה');
    
    // עצירת הצליל
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // אם כבר נעצר - לא נורא
      }
      this.currentSource = null;
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
          // בדיקה יותר מתקדמת - רק אם השינוי קשור לתוכן הודעות
          const targetElement = mutation.target;
          if (this.isRelevantChange(targetElement)) {
            this.checkForTypingActivity();
          }
        }
      });
    });

    // התחלת מעקב על כל הדף
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // בדיקה ראשונית - חכה יותר שהדף יתייצב
    setTimeout(() => this.checkForTypingActivity(), INITIAL_ACTIVITY_CHECK_DELAY_MS * 3);
  }

  isRelevantChange(targetElement) {
    // בדוק אם השינוי קשור לאזור ההודעות של ChatGPT
    if (!targetElement) return false;
    
    // חיפוש עלה במעלה העץ עד למציאת אלמנט רלוונטי
    let current = targetElement;
    for (let i = 0; i < 10 && current; i++) {
      // אם זה אזור ההודעות
      if (current.getAttribute && (
        current.getAttribute('data-message-author-role') === 'assistant' ||
        current.querySelector && current.querySelector('[data-message-author-role="assistant"]')
      )) {
        return true;
      }
      current = current.parentElement;
    }
    
    return false;
  }

  checkForTypingActivity() {
    let contentChanged = false;
    const now = Date.now();

    // בדיקה 1: האם יש כפתור Stop (האמצעי הכי מהימן)
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
        break;
      }
    }
    
    // בדיקה 2: האם התוכן משתנה בהודעת assistant
    if (!contentChanged) {
      const lastMessage = document.querySelector('[data-message-author-role="assistant"]:last-child');
      if (lastMessage && this.isElementUpdating(lastMessage)) {
        contentChanged = true;
        this.lastUpdateTime = now;
        console.log('🔍 זוהה עדכון תוכן בהודעת assistant');
      }
    }

    // החלטה: התחל הקלדה אם יש שינוי תוכן
    if (contentChanged && !this.isTyping) {
      this.startTyping();
      this.resetInactivityTimer();
    } 
    // אם אין שינוי כבר חצי שנייה - הפסק הקלדה
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