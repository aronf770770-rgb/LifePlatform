// modules/diary/diary.js

const DIARY_DATA_KEY = 'diary_data';

const DiaryManager = {
    entries: {}, 
    currentDate: new Date(),

    init: async function() {
        const data = await DataService.get(DIARY_DATA_KEY);
        this.entries = data || {};
        this.renderCalendar();
    },

    renderCalendar: function() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
        document.getElementById('monthYearDisplay').textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const container = document.getElementById('calendarDays');
        container.innerHTML = '';

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            container.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = this.formatDateString(year, month, day);
            const hasEntry = this.entries[dateString] ? true : false;
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.onclick = () => this.openDayModal(year, month, day);
            
            let html = `<div class="day-number">${day}</div>`;
            if (hasEntry) {
                html += `<div class="day-indicator">📝 יש רישום</div>`;
            }
            
            dayDiv.innerHTML = html;
            container.appendChild(dayDiv);
        }
    },

    prevMonth: function() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    },

    nextMonth: function() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    },

    formatDateString: function(year, month, day) {
        const m = (month + 1).toString().padStart(2, '0');
        const d = day.toString().padStart(2, '0');
        return `${year}-${m}-${d}`;
    },

    openDayModal: function(year, month, day) {
        const dateString = this.formatDateString(year, month, day);
        document.getElementById('currentEditDate').value = dateString;
        
        const displayDate = `${day}/${month + 1}/${year}`;
        document.getElementById('modalDateTitle').textContent = `יומן אישי - ${displayDate}`;

        const entry = this.entries[dateString];
        const contentInput = document.getElementById('dayContent');
        const imageInput = document.getElementById('dayImagePath');
        const previewContainer = document.getElementById('dayImagePreview');
        const deleteBtn = document.getElementById('deleteDayBtn');

        if (entry) {
            contentInput.value = entry.content || '';
            imageInput.value = entry.imagePath || '';
            deleteBtn.style.display = 'block'; // הצגת כפתור המחיקה
            
            if (entry.imagePath) {
                const browserPath = this.formatLocalPathForBrowser(entry.imagePath);
                previewContainer.innerHTML = `<img src="${browserPath}" onerror="this.style.display='none'">`;
            } else {
                previewContainer.innerHTML = '';
            }
        } else {
            contentInput.value = '';
            imageInput.value = '';
            previewContainer.innerHTML = '';
            deleteBtn.style.display = 'none'; // הסתרת כפתור המחיקה כשהיום ריק
        }

        ModalUtils.open('dayModal');
    },

    saveDay: async function() {
        const dateString = document.getElementById('currentEditDate').value;
        const content = document.getElementById('dayContent').value.trim();
        const imagePath = document.getElementById('dayImagePath').value.trim();

        if (!content && !imagePath) {
            delete this.entries[dateString];
        } else {
            this.entries[dateString] = {
                content: content,
                imagePath: imagePath,
                updatedAt: Date.now()
            };
        }

        const success = await DataService.save(DIARY_DATA_KEY, this.entries);
        
        if (success) {
            ModalUtils.close('dayModal');
            this.renderCalendar(); 
        }
    },

    /**
     * מחיקת רשומה מהיומן
     */
    deleteDay: async function() {
        if(confirm('האם אתה בטוח שברצונך למחוק את הרישום ליום זה?')) {
            const dateString = document.getElementById('currentEditDate').value;
            delete this.entries[dateString];
            
            const success = await DataService.save(DIARY_DATA_KEY, this.entries);
            if (success) {
                ModalUtils.close('dayModal');
                this.renderCalendar();
            }
        }
    },

    formatLocalPathForBrowser: function(windowsPath) {
        if (!windowsPath) return '';
        let formattedPath = windowsPath.replace(/\\/g, '/');
        if (!formattedPath.startsWith('file:///')) {
            formattedPath = 'file:///' + formattedPath;
        }
        return formattedPath;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DiaryManager.init();
});