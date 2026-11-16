// js/AppManager.js

const AppManager = {
    logoutTimeout: null,
    timeoutDuration: 10 * 60 * 1000, // 10 דקות

    init: function() {
        this.setupAutoLogout();
        this.injectLayout();
    },

    setupAutoLogout: function() {
        if (!sessionStorage.getItem('isLoggedIn')) return;
        document.addEventListener('mousemove', () => this.resetTimer());
        document.addEventListener('keydown', () => this.resetTimer());
        document.addEventListener('click', () => this.resetTimer());
        this.resetTimer();
    },

    resetTimer: function() {
        clearTimeout(this.logoutTimeout);
        this.logoutTimeout = setTimeout(() => {
            this.logout();
        }, this.timeoutDuration);
    },

    logout: function() {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = '../auth/auth.html'; 
    },

    /**
     * מזריק את התפריט וגם את החלון הקופץ של תוצאות החיפוש
     */
    injectLayout: function() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('auth.html') || currentPath.endsWith('index.html')) return;

        // התפריט העליון כולל תיבת החיפוש
        const navHTML = `
            <nav id="main-nav">
                <div class="nav-brand">פלטפורמת החיים</div>
                <div class="nav-links">
                    <a href="../dashboard/dashboard.html">ראשי</a>
                    <a href="../learning/learning.html">מרכז למידה</a>
                    <a href="../thinking/thinking.html">מרכז חשיבה</a>
                    <a href="../diary/diary.html">יומן אישי</a>
                    <a href="../recipes/recipes.html">מתכונים</a>
                    <a href="../games/games.html">משחקים</a>
                    <a href="../settings/settings.html">שונות</a>
                    
                    <div class="nav-search">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="globalSearchInput" placeholder="חיפוש... (הקש Enter)" onkeypress="AppManager.handleSearch(event)">
                    </div>

                    <button type="button" onclick="AppManager.logout()" class="btn btn-ghost" style="padding: 5px 10px; font-size:14px;">התנתק</button>
                </div>
                <div class="nav-time" id="nav-time-display"></div>
            </nav>

            <!-- חלון קופץ גלובלי לתוצאות חיפוש -->
            <div id="globalSearchModal" class="modal-overlay">
                <div class="modal-content modal-large">
                    <button type="button" class="close-modal">&times;</button>
                    <h2>תוצאות חיפוש</h2>
                    <p id="searchQueryDisplay" style="color: #7f8c8d; margin-bottom: 15px;"></p>
                    <div id="searchResultsContainer"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        this.startClock();
    },

    /**
     * פונקציית החיפוש המרכזית
     */
    handleSearch: async function(event) {
        if (event.key === 'Enter') {
            const query = event.target.value.trim().toLowerCase();
            if (!query) return;

            document.getElementById('searchQueryDisplay').textContent = `מחפש תוצאות עבור: "${query}"...`;
            document.getElementById('searchResultsContainer').innerHTML = '<p style="text-align:center;">טוען נתונים...</p>';
            
            // פותח את החלון הקופץ (מתבסס על ModalUtils שרץ ברקע)
            ModalUtils.open('globalSearchModal');
            
            // ניקוי שורת החיפוש
            event.target.value = '';

            let resultsFound = false;
            let html = '<div class="search-results-list">';

            // 1. חיפוש במתכונים
            const recipes = await DataService.get('recipes_data') || [];
            const foundRecipes = recipes.filter(r => 
                (r.title && r.title.toLowerCase().includes(query)) || 
                (r.content && r.content.toLowerCase().includes(query)) ||
                (r.category && r.category.toLowerCase().includes(query))
            );
            
            if (foundRecipes.length > 0) {
                resultsFound = true;
                html += `<h3>🍳 מתכונים (${foundRecipes.length})</h3><ul>`;
                foundRecipes.forEach(r => {
                    html += `<li><a href="../recipes/recipes.html">${r.title}</a> <span class="search-tag">מתכון</span></li>`;
                });
                html += `</ul>`;
            }

            // 2. חיפוש במרכז חשיבה (פתקים, רשימות ודיונים)
            const thoughts = await DataService.get('thinking_data') || [];
            const foundThoughts = thoughts.filter(t => {
                let match = (t.title && t.title.toLowerCase().includes(query));
                if (t.type === 'note' && t.content) match = match || t.content.toLowerCase().includes(query);
                if (t.type === 'list' && t.items) match = match || t.items.some(item => item.toLowerCase().includes(query));
                if (t.type === 'debate') {
                    if (t.pros) match = match || t.pros.some(p => p.text.toLowerCase().includes(query));
                    if (t.cons) match = match || t.cons.some(c => c.text.toLowerCase().includes(query));
                }
                return match;
            });

            if (foundThoughts.length > 0) {
                resultsFound = true;
                html += `<h3>💡 מרכז חשיבה (${foundThoughts.length})</h3><ul>`;
                foundThoughts.forEach(t => {
                    html += `<li><a href="../thinking/thinking.html">${t.title}</a> <span class="search-tag">חשיבה</span></li>`;
                });
                html += `</ul>`;
            }

            // 3. חיפוש ביומן אישי
            const diary = await DataService.get('diary_data') || {};
            const foundDiaryDates = Object.keys(diary).filter(date => {
                const content = diary[date].content || '';
                return content.toLowerCase().includes(query);
            });

            if (foundDiaryDates.length > 0) {
                resultsFound = true;
                html += `<h3>📅 יומן אישי (${foundDiaryDates.length})</h3><ul>`;
                foundDiaryDates.forEach(date => {
                    // סידור התאריך לתצוגה יפה
                    const parts = date.split('-');
                    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
                    
                    html += `<li><a href="../diary/diary.html">רישום מתאריך ${displayDate}</a> <span class="search-tag">יומן</span></li>`;
                });
                html += `</ul>`;
            }

            html += '</div>';

            if (!resultsFound) {
                document.getElementById('searchResultsContainer').innerHTML = `<p style="text-align:center; color:#7f8c8d; margin-top:20px;">לא נמצאו תוצאות.</p>`;
            } else {
                document.getElementById('searchResultsContainer').innerHTML = html;
            }
        }
    },

    startClock: function() {
        const timeDisplay = document.getElementById('nav-time-display');
        if (!timeDisplay) return;
        this.updateTimeDisplay(timeDisplay);
        setInterval(() => { this.updateTimeDisplay(timeDisplay); }, 1000);
    },

    updateTimeDisplay: function(element) {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        element.textContent = now.toLocaleTimeString('he-IL', timeOptions) + ' | ' + now.toLocaleDateString('he-IL');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AppManager.init();
});