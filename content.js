// ChatGPT Typing Sounds Extension
class TypingSoundManager {
  constructor() {
    this.isTyping = false;
    this.typingInterval = null;
    this.audioContext = null;
    this.keyboardSounds = [];
    this.currentSoundIndex = 0;
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
    for (let i = 0; i < 7; i++) {
      const buffer = await this.createRealisticKeySound();
      this.keyboardSounds.push(buffer);
    }
    
    console.log('🔊 צלילי מקלדת ריאליסטיים נוצרו בהצלחה');
  }

  async createRealisticKeySound() {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08; // 80ms - קצר יותר
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      
      // יצירת צליל הקלדה ריאליסטי - שילוב של רעש ותדרים
      let sample = 0;
      
      // רעש לבן לאפקט הפלסטיק
      const noise = (Math.random() - 0.5) * 0.4;
      
      // תדרים גבוהים לקליק
      const click1 = Math.sin(2 * Math.PI * 2000 * t) * 0.3;
      const click2 = Math.sin(2 * Math.PI * 3500 * t) * 0.2;
      const click3 = Math.sin(2 * Math.PI * 5000 * t) * 0.1;
      
      // envelope חד וקצר
      const envelope = Math.exp(-t * 50) * Math.exp(-t * t * 200);
      
      // שילוב הצלילים
      sample = (noise + click1 + click2 + click3) * envelope * 0.15;
      
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
    gainNode.gain.value = 0.3;
    
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
      const nextDelay = 80 + Math.random() * 70;
      this.typingInterval = setTimeout(playSound, nextDelay);
    };
    
    // השהיה של 400ms לפני התחלת הצלילים
    this.typingInterval = setTimeout(playSound, 400);
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
    setTimeout(() => this.checkForTypingActivity(), 1000);
  }

  checkForTypingActivity() {
    let contentChanged = false;
    const now = Date.now();

    // בדיקה 1: האם יש כפתור Stop (אמצעי חיובי שהמודל כותב)
    const stopButton = document.querySelector('button[data-testid*="stop"]') || 
                      document.querySelector('button[aria-label*="Stop"]') ||
                      document.querySelector('button:contains("Stop")') ||
                      document.querySelector('[data-testid="stop-button"]');
    
    if (stopButton && stopButton.offsetParent !== null && !stopButton.disabled) {
      contentChanged = true;
      this.lastUpdateTime = now;
      console.log('🔍 זוהה כפתור Stop - המודל כותב');
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
    else if (this.isTyping && (now - this.lastUpdateTime > 500)) {
      console.log('⏰ לא היה עדכון תוכן 500 מילישניות - הפסקת הקלדה');
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
    }, 1200);
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