// modules/learning/sql/sql.js

const SQLApp = {
    stages: [],
    currentStageIndex: 0,
    dbName: 'LocalSQLMasterDB',

    init: function() {
        this.initDatabase();
        this.generateCurriculum();
        this.loadProgress();
        this.renderStage();
    },

    initDatabase: function() {
        if (typeof alasql !== 'undefined') {
            try {
                alasql(`CREATE LOCALSTORAGE DATABASE IF NOT EXISTS ${this.dbName}`);
                alasql(`ATTACH LOCALSTORAGE DATABASE ${this.dbName}`);
                alasql(`USE ${this.dbName}`);
            } catch(e) {
                console.error("שגיאה בטעינת מסד הנתונים:", e);
            }
        }
    },

    resetDatabase: function() {
        if(confirm("פעולה זו תמחק את כל הטבלאות והנתונים שיצרת ותאפס את התקדמות הקורס. האם להמשיך?")) {
            alasql(`DROP DATABASE IF EXISTS ${this.dbName}`);
            localStorage.removeItem('sql_current_stage');
            window.location.reload();
        }
    },

    loadProgress: function() {
        const saved = localStorage.getItem('sql_current_stage');
        if (saved !== null) {
            this.currentStageIndex = parseInt(saved);
        }
    },

    saveProgress: function() {
        localStorage.setItem('sql_current_stage', this.currentStageIndex);
    },

    /* --- בניית 150 שלבי הקורס עם הסברים מפורטים --- */
    generateCurriculum: function() {
        const coreLessons = [
            {
                title: "מבוא ליצירת טבלאות",
                content: "ברוך הבא לקורס SQL המקיף!\n\nמסד נתונים מורכב מטבלאות (כמו באקסל). הפקודה הראשונה שנילמד היא `CREATE TABLE`.\nתחביר: `CREATE TABLE table_name (column1 TYPE, column2 TYPE);`\nסוגי הנתונים הנפוצים הם `INT` למספרים ו-`STRING` לטקסט.\n\nדוגמה:\nCREATE TABLE users (id INT, name STRING);\n\nכתוב את הפקודה הזו בעורך והרץ אותה.",
                taskText: "צור טבלה בשם 'users' עם העמודות id ו-name.",
                regex: 'CREATE\\s+TABLE\\s+users'
            },
            {
                title: "הכנסת נתונים לטבלה",
                content: "כדי להוסיף שורת מידע לטבלה שיצרנו, אנו משתמשים בפקודת `INSERT INTO`.\nתחביר: `INSERT INTO table_name VALUES (value1, value2);`\nשימו לב שטקסט כותבים בתוך גרשיים ('), ומספרים ללא גרשיים.\n\nדוגמה:\nINSERT INTO users VALUES (1, 'Avraham');\n\nהכנס משתמש נוסף לפי בחירתך.",
                taskText: "הכנס שורת נתונים לטבלת users.",
                regex: 'INSERT\\s+INTO\\s+users'
            },
            {
                title: "שליפת נתונים בסיסית",
                content: "הפקודה החשובה ביותר ב-SQL היא `SELECT`. תפקידה הוא לשלוף נתונים ולהציג אותם.\nתחביר: `SELECT column1, column2 FROM table_name;`\nכדי לשלוף את כל העמודות, משתמשים בכוכבית (*).\n\nדוגמה:\nSELECT * FROM users;\n\nהרץ את הפקודה ותראה את הנתונים שהכנסת בשלב הקודם מופיעים בחלון התוצאות.",
                taskText: "שלוף את כל הנתונים מטבלת users.",
                regex: 'SELECT\\s+\\*\\s+FROM\\s+users'
            },
            {
                title: "סינון נתונים (WHERE)",
                content: "לפעמים יש לנו אלפי שורות ואנחנו רוצים רק מידע ספציפי. כאן נכנסת פקודת ה-`WHERE`.\nהיא מוסיפה תנאי לשליפה.\nתחביר: `SELECT * FROM table_name WHERE condition;`\n\nלמשל, כדי למצוא משתמש עם id ספציפי:\nSELECT * FROM users WHERE id = 1;\n\nנסה להריץ פקודת סינון.",
                taskText: "שלוף נתונים מטבלת users עם שימוש בתנאי WHERE.",
                regex: 'WHERE'
            },
            {
                title: "פונקציית ספירה (COUNT)",
                content: "לשאלתך - איך סופרים כמה נתונים יש בטבלה? \nב-SQL יש פונקציות מתמטיות, והנפוצה שבהן היא `COUNT()`. במקום לבקש את השורות עצמן, אנו מבקשים את מספרן.\n\nתחביר: `SELECT COUNT(column_name) FROM table_name;`\nהשימוש בכוכבית `COUNT(*)` יספור את כל השורות בטבלה ללא קשר לעמודה מסוימת.\n\nדוגמה:\nSELECT COUNT(*) FROM users;\n\nהרץ את הפקודה ותראה בחלון התוצאות את המספר הכולל של המשתמשים שהכנסת.",
                taskText: "השתמש בפקודת COUNT(*) כדי לספור את השורות בטבלת users.",
                regex: 'COUNT\\('
            },
            {
                title: "מיון תוצאות (ORDER BY)",
                content: "כדי להציג את התוצאות מסודרות מהקטן לגדול או להפך, נשתמש ב-`ORDER BY` בסוף השאילתה.\n\nתחביר:\nSELECT * FROM table_name ORDER BY column_name ASC;\n(ASC = מהקטן לגדול / A ל-Z. DESC = מהגדול לקטן).\n\nדוגמה:\nSELECT * FROM users ORDER BY id DESC;",
                taskText: "שלוף את המשתמשים ומיין אותם בעזרת ORDER BY.",
                regex: 'ORDER\\s+BY'
            },
            {
                title: "מחיקת נתונים (DELETE)",
                content: "כדי למחוק שורות מהטבלה נשתמש ב-`DELETE`. \nאזהרה: תמיד השתמש ב-`WHERE` יחד עם `DELETE`, אחרת תמחק את כל הטבלה!\n\nתחביר:\nDELETE FROM table_name WHERE condition;\n\nדוגמה:\nDELETE FROM users WHERE id = 1;",
                taskText: "מחק משתמש מטבלת users בעזרת פקודת DELETE והתנאי WHERE.",
                regex: 'DELETE\\s+FROM'
            },
            {
                title: "עדכון נתונים (UPDATE)",
                content: "כדי לשנות נתון קיים, למשל לתקן שם של משתמש, נשתמש ב-`UPDATE`.\n\nתחביר:\nUPDATE table_name SET column_name = 'new_value' WHERE condition;\n\nדוגמה:\nUPDATE users SET name = 'Yitzhak' WHERE id = 2;\n\nנסה לעדכן נתון כלשהו ולאחר מכן הרץ SELECT כדי לראות את השינוי.",
                taskText: "עדכן שורה בטבלת users בעזרת הפקודה UPDATE.",
                regex: 'UPDATE'
            },
            {
                title: "יצירת טבלה שניה (הכנה לקשרים)",
                content: "במסדי נתונים אמיתיים, המידע מחולק למספר טבלאות המקושרות ביניהן.\nניצור עכשיו טבלה שניה בשם 'departments' (מחלקות). היא תכיל id ושם מחלקה.\n\nמשימה:\nצור את הטבלה:\nCREATE TABLE departments (id INT, dep_name STRING);",
                taskText: "צור טבלה בשם 'departments' (עם id ו-dep_name).",
                regex: 'CREATE\\s+TABLE\\s+departments'
            },
            {
                title: "הזנת נתונים לטבלה החדשה",
                content: "כדי שנוכל לקשר בין הטבלאות, נכניס כמה מחלקות לטבלת departments.\n\nהרץ את הפקודות הבאות (אחת אחרי השניה, או יחד מופרדות בנקודה פסיק):\nINSERT INTO departments VALUES (10, 'IT');\nINSERT INTO departments VALUES (20, 'HR');\nINSERT INTO departments VALUES (30, 'Sales');",
                taskText: "הכנס לפחות מחלקה אחת לטבלת departments.",
                regex: 'INSERT\\s+INTO\\s+departments'
            },
            {
                title: "הוספת מפתח זר (Foreign Key)",
                content: "איך יודעים באיזו מחלקה עובד כל משתמש? לשם כך מוסיפים לטבלת ה-users עמודה חדשה, שתכיל את ה-id של המחלקה מתוך טבלת departments.\nב-SQL הפקודה לשינוי מבנה טבלה היא `ALTER TABLE`.\n\nתחביר:\nALTER TABLE users ADD COLUMN dep_id INT;\n\nהרץ פקודה זו להוספת העמודה לטבלת המשתמשים שלך.",
                taskText: "הוסף עמודת dep_id לטבלת users בעזרת ALTER TABLE.",
                regex: 'ALTER\\s+TABLE\\s+users\\s+ADD'
            },
            {
                title: "עדכון הקשרים",
                content: "עכשיו כשיש עמודת dep_id בטבלת users (שהיא כרגע ריקה), נעדכן אותה.\nנשייך את המשתמשים שלנו למחלקות שיצרנו (מחלקות 10, 20 או 30).\n\nדוגמה:\nUPDATE users SET dep_id = 10 WHERE id = 1;\n\nשייך לפחות משתמש אחד למחלקה כלשהי.",
                taskText: "עדכן את ה-dep_id של משתמש אחד לפחות (UPDATE).",
                regex: 'UPDATE\\s+users\\s+SET\\s+dep_id'
            },
            {
                title: "חיבור טבלאות - INNER JOIN",
                content: "הגענו לשלב המתקדם והחשוב ביותר! איך מציגים את שם המשתמש יחד עם **שם המחלקה** שלו באותה טבלה? הרי הם בטבלאות שונות.\nהפקודה `JOIN` מחברת טבלאות לפי עמודה משותפת.\n\nתחביר:\nSELECT users.name, departments.dep_name \nFROM users \nJOIN departments ON users.dep_id = departments.id;\n\nהרץ את השאילתה הזו. היא תחפש התאמה בין ה-dep_id של המשתמש ל-id של המחלקה ותציג אותם יחד!",
                taskText: "שלוף מידע משולב משתי הטבלאות בעזרת JOIN.",
                regex: 'JOIN\\s+departments'
            },
            {
                title: "פונקציות קיבוץ - SUM ו-AVG",
                content: "מלבד COUNT, ישנן פונקציות נוספות כמו `SUM()` לחישוב סכום, ו-`AVG()` לממוצע. לרוב משתמשים בהן כשיש עמודות של כסף, משכורת או גיל.\n\nנניח שהייתה עמודת 'salary', היינו כותבים: SELECT SUM(salary) FROM users;\n\nהפעל פונקציה מספרית כלשהי (למשל סכום כל ה-id).",
                taskText: "השתמש בפונקציה SUM() או AVG() בשאילתה שלך.",
                regex: '(SUM|AVG)\\('
            },
            {
                title: "קיבוץ נתונים (GROUP BY)",
                content: "מה קורה אם אנו רוצים לספור **כמה עובדים יש בכל מחלקה**? לשם כך מקבצים את התוצאות לפי המחלקה בעזרת `GROUP BY`.\n\nתחביר:\nSELECT dep_id, COUNT(*) FROM users GROUP BY dep_id;\n\nשאילתה זו מציגה צמד: מזהה המחלקה, ומספר העובדים בה.",
                taskText: "הרץ שאילתה המשתמשת ב-GROUP BY.",
                regex: 'GROUP\\s+BY'
            }
        ];

        // העברת שיעורי הליבה למערך הראשי
        coreLessons.forEach((lesson, i) => {
            this.stages.push({
                content: `שלב ${i + 1}: ${lesson.title}\n\n${lesson.content}`,
                tasks: [{ text: lesson.taskText, testRegex: lesson.regex }]
            });
        });

        // יצירת עוד 135 שלבים (כדי להגיע ל-150) כתרגול מתקדם שוטף.
        const practiceTemplates = [
            { title: 'תרגול מתקדם: JOIN פנימי', desc: 'כתוב שאילתה שמחברת את users ו-departments (JOIN) ושולפת רק משתמשים ממחלקה ספציפית בעזרת WHERE.', regex: 'JOIN' },
            { title: 'תרגול מתקדם: COUNT ו-GROUP BY', desc: 'השתמש ב-GROUP BY כדי לקבץ את המשתמשים, וספור אותם עם COUNT.', regex: 'GROUP\\s+BY' },
            { title: 'תרגול מתקדם: סינון מורכב עם AND', desc: 'שלוף משתמשים עם תנאי כפול. השתמש ב-WHERE יחד עם האופרטור AND.', regex: 'AND' },
            { title: 'תרגול מתקדם: חיפוש טקסט חלקי (LIKE)', desc: 'ב-SQL ניתן לחפש תחילת מילה עם האופרטור LIKE. \nלדוגמה: WHERE name LIKE "A%".\nנסה לכתוב שאילתה דומה.', regex: 'LIKE' },
            { title: 'תרגול מתקדם: מחיקה זהירה', desc: 'השתמש בפקודת DELETE כדי למחוק רק שורות שעונות על תנאי מסוים (WHERE).', regex: 'DELETE' },
            { title: 'תרגול מתקדם: מיון כפול', desc: 'מיין את התוצאות גם לפי מחלקה וגם לפי השם. ORDER BY column1, column2', regex: 'ORDER\\s+BY' },
            { title: 'תרגול מתקדם: שליפת עמודות ספציפיות', desc: 'במקום SELECT *, כתוב SELECT במפורש רק לעמודות המבוקשות (למשל name בלבד).', regex: 'SELECT\\s+(?!\\*)\\w+' }
        ];

        for (let i = coreLessons.length + 1; i <= 150; i++) {
            let p = practiceTemplates[i % practiceTemplates.length];
            this.stages.push({
                content: `שלב ${i} - ${p.title}\n\nהגענו לשלבי התרגול המעשי. כעת עליך לבנות שאילתות מורכבות יותר כדי לשפר את החשיבה המסדית שלך.\n\nמשימה:\n${p.desc}`,
                tasks: [{ text: `הרץ שאילתה תקינה העושה שימוש ביכולת הנלמדת.`, testRegex: p.regex }]
            });
        }
    },

    /* --- ניהול תצוגת השלבים ב-UI --- */
    renderStage: function() {
        const stage = this.stages[this.currentStageIndex];
        document.getElementById('stage-badge').textContent = `שלב ${this.currentStageIndex + 1} / 150`;
        document.getElementById('stage-content').textContent = stage.content;

        const tasksContainer = document.getElementById('tasks-list');
        tasksContainer.innerHTML = '';
        
        const nextBtn = document.getElementById('next-stage-btn');
        nextBtn.disabled = true;

        stage.tasks.forEach((taskObj, index) => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.id = `task-cb-${index}`;
            
            const span = document.createElement('span');
            span.textContent = taskObj.text;

            li.appendChild(checkbox);
            li.appendChild(span);
            tasksContainer.appendChild(li);
        });
    },

    nextStage: function() {
        if (this.currentStageIndex < this.stages.length - 1) {
            this.currentStageIndex++;
            this.saveProgress();
            this.renderStage();
        }
    },

    prevStage: function() {
        if (this.currentStageIndex > 0) {
            this.currentStageIndex--;
            this.saveProgress();
            this.renderStage();
        }
    },

    /* --- מנוע הרצת השאילתות (AlaSQL) ובדיקת משימות --- */
    runQuery: function() {
        const query = document.getElementById('sql-editor').value;
        const container = document.getElementById('sql-results');
        
        if (!query.trim()) {
            container.innerHTML = '<p style="color:#777; text-align:center;">העורך ריק. כתוב שאילתה והרץ שוב.</p>';
            return;
        }

        try {
            // הרצת השאילתה - alaSQL שומר הכול אוטומטית כי הגדרנו LOCALSTORAGE
            const res = alasql(query);
            this.renderResults(res);
            this.verifyTasks(query);
        } catch (err) {
            container.innerHTML = `<div class="error-msg">שגיאת תחביר SQL:<br><br>${err.message}</div>`;
        }
    },

    renderResults: function(result) {
        const container = document.getElementById('sql-results');
        container.innerHTML = '';
        
        if (typeof result === 'undefined' || result === 1 || result === 0) {
            container.innerHTML = `<div class="success-msg">הפעולה (יצירה / עדכון / מחיקה) בוצעה בהצלחה במערכת!</div>`;
            return;
        }

        let lastRes = Array.isArray(result) && Array.isArray(result[0]) ? result[result.length - 1] : result;
        
        if (Array.isArray(lastRes) && lastRes.length > 0 && typeof lastRes[0] === 'object') {
            let html = '<table class="sql-table"><thead><tr>';
            Object.keys(lastRes[0]).forEach(k => html += `<th>${k}</th>`);
            html += '</tr></thead><tbody>';
            
            lastRes.forEach(row => {
                html += '<tr>';
                Object.values(row).forEach(v => html += `<td>${v !== null ? v : '<i>NULL</i>'}</td>`);
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            html += `<p style="margin-top:10px; font-size:0.9rem; color:#777; font-weight:bold;">הוחזרו ${lastRes.length} שורות.</p>`;
            container.innerHTML = html;
        } else if (Array.isArray(lastRes) && lastRes.length === 0) {
            container.innerHTML = `<p style="color:#777; font-weight:bold;">השאילתה הצליחה, אך לא נמצאו נתונים התואמים לתנאי.</p>`;
        } else {
            container.innerHTML = `<div class="success-msg">פעולה בוצעה בהצלחה!</div>`;
        }
    },

    verifyTasks: function(query) {
        const stage = this.stages[this.currentStageIndex];
        let passedAll = true;

        stage.tasks.forEach((taskObj, index) => {
            const regex = new RegExp(taskObj.testRegex, 'is'); 
            if (regex.test(query)) {
                const cb = document.getElementById(`task-cb-${index}`);
                if (!cb.checked) {
                    cb.checked = true;
                    cb.parentElement.style.background = '#e8f5e9'; 
                    this.showSuccessToast('מצוין! השלמת את המשימה.');
                }
            } else {
                passedAll = false;
            }
        });

        if (passedAll) {
            document.getElementById('next-stage-btn').disabled = false;
        }
    },

    showSuccessToast: function(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `<span>🏆</span> <div>${message}</div>`;
        document.body.appendChild(toast);
        setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 4000);
    }
};

document.addEventListener('DOMContentLoaded', () => SQLApp.init());