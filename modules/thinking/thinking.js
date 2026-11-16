// modules/thinking/thinking.js
const DATA_KEY = 'thinking_data';

const ThinkingManager = {
    thoughts: [],

    init: async function() {
        const data = await DataService.get(DATA_KEY);
        this.thoughts = data || [];
        this.renderThoughts();
    },

    toggleFormFields: function() {
        const type = document.getElementById('thoughtType').value;
        document.getElementById('noteArea').classList.remove('active');
        document.getElementById('listArea').classList.remove('active');
        document.getElementById('debateArea').classList.remove('active');

        if (type === 'note') document.getElementById('noteArea').classList.add('active');
        if (type === 'list') document.getElementById('listArea').classList.add('active');
        if (type === 'debate') {
            document.getElementById('debateArea').classList.add('active');
            this.updateLiveGraph();
        }
    },

    openNewModal: function() {
        document.getElementById('modalTitle').textContent = 'רשומה חדשה';
        document.getElementById('editThoughtId').value = '';
        document.getElementById('thoughtTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('thoughtType').value = 'note';
        
        // איפוס רשימה ממוספרת
        document.getElementById('dynamicListContainer').innerHTML = '';
        this.addListRow();
        this.addListRow(); // מתחיל עם 2 שורות ריקות

        // איפוס דיון
        document.getElementById('prosListContainer').innerHTML = '';
        document.getElementById('consListContainer').innerHTML = '';
        this.addDebateRow('pro');
        this.addDebateRow('con');
        
        this.toggleFormFields();
        ModalUtils.open('thoughtModal');
    },

    editThought: function(id) {
        const thought = this.thoughts.find(t => t.id === id);
        if (!thought) return;

        document.getElementById('modalTitle').textContent = 'עריכת רשומה';
        document.getElementById('editThoughtId').value = thought.id;
        document.getElementById('thoughtType').value = thought.type;
        document.getElementById('thoughtTitle').value = thought.title;

        if (thought.type === 'note') {
            document.getElementById('noteContent').value = thought.content || '';
        } 
        else if (thought.type === 'list') {
            document.getElementById('dynamicListContainer').innerHTML = '';
            if (thought.items && thought.items.length > 0) {
                thought.items.forEach(item => this.addListRow(item));
            } else {
                this.addListRow();
            }
        } 
        else if (thought.type === 'debate') {
            document.getElementById('prosListContainer').innerHTML = '';
            document.getElementById('consListContainer').innerHTML = '';
            
            if (thought.pros && thought.pros.length > 0) {
                thought.pros.forEach(p => this.addDebateRow('pro', p.text, p.score));
            } else { this.addDebateRow('pro'); }

            if (thought.cons && thought.cons.length > 0) {
                thought.cons.forEach(c => this.addDebateRow('con', c.text, c.score));
            } else { this.addDebateRow('con'); }
        }

        this.toggleFormFields();
        ModalUtils.open('thoughtModal');
    },

    /* --- ניהול רשימה דינמית --- */
    addListRow: function(text = '') {
        const container = document.getElementById('dynamicListContainer');
        const row = document.createElement('div');
        row.className = 'list-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'הקלד פריט...';
        input.value = text;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-row-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => row.remove();

        row.appendChild(input);
        row.appendChild(removeBtn);
        container.appendChild(row);
    },

    /* --- ניהול דיון --- */
    addDebateRow: function(side, text = '', score = 1) {
        const container = document.getElementById(side === 'pro' ? 'prosListContainer' : 'consListContainer');
        const row = document.createElement('div');
        row.className = 'debate-row';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'כתוב טיעון...';
        input.value = text;
        input.oninput = () => this.updateLiveGraph();

        const select = document.createElement('select');
        [1, 2, 3, 4, 5].forEach(num => {
            const opt = document.createElement('option');
            opt.value = num;
            opt.textContent = num;
            if (num === score) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = () => this.updateLiveGraph();

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-row-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => { row.remove(); this.updateLiveGraph(); };

        row.appendChild(input);
        row.appendChild(select);
        row.appendChild(removeBtn);
        
        container.appendChild(row);
        this.updateLiveGraph();
    },

    updateLiveGraph: function() {
        let proScore = 0, conScore = 0;
        document.querySelectorAll('#prosListContainer .debate-row').forEach(row => {
            if (row.querySelector('input').value.trim()) proScore += parseInt(row.querySelector('select').value);
        });
        document.querySelectorAll('#consListContainer .debate-row').forEach(row => {
            if (row.querySelector('input').value.trim()) conScore += parseInt(row.querySelector('select').value);
        });

        const totalScore = proScore + conScore;
        const proPercentage = totalScore > 0 ? (proScore / totalScore) * 100 : 50;

        document.getElementById('liveProBar').style.width = `${proPercentage}%`;
        document.getElementById('liveProText').textContent = `בעד: ${proScore}`;
        document.getElementById('liveConText').textContent = `נגד: ${conScore}`;
    },

    /* --- שמירה ושליפה --- */
    extractListData: function() {
        const data = [];
        document.querySelectorAll('#dynamicListContainer .list-row input').forEach(input => {
            if (input.value.trim() !== '') data.push(input.value.trim());
        });
        return data;
    },

    extractDebateData: function(side) {
        const data = [];
        document.querySelectorAll(`#${side}ListContainer .debate-row`).forEach(row => {
            const text = row.querySelector('input').value.trim();
            if (text !== '') data.push({ text: text, score: parseInt(row.querySelector('select').value) });
        });
        return data;
    },

    saveThought: async function() {
        const editId = document.getElementById('editThoughtId').value;
        const type = document.getElementById('thoughtType').value;
        const title = document.getElementById('thoughtTitle').value.trim();

        if (!title) return alert('חובה להזין נושא.');

        let newThought = {
            id: editId ? parseInt(editId) : Date.now(),
            type: type,
            title: title,
            date: new Date().toLocaleDateString('he-IL')
        };

        if (type === 'note') newThought.content = document.getElementById('noteContent').value;
        else if (type === 'list') newThought.items = this.extractListData();
        else if (type === 'debate') {
            newThought.pros = this.extractDebateData('pros');
            newThought.cons = this.extractDebateData('cons');
        }

        if (editId) {
            const index = this.thoughts.findIndex(t => t.id === parseInt(editId));
            if (index !== -1) this.thoughts[index] = newThought;
        } else {
            this.thoughts.unshift(newThought); 
        }

        if (await DataService.save(DATA_KEY, this.thoughts)) {
            ModalUtils.close('thoughtModal');
            this.renderThoughts();
        }
    },

    renderThoughts: function() {
        const container = document.getElementById('thoughtsContainer');
        container.innerHTML = '';

        if (this.thoughts.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#7f8c8d;">אין עדיין רשומות. לחץ על "צור חדש".</p>';
            return;
        }

        this.thoughts.forEach(thought => {
            const card = document.createElement('div');
            card.className = 'thought-card';
            
            let typeLabel = thought.type === 'note' ? '📝 פתק' : (thought.type === 'list' ? '✅ רשימה' : '⚖️ דיון');

            let html = `
                <div class="thought-card-header">
                    <h3>${thought.title}</h3>
                    <div class="card-actions">
                        <button type="button" class="icon-btn" onclick="ThinkingManager.editThought(${thought.id})" title="ערוך">✏️</button>
                        <button type="button" class="icon-btn" onclick="ThinkingManager.deleteThought(${thought.id})" title="מחק">❌</button>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <span class="badge">${typeLabel}</span>
                    <span style="font-size: 0.8rem; color: #999; margin-right: 10px;">${thought.date}</span>
                </div>
            `;

            if (thought.type === 'note') {
                html += `<p style="white-space: pre-wrap; color: #555;">${thought.content || ''}</p>`;
            } 
            else if (thought.type === 'list') {
                html += `<ol>`;
                (thought.items || []).forEach(item => html += `<li>${item}</li>`);
                html += `</ol>`;
            } 
            else if (thought.type === 'debate') {
                let proScore = (thought.pros || []).reduce((s, i) => s + i.score, 0);
                let conScore = (thought.cons || []).reduce((s, i) => s + i.score, 0);
                let total = proScore + conScore;
                let proPct = total > 0 ? (proScore / total) * 100 : 50;

                html += `<div class="debate-list"><ul>`;
                (thought.pros || []).forEach(item => html += `<li class="pro">${item.text} <small>(${item.score})</small></li>`);
                (thought.cons || []).forEach(item => html += `<li class="con">${item.text} <small>(${item.score})</small></li>`);
                html += `</ul></div>
                    <div class="debate-graph-container">
                        <div class="debate-graph"><div class="debate-pro-bar" style="width: ${proPct}%;"></div></div>
                        <div class="debate-stats"><span class="pro-text">בעד: ${proScore}</span><span class="con-text">נגד: ${conScore}</span></div>
                    </div>`;
            }

            card.innerHTML = html;
            container.appendChild(card);
        });
    },

    deleteThought: async function(id) {
        if(confirm('למחוק רשומה זו?')) {
            this.thoughts = this.thoughts.filter(t => t.id !== id);
            await DataService.save(DATA_KEY, this.thoughts);
            this.renderThoughts();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ThinkingManager.init());