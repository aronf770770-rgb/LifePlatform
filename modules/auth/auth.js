// modules/auth/auth.js

// כאן מכניסים משתמשים. משתמש ברירת מחדל: 1234 / 1234
const users = [
    { username: '1234', password: '1234' }
];

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // מונע רענון של הדף בעת שליחת הטופס

        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        // בדיקת אימות מול מערך המשתמשים
        const isValidUser = users.some(user => user.username === usernameInput && user.password === passwordInput);

        if (isValidUser) {
            // שמירת מצב חיבור בזכרון הזמני (Session)
            // זה מאפשר ל-AppManager לדעת שאנחנו מחוברים ולהפעיל את טיימר הניתוק
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // מעבר לדף הראשי (שאותו נבנה בשלב הבא)
            window.location.href = '../dashboard/dashboard.html';
        } else {
            // הצגת הודעת שגיאה אם הפרטים לא נכונים
            errorMessage.textContent = 'שם משתמש או סיסמה שגויים. נסה שוב.';
        }
    });
});