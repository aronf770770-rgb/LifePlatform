// modules/games/games.js

const GamesManager = {
    /**
     * פונקציה המנתבת למשחק המבוקש.
     * היא מצפה שיהיה קובץ index.html בתוך התיקייה של המשחק.
     */
    playGame: function(gameId) {
        // מציג הודעת טעינה קצרה בקונסול
        console.log(`Loading game: ${gameId}...`);
        
        // יצירת הנתיב היחסי לתיקיית המשחק
        // לדוגמה: ./sub_games/snake/index.html
        const gamePath = `./sub_games/${gameId}/index.html`;
        
        // ניווט לדף המשחק
        window.location.href = gamePath;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // ניתן להוסיף כאן לוגיקה עתידית לטעינת שמירות/שיאים מ-DataService
    console.log("Games module loaded.");
});