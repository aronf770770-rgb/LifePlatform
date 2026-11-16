// modules/dashboard/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // הגנת נתיב: אם אין טוקן חיבור ב-Session, זרוק חזרה להתחברות
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = '../auth/auth.html';
        return;
    }

    // הודעה למפתחים (אתה) שהמודול נטען בהצלחה
    console.log('Dashboard module loaded and verified.');
    
    // בהמשך נוכל להוסיף כאן קריאות ל-DataService כדי להציג סטטיסטיקות,
    // למשל להציג כמה מתכונים יש, או האם יש משימה יומית פתוחה.
});