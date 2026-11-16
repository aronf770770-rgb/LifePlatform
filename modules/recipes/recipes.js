// modules/recipes/recipes.js
const RECIPES_DATA_KEY = 'recipes_data';
const CATEGORIES_DATA_KEY = 'recipes_categories';

const RecipesManager = {
    recipes: [],
    categories: [],
    currentViewedCategory: null,

    init: async function() {
        const loadedCategories = await DataService.get(CATEGORIES_DATA_KEY);
        if (!loadedCategories || loadedCategories.length === 0) {
            this.categories = ['עוגות פרווה', 'עוגות חלבי', 'מנות אחרונות'];
            await DataService.save(CATEGORIES_DATA_KEY, this.categories);
        } else { this.categories = loadedCategories; }

        const loadedRecipes = await DataService.get(RECIPES_DATA_KEY);
        this.recipes = loadedRecipes || [];

        this.renderCategoriesView();
        this.updateCategoryDropdown();
    },

    hideAllViews: function() {
        document.getElementById('categoriesView').classList.remove('active');
        document.getElementById('recipeListView').classList.remove('active');
        document.getElementById('singleRecipeView').classList.remove('active');
    },

    showCategoriesView: function() {
        this.hideAllViews();
        document.getElementById('pageTitle').textContent = 'ספר המתכונים';
        document.getElementById('categoriesView').classList.add('active');
        this.currentViewedCategory = null;
    },

    showListView: function(categoryName) {
        if(categoryName) this.currentViewedCategory = categoryName;
        this.hideAllViews();
        document.getElementById('pageTitle').textContent = `${this.currentViewedCategory}`;
        this.renderRecipesList(this.currentViewedCategory);
        document.getElementById('recipeListView').classList.add('active');
    },

    showSingleRecipe: function(recipeId) {
        this.hideAllViews();
        this.renderSingleRecipe(recipeId);
        document.getElementById('singleRecipeView').classList.add('active');
    },

    renderCategoriesView: function() {
        const container = document.getElementById('categoriesGrid');
        container.innerHTML = '';
        this.categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            const count = this.recipes.filter(r => r.category === cat).length;
            card.innerHTML = `<h3>${cat}</h3><p>${count} מתכונים</p>`;
            card.onclick = () => this.showListView(cat);
            container.appendChild(card);
        });
    },

    renderRecipesList: function(category) {
        const container = document.getElementById('recipesList');
        container.innerHTML = '';
        const filteredRecipes = this.recipes.filter(r => r.category === category);

        if (filteredRecipes.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#95a5a6; padding:30px;">אין עדיין מתכונים בקטגוריה זו.</p>';
            return;
        }

        filteredRecipes.forEach(recipe => {
            const item = document.createElement('div');
            item.className = 'recipe-list-item';
            item.innerHTML = `<h3>${recipe.title}</h3><span style="color:#95a5a6; font-size:0.9rem;">${recipe.date || ''}</span>`;
            item.onclick = () => this.showSingleRecipe(recipe.id);
            container.appendChild(item);
        });
    },

    renderSingleRecipe: function(id) {
        const recipe = this.recipes.find(r => r.id === id);
        if(!recipe) return;

        document.getElementById('pageTitle').textContent = "מתכון";
        const container = document.getElementById('recipeContent');
        
        let html = `<h2>${recipe.title}</h2>`;
        if (recipe.imagePath && recipe.imagePath.trim() !== '') {
            const browserFriendlyPath = this.formatLocalPathForBrowser(recipe.imagePath);
            html += `<div class="recipe-image-container"><img src="${browserFriendlyPath}" onerror="this.style.display='none'"></div>`;
        }
        html += `<div class="recipe-body-text">${recipe.content}</div>`;
        container.innerHTML = html;

        document.getElementById('deleteRecipeBtn').onclick = () => this.deleteRecipe(id);
    },

    formatLocalPathForBrowser: function(windowsPath) {
        if (!windowsPath) return '';
        let formattedPath = windowsPath.replace(/\\/g, '/');
        if (!formattedPath.startsWith('file:///')) formattedPath = 'file:///' + formattedPath;
        return formattedPath;
    },

    updateCategoryDropdown: function() {
        const select = document.getElementById('recipeCategory');
        select.innerHTML = '';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat; option.textContent = cat;
            select.appendChild(option);
        });
    },

    openNewRecipeModal: function() {
        if (this.categories.length === 0) return alert('אנא צור קטגוריה תחילה.');
        if (this.currentViewedCategory) document.getElementById('recipeCategory').value = this.currentViewedCategory;
        
        // איפוס שדות בעת פתיחה
        document.getElementById('recipeTitle').value = '';
        document.getElementById('recipeImage').value = '';
        document.getElementById('recipeBody').value = '';
        
        ModalUtils.open('newRecipeModal');
    },

    openNewCategoryModal: function() {
        document.getElementById('newCategoryName').value = '';
        ModalUtils.open('newCategoryModal');
    },

    saveCategory: async function() {
        const catName = document.getElementById('newCategoryName').value.trim();
        if (!catName || this.categories.includes(catName)) return;

        this.categories.push(catName);
        if (await DataService.save(CATEGORIES_DATA_KEY, this.categories)) {
            ModalUtils.close('newCategoryModal');
            this.updateCategoryDropdown();
            this.renderCategoriesView();
        }
    },

    /**
     * פונקציה חדשה: מחיקת קטגוריה שלמה
     */
    deleteCurrentCategory: async function() {
        const cat = this.currentViewedCategory;
        if (!cat) return;
        
        const warning = `האם אתה בטוח שברצונך למחוק את הקטגוריה "${cat}"?\nשים לב: כל המתכונים בקטגוריה זו יימחקו גם כן!`;
        
        if (confirm(warning)) {
            // 1. הסרת כל המתכונים ששייכים לקטגוריה
            this.recipes = this.recipes.filter(r => r.category !== cat);
            await DataService.save(RECIPES_DATA_KEY, this.recipes);
            
            // 2. הסרת הקטגוריה מהרשימה
            this.categories = this.categories.filter(c => c !== cat);
            await DataService.save(CATEGORIES_DATA_KEY, this.categories);
            
            // 3. עדכון התצוגה
            this.updateCategoryDropdown();
            this.showCategoriesView();
        }
    },

    saveRecipe: async function() {
        const title = document.getElementById('recipeTitle').value.trim();
        const category = document.getElementById('recipeCategory').value;
        const imagePath = document.getElementById('recipeImage').value.trim();
        const content = document.getElementById('recipeBody').value.trim();

        if (!title || !content) return alert('חובה להזין שם מתכון ותוכן.');

        const newRecipe = {
            id: Date.now(), title: title, category: category,
            imagePath: imagePath, content: content, date: new Date().toLocaleDateString('he-IL')
        };

        this.recipes.unshift(newRecipe);
        if (await DataService.save(RECIPES_DATA_KEY, this.recipes)) {
            ModalUtils.close('newRecipeModal');
            if (document.getElementById('categoriesView').classList.contains('active')) this.renderCategoriesView();
            else if (document.getElementById('recipeListView').classList.contains('active')) this.renderRecipesList(this.currentViewedCategory);
        }
    },

    deleteRecipe: async function(id) {
        if(confirm('למחוק מתכון זה?')) {
            this.recipes = this.recipes.filter(r => r.id !== id);
            await DataService.save(RECIPES_DATA_KEY, this.recipes);
            this.showListView(); 
        }
    }
};

document.addEventListener('DOMContentLoaded', () => RecipesManager.init());