// js/DataService.js

const DataService = {
    get: async function(key) {
        return new Promise((resolve) => {
            try {
                const data = localStorage.getItem(key);
                resolve(data ? JSON.parse(data) : null);
            } catch (error) {
                console.error(`Error reading key "${key}":`, error);
                resolve(null);
            }
        });
    },

    save: async function(key, data) {
        return new Promise((resolve) => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                resolve(true); // מחזיר אמת אם השמירה הצליחה
            } catch (error) {
                console.error("Error saving data:", error);
                // הקפצת חלון אזהרה למשתמש כדי שנדע שהדפדפן חוסם
                alert("שגיאה במערכת השמירה: הדפדפן חוסם את הגישה לזיכרון (localStorage). ודא שאינך במצב גלישה בסתר ושהגדרות הדפדפן מאפשרות שמירה מקומית.");
                resolve(false); // מחזיר שקר אם נכשל
            }
        });
    },

    exportBackup: function() {
        const allData = JSON.stringify(localStorage);
        const blob = new Blob([allData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `LifePlatform_Backup_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importBackup: async function(jsonString) {
        return new Promise((resolve) => {
            try {
                const data = JSON.parse(jsonString);
                localStorage.clear(); 
                for (let key in data) {
                    localStorage.setItem(key, data[key]);
                }
                resolve(true);
            } catch (error) {
                console.error("Invalid backup file:", error);
                alert("קובץ הגיבוי אינו תקין.");
                resolve(false);
            }
        });
    }
};