// modules/learning/learning.js

const LEARNING_CATEGORIES_KEY = 'learning_categories';
const LEARNING_COURSES_KEY = 'learning_courses';

const LearningManager = {
    categories: [],
    courses: [],

    init: async function() {
        const loadedCats = await DataService.get(LEARNING_CATEGORIES_KEY);
        this.categories = loadedCats || ['עיצוב אתרים', 'פיתוח אפליקציות', 'פיתוח קול', 'מסדי נתונים (SQL)'];
        if (!this.categories.includes('מסדי נתונים (SQL)')) this.categories.push('מסדי נתונים (SQL)');

        let loadedCourses = await DataService.get(LEARNING_COURSES_KEY) || [];
        
        // יצירת קורס SQL כקישור לתוכנה החיצונית
        const hasSQLCourse = loadedCourses.some(c => c.title.includes('קורס SQL מקיף'));
        if (!hasSQLCourse) {
            loadedCourses.push({
                id: 'sql-app',
                category: 'מסדי נתונים (SQL)',
                title: 'קורס SQL מקיף וסביבת פיתוח (אפליקציה חיצונית)',
                isExternal: true, // דגל שמסמן שזו תוכנה נפרדת
                stages: []
            });
        }

        const hasCSCourse = loadedCourses.some(c => c.title.includes('קורס מדעי המחשב'));
        if (!hasCSCourse) {
            loadedCourses.push({
                id: 'cs-app',
                category: 'פיתוח אפליקציות', // או 'מדעי המחשב' אם תרצה ליצור קטגוריה חדשה
                title: 'קורס מדעי המחשב ואלגוריתמיקה (Java)',
                isExternalCS: true, 
                stages: []
            });
        }
        
        // יצירת קורס עיצוב ופיתוח אתרים כקישור למערכת ה-HTML החדשה
        const hasHTMLCourse = loadedCourses.some(c => c.title.includes('קורס עיצוב ופיתוח אתרים'));
        if (!hasHTMLCourse) {
            loadedCourses.push({
                id: 'html-app',
                category: 'עיצוב אתרים',
                title: 'קורס עיצוב ופיתוח אתרים (מערכת 200 השלבים)',
                isExternalHtml: true, // דגל שמסמן שזו מערכת ה-HTML
                stages: []
            });
        }
        
        this.courses = loadedCourses;
        await DataService.save(LEARNING_CATEGORIES_KEY, this.categories);
        await DataService.save(LEARNING_COURSES_KEY, this.courses);

        this.renderCategoriesView();
        this.updateCategoryDropdown();
    },

    hideAllViews: function() {
        document.getElementById('categoriesView').classList.remove('active');
        document.getElementById('coursesListView').classList.remove('active');
        document.getElementById('studyPlayerView').classList.remove('active');
    },

    showCategoriesView: function() {
        this.hideAllViews();
        document.getElementById('learningTitle').textContent = 'מרכז למידה';
        document.getElementById('topActionButtons').style.display = 'block';
        document.getElementById('categoriesView').classList.add('active');
    },

    showCoursesListView: function(categoryName) {
        if(categoryName) this.currentCategory = categoryName;
        this.hideAllViews();
        document.getElementById('learningTitle').textContent = `למידה: ${this.currentCategory}`;
        document.getElementById('topActionButtons').style.display = 'block';
        this.renderCoursesList(this.currentCategory);
        document.getElementById('coursesListView').classList.add('active');
    },

    showStudyPlayer: function(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        
        // אם זה הקורס העצמאי של SQL - פתח את התוכנה מהתיקייה החיצונית
        if (course.isExternal || course.category === 'מסדי נתונים (SQL)') {
            window.location.href = 'sql/index.html';
            return;
        }

        if (course.isExternalCS || course.title.includes('מדעי המחשב')) {
            window.location.href = 'cs/index.html';
            return;
        }

        // אם זה הקורס העצמאי של עיצוב אתרים - פתח את התוכנה מתיקיית html
        if (course.isExternalHtml || course.category === 'עיצוב אתרים') {
            window.location.href = 'html/index.html';
            return;
        }

        // המשך טיפול בקורסים רגילים שניבנים בתוך המערכת
        this.currentCourseId = courseId;
        this.hideAllViews();
        document.getElementById('learningTitle').textContent = 'סביבת למידה';
        document.getElementById('topActionButtons').style.display = 'none'; 
        
        const workspace = document.getElementById('ideWorkspace');
        const instructions = document.getElementById('instructionsPanel');
        
        if (course.category === 'עיצוב אתרים') {
            workspace.style.display = 'flex';
            instructions.classList.remove('full-width');
        } else {
            workspace.style.display = 'none';
            instructions.classList.add('full-width'); 
        }

        document.getElementById('studyPlayerView').classList.add('active');
    },

    renderCategoriesView: function() {
        const container = document.getElementById('categoriesGrid');
        container.innerHTML = '';
        this.categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            const count = this.courses.filter(c => c.category === cat).length;
            card.innerHTML = `<h3>${cat}</h3><p style="color:var(--accent-color); font-weight:bold; margin-top:10px;">${count} נושאי לימוד</p>`;
            card.onclick = () => this.showCoursesListView(cat);
            container.appendChild(card);
        });
    },

    renderCoursesList: function(category) {
        const container = document.getElementById('coursesList');
        container.innerHTML = '';
        const filteredCourses = this.courses.filter(c => c.category === category);
        
        if (filteredCourses.length === 0) container.innerHTML = '<p style="text-align:center; padding: 20px;">אין נושאי לימוד.</p>';

        filteredCourses.forEach(course => {
            const item = document.createElement('div');
            item.className = 'course-item';
            item.innerHTML = `<h3>${course.title}</h3>`;
            item.onclick = () => this.showStudyPlayer(course.id);
            container.appendChild(item);
        });
    },

    updateCategoryDropdown: function() {
        const select = document.getElementById('courseCategory');
        if(!select) return;
        select.innerHTML = '';
        this.categories.forEach(cat => {
            const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat; select.appendChild(opt);
        });
    },
    
    openNewCategoryModal: function() { ModalUtils.open('newCategoryModal'); },
    openNewCourseModal: function() { ModalUtils.open('newCourseModal'); },
    
    saveCategory: async function() {
        const catName = document.getElementById('newCategoryName').value.trim();
        if (!catName || this.categories.includes(catName)) return;
        this.categories.push(catName);
        await DataService.save(LEARNING_CATEGORIES_KEY, this.categories);
        ModalUtils.close('newCategoryModal'); this.updateCategoryDropdown(); this.renderCategoriesView();
    },
    
    saveCourse: async function() {
        const title = document.getElementById('courseTitle').value.trim();
        const category = document.getElementById('courseCategory').value;
        if (!title) return;
        this.courses.push({ id: Date.now(), title: title, category: category, stages: [] });
        await DataService.save(LEARNING_COURSES_KEY, this.courses);
        ModalUtils.close('newCourseModal'); this.showCoursesListView(category); 
    }
};

document.addEventListener('DOMContentLoaded', () => LearningManager.init());