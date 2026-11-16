// js/ModalUtils.js

const ModalUtils = {
    /**
     * פותח חלון קופץ לפי מזהה (ID) של אלמנט ה-overlay שלו
     */
    open: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * סוגר חלון קופץ לפי מזהה
     */
    close: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * סוגר את כל החלונות הקופצים הפתוחים במסך
     */
    closeAll: function() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        modals.forEach(modal => modal.classList.remove('active'));
    },

    /**
     * מאזין לאירועים ברמת המסמך כולו כדי לטפל בסגירת חלונות
     */
    init: function() {
        document.addEventListener('click', (event) => {
            // 1. סגירה בלחיצה על הרקע הכהה (מחוץ לתוכן החלון עצמו)
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
            }
            
            // 2. סגירה בלחיצה על אלמנט שיש לו מחלקה close-modal (כפתור ה-X)
            if (event.target.classList.contains('close-modal') || event.target.closest('.close-modal')) {
                // מוצאים את החלון הקופץ שעוטף את הכפתור וסוגרים אותו
                const modal = event.target.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    }
};

// אתחול האזנה לאירועים מיד כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    ModalUtils.init();
});