// modules/learning/html/html.js

const HTMLApp = {
    stages: [],
    currentStageIndex: 0,

    init: function() {
        this.generateCurriculum();
        this.loadProgress();
        this.renderStage();
    },

    loadProgress: function() {
        const saved = localStorage.getItem('html_current_stage');
        if (saved !== null) {
            this.currentStageIndex = parseInt(saved);
        }
    },

    saveProgress: function() {
        localStorage.setItem('html_current_stage', this.currentStageIndex);
    },

    resetProgress: function() {
        if(confirm("פעולה זו תאפס את התקדמות הקורס. האם להמשיך?")) {
            localStorage.removeItem('html_current_stage');
            window.location.reload();
        }
    },

    /* יצירת 200 שלבי הקורס - מעודכן עם הסברים ודוגמאות לכל שלבי התרגול */
    generateCurriculum: function() {
        const coreLessons = [
            {
                title: "מבוא ל-HTML וכותרות",
                content: "ברוך הבא לקורס פיתוח אתרים!<br><br>שפת HTML היא השלד של האתר. תגיות ב-HTML עוטפות תוכן וקובעות את משמעותו. כל תגית מתחילה בסימן קטן מ- <code dir='ltr'>&lt;</code> ומסתיימת בסימן גדול מ- <code dir='ltr'>&gt;</code>. לרוב התגיות יש תגית פתיחה ותגית סגירה (עם אלכסון <code dir='ltr'>/</code>).<br><br>לדוגמה, תגית לכותרת ראשית היא <code dir='ltr'>&lt;h1&gt;</code>. כותבים אותה כך:<br><pre dir='ltr' class='code-snippet'>&lt;h1&gt;שלום עולם&lt;/h1&gt;</pre><br>נסה לכתוב כותרת משלך בעורך ה-HTML (הלשונית המסומנת).",
                taskText: "צור כותרת מסוג h1 בלשונית ה-HTML.",
                regexHtml: '<h1[^>]*>.*?</h1>', regexCss: '', regexJs: ''
            },
            {
                title: "פסקאות ב-HTML",
                content: "כדי לכתוב טקסט רגיל, אנו משתמשים בתגית פסקה: <code dir='ltr'>&lt;p&gt;</code> (קיצור של Paragraph).<br><br>דוגמה:<br><pre dir='ltr' class='code-snippet'>&lt;p&gt;זהו טקסט הפסקה שלי.&lt;/p&gt;</pre><br>צור כותרת חדשה ומתחתיה פסקה.",
                taskText: "צור תגית p המכילה טקסט.",
                regexHtml: '<p[^>]*>.*?</p>', regexCss: '', regexJs: ''
            },
            {
                title: "הוספת לחצן (Button)",
                content: "כדי ליצור אלמנטים אינטראקטיביים, נשתמש בתגית <code dir='ltr'>&lt;button&gt;</code>.<br><br>דוגמה:<br><pre dir='ltr' class='code-snippet'>&lt;button&gt;לחץ עליי&lt;/button&gt;</pre><br>הוסף לחצן למסך.",
                taskText: "הוסף תגית button בלשונית ה-HTML.",
                regexHtml: '<button[^>]*>.*?</button>', regexCss: '', regexJs: ''
            },
            {
                title: "מבוא ל-CSS (עיצוב)",
                content: "עבור ללשונית ה-CSS! שפת CSS נועדה לעצב את האתר. אנו רושמים את שם התגית שאותה נרצה לעצב, פותחים סוגריים מסולסלים <code dir='ltr'>{}</code>, ובתוכם כותבים תכונות.<br><br>למשל, כדי לצבוע את הכותרת לאדום נכתוב:<br><pre dir='ltr' class='code-snippet'>h1 {\n  color: red;\n}</pre><br>ודא שיש לך כותרת h1 בלשונית ה-HTML, וצבע אותה בעזרת ה-CSS.",
                taskText: "הגדר צבע אדום לכותרת h1 ב-CSS.",
                regexHtml: '<h1', regexCss: 'h1\\s*\\{[^}]*color\\s*:\\s*red', regexJs: ''
            },
            {
                title: "עיצוב רקעים (Background)",
                content: "כדי לשנות את רקע העמוד כולו, נוכל לעצב את תגית ה- <code dir='ltr'>body</code> שמייצגת את גוף הדף.<br>התכונה המשמשת לכך היא <code dir='ltr'>background-color</code>.<br><br>דוגמה:<br><pre dir='ltr' class='code-snippet'>body {\n  background-color: #f0f0f0;\n}</pre><br>נסה לשנות את צבע הרקע.",
                taskText: "שנה את צבע הרקע של ה-body בעזרת background-color.",
                regexHtml: '', regexCss: 'body\\s*\\{[^}]*background-color', regexJs: ''
            },
            {
                title: "מבוא ל-JavaScript",
                content: "עבור ללשונית ה-JS! שפת JavaScript הופכת את האתר לחי ודינמי. הפקודה הפשוטה ביותר היא להקפיץ חלונית התראה לדפדפן.<br><br>פקודה:<br><pre dir='ltr' class='code-snippet'>alert('שלום מהקוד שלי!');</pre><br>כתוב את הפקודה בלשונית ה-JS והרץ את הקוד.",
                taskText: "השתמש בפונקציה alert ב-JS.",
                regexHtml: '', regexCss: '', regexJs: 'alert\\('
            }
        ];

        // הוספת שיעורי המבוא למערך השלבים
        coreLessons.forEach((lesson, i) => {
            this.stages.push({
                title: lesson.title,
                content: `<strong>שלב ${i + 1}: ${lesson.title}</strong><br><br>${lesson.content}`,
                tasks: [{ text: lesson.taskText, testRegexHtml: lesson.regexHtml, testRegexCss: lesson.regexCss, testRegexJs: lesson.regexJs }]
            });
        });

        // יצירת תבניות מפורטות לשלבי ההמשך (כולל הסבר ברור ודוגמה לכל משימה)
        const practiceTemplates = [
            { 
                title: 'יצירת רשימה (ul / li)', 
                explanation: 'רשימה לא מסודרת (עם תבליטים) נוצרת בעזרת התגית <code dir="ltr">&lt;ul&gt;</code> (Unordered List), ובתוכה פריטי הרשימה מסומנים בעזרת התגית <code dir="ltr">&lt;li&gt;</code>.',
                example: '&lt;ul&gt;\n  &lt;li&gt;פריט ראשון&lt;/li&gt;\n  &lt;li&gt;פריט שני&lt;/li&gt;\n&lt;/ul&gt;',
                desc: 'צור רשימה של 3 פריטים. השתמש בתגית <code dir="ltr">&lt;ul&gt;</code> שעוטפת תגיות <code dir="ltr">&lt;li&gt;</code>.', 
                type: 'html', 
                regex: '<ul>.*?<li>.*?</li>.*?</ul>' 
            },
            { 
                title: 'עיצוב גופן (font-family)', 
                explanation: 'ניתן לשנות את סוג הגופן של טקסט באמצעות התכונה <code dir="ltr">font-family</code> ב-CSS.',
                example: 'p {\n  font-family: Arial, sans-serif;\n}',
                desc: 'בלשונית CSS, שנה את הגופן של הפסקאות ל- Arial.', 
                type: 'css', 
                regex: 'p\\s*\\{[^}]*font-family\\s*:\\s*Arial' 
            },
            { 
                title: 'הדפסה לקונסול', 
                explanation: 'קונסולת המפתחים (Console) מיועדת למתכנתים ומאפשרת להדפיס הודעות נסתרות לבדיקת הקוד באמצעות הפונקציה <code dir="ltr">console.log()</code>.',
                example: 'console.log("הקוד שלי פועל בהצלחה!");',
                desc: 'בלשונית ה-JS, הדפס הודעה באמצעות <code dir="ltr">console.log</code>.', 
                type: 'js', 
                regex: 'console\\.log\\(' 
            },
            { 
                title: 'עיצוב שוליים (margin)', 
                explanation: 'התכונה <code dir="ltr">margin</code> ב-CSS יוצרת ריווח חיצוני סביב האלמנט, ומרחיקה אותו מאלמנטים אחרים שנמצאים לידו.',
                example: 'h1 {\n  margin: 20px;\n}',
                desc: 'הוסף margin של 20px לכותרות h1 בלשונית ה-CSS.', 
                type: 'css', 
                regex: 'margin\\s*:\\s*20px' 
            },
            { 
                title: 'תמונות ב-HTML', 
                explanation: 'כדי להציג תמונה נשתמש בתגית <code dir="ltr">&lt;img&gt;</code>. התגית דורשת מאפיין <code dir="ltr">src</code> שמכיל את כתובת (URL) התמונה. שים לב שזו תגית בודדת ללא תגית סגירה.',
                example: '&lt;img src="image.jpg" alt="תיאור התמונה"&gt;',
                desc: 'הוסף תגית תמונה <code dir="ltr">&lt;img&gt;</code> והגדר לה מאפיין src (מקור) כלשהו.', 
                type: 'html', 
                regex: '<img[^>]*src=' 
            },
            {
                title: 'משתנים ב-JS (let)',
                explanation: 'משתנים משמשים לשמירת נתונים בזיכרון של התוכנית. ב-JavaScript משתמשים במילה השמורה <code dir="ltr">let</code> כדי להגדיר משתנה חדש.',
                example: 'let myName = "ישראל";\nalert(myName);',
                desc: 'הגדר משתנה חדש בלשונית ה-JS בעזרת המילה let.',
                type: 'js',
                regex: 'let\\s+\\w+'
            },
            {
                title: 'עיצוב ריווח פנימי (padding)',
                explanation: 'בניגוד ל-margin שיוצר ריווח מבחוץ, התכונה <code dir="ltr">padding</code> יוצרת ריווח <strong>בתוך</strong> האלמנט, בין התוכן שלו (למשל הטקסט) לבין הגבולות שלו.',
                example: 'button {\n  padding: 10px 20px;\n}',
                desc: 'הוסף padding לכפתור (button) כלשהו בלשונית ה-CSS.',
                type: 'css',
                regex: 'padding\\s*:'
            }
        ];

        // בניית שאר 194 השלבים באמצעות התבניות המפורטות
        for (let i = coreLessons.length + 1; i <= 200; i++) {
            let p = practiceTemplates[i % practiceTemplates.length];
            this.stages.push({
                title: p.title,
                content: `<strong>שלב ${i}: ${p.title}</strong><br><br>${p.explanation}<br><br><strong>דוגמה:</strong><br><pre dir='ltr' class='code-snippet'>${p.example}</pre><br><strong>משימה:</strong><br>${p.desc}`,
                tasks: [{ 
                    text: `בצע את ההוראה בלשונית ה-${p.type.toUpperCase()}`,
                    testRegexHtml: p.type === 'html' ? p.regex : '',
                    testRegexCss: p.type === 'css' ? p.regex : '',
                    testRegexJs: p.type === 'js' ? p.regex : ''
                }]
            });
        }
    },

    /* מעבר בין הלשוניות */
    switchTab: function(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.code-textarea').forEach(ta => ta.classList.remove('active'));
        
        const index = tabName === 'html' ? 0 : (tabName === 'css' ? 1 : 2);
        document.querySelectorAll('.tab-btn')[index].classList.add('active');
        document.getElementById(`code-${tabName}`).classList.add('active');
    },

    /* ניהול ממשק השלבים */
    renderStage: function() {
        const stage = this.stages[this.currentStageIndex];
        document.getElementById('stage-badge').textContent = `שלב ${this.currentStageIndex + 1} / 200`;
        document.getElementById('stage-title').textContent = stage.title;
        
        // שימוש ב-innerHTML כדי לרנדר את תגיות ה-HTML שיצרנו עבור הקוד
        document.getElementById('stage-content').innerHTML = stage.content;

        const tasksContainer = document.getElementById('tasks-list');
        tasksContainer.innerHTML = '';
        
        document.getElementById('next-stage-btn').disabled = true;

        stage.tasks.forEach((taskObj, index) => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.id = `task-cb-${index}`;
            
            const span = document.createElement('span');
            // מאפשר גם למשימות להציג קוד קצר אם נדרש
            span.innerHTML = taskObj.text;

            li.appendChild(checkbox);
            li.appendChild(span);
            tasksContainer.appendChild(li);
        });
    },

    nextStage: function() {
        if (this.currentStageIndex < this.stages.length - 1) {
            this.currentStageIndex++;
            
            // ניקוי הקוד בין שלבים (אופציונלי, עוזר להתמקד במשימה)
            document.getElementById('code-html').value = '';
            document.getElementById('code-css').value = '';
            document.getElementById('code-js').value = '';
            this.runCode();

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

    /* הרצת הקוד בחלון התצוגה ובדיקתו */
    runCode: function() {
        const htmlCode = document.getElementById('code-html').value;
        const cssCode = document.getElementById('code-css').value;
        const jsCode = document.getElementById('code-js').value;
        
        const iframe = document.getElementById('preview-frame');
        const doc = iframe.contentWindow.document;
        
        // יצירת מבנה ה-HTML שיוזרק לתצוגה
        const combinedCode = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <style>
                    body { font-family: sans-serif; padding: 10px; }
                    ${cssCode}
                </style>
            </head>
            <body>
                ${htmlCode}
                <script>
                    try {
                        ${jsCode}
                    } catch (e) {
                        console.error(e);
                    }
                <\/script>
            </body>
            </html>
        `;

        doc.open();
        doc.write(combinedCode);
        doc.close();

        this.verifyTasks(htmlCode, cssCode, jsCode);
    },

    verifyTasks: function(htmlCode, cssCode, jsCode) {
        const stage = this.stages[this.currentStageIndex];
        let passedAll = true;

        stage.tasks.forEach((taskObj, index) => {
            let htmlPassed = !taskObj.testRegexHtml || new RegExp(taskObj.testRegexHtml, 'is').test(htmlCode);
            let cssPassed = !taskObj.testRegexCss || new RegExp(taskObj.testRegexCss, 'is').test(cssCode);
            let jsPassed = !taskObj.testRegexJs || new RegExp(taskObj.testRegexJs, 'is').test(jsCode);

            if (htmlPassed && cssPassed && jsPassed) {
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

// אתחול מיד כשהדף נטען
document.addEventListener('DOMContentLoaded', () => HTMLApp.init());