# ChatGPT Typing Sounds 🎵

תוסף דפדפן שמשמיע צלילי הקלדה כשהמודל של ChatGPT עונה לך.

## איך זה עובד?

התוסף מזהה אוטומטית כשהמודל מתחיל לכתוב תשובה ומשמיע צלילי הקלדה ריאליסטיים. כשהתשובה מסתיימת, הצלילים נפסקים.

### שיפורים בגרסה החדשה:
- **צלילי הקלדה ריאליסטיים** - שילוב של רעש לבן ותדרים גבוהים ליצירת צליל פלסטיק אמיתי
- **זיהוי משופר** - מספר שכבות זיהוי לוודא שהצלילים נפסקים בזמן הנכון
- **ביצועים טובים יותר** - צלילים קצרים יותר (80ms) למהירות טבעית

## התקנה

### Chrome / Edge / Brave

1. פתח את הדפדפן ולך ל:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`

2. הפעל "Developer mode" (מצב מפתח) בפינה הימנית העליונה

3. לחץ על "Load unpacked" (טען לא ארוז)

4. בחר את התיקייה שבה נמצאים הקבצים של התוסף

5. התוסף יופיע ברשימת התוספים

### Firefox

1. לך ל `about:debugging`
2. לחץ על "This Firefox"
3. לחץ על "Load Temporary Add-on"
4. בחר את קובץ `manifest.json`

## שימוש

1. לך לאתר [chat.openai.com](https://chat.openai.com)
2. שאל שאלה כלשהי
3. תשמע צלילי הקלדה כשהמודל עונה!

## פתרון בעיות

### לא שומע צלילים?
- ודא שהקול של הדפדפן לא מושתק
- בדוק שהתוסף מופעל (יש לו סימן ירוק)
- פתח את Developer Tools (F12) ובדוק אם יש שגיאות בקונסול

### הצלילים לא נפסקים?
- רענן את הדף
- אם זה לא עוזר, כבה והפעל את התוסף
- בדוק בקונסול (F12) אם יש הודעות debug שמראות מה קורה

## קבצים בפרויקט

- `manifest.json` - הגדרות התוסף
- `content.js` - הקוד הראשי שמזהה הקלדה ומשמיע צלילים
- `sounds/` - תיקיית צלילים (לא בשימוש כרגע, הצלילים נוצרים דינמית)

## טכנולוגיות

- **Web Audio API** - ליצירת צלילי הקלדה ריאליסטיים
- **MutationObserver** - למעקב אחר שינויים בדף
- **Content Scripts** - להרצת הקוד בדף של ChatGPT
- **Synthetic Sound Generation** - יצירת צלילי מקלדת עם רעש ותדרים

## מה השתנה?

### צלילי הקלדה משופרים
במקום צלילי קסילופון, עכשיו יש צלילי הקלדה ריאליסטיים שמשלבים:
- רעש לבן לאפקט הפלסטיק
- תדרים גבוהים (2000-5000 Hz) לקליק
- Envelope חד וקצר לצליל טבעי

### זיהוי טוב יותר של סיום התשובה
התוסף עכשיו בודק:
1. כפתור "Stop generating" - הסימן הכי ברור
2. אלמנטים עם אינדיקטורים של streaming
3. הודעה אחרונה שמתעדכנת
4. Cursor מהבהב או אלמנטים דינמיים

## רישיון

MIT License - תעשה עם זה מה שאתה רוצה! 🚀 