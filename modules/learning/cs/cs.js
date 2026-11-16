// modules/learning/cs/cs.js

const CSApp = {
    stages: [],
    currentStageIndex: 0,

    init: function() {
        this.generateCurriculum();
        this.loadProgress();
        this.renderStage();
    },

    loadProgress: function() {
        const saved = localStorage.getItem('cs_current_stage');
        if (saved !== null) {
            this.currentStageIndex = parseInt(saved);
        }
    },

    saveProgress: function() {
        localStorage.setItem('cs_current_stage', this.currentStageIndex);
    },

    resetProgress: function() {
        if(confirm("פעולה זו תאפס את התקדמות הקורס. האם להמשיך?")) {
            localStorage.removeItem('cs_current_stage');
            window.location.reload();
        }
    },

    /* יצירת 200 השלבים במדעי המחשב - מתמקד באלגוריתמיקה עמוקה */
    generateCurriculum: function() {
        const coreLessons = [
            {
                title: "מבוא לסיבוכיות זמן ו-Big O Notation",
                content: "ברוך הבא לקורס מדעי המחשב!<br><br>כמתכנתים, המטרה שלנו היא לא רק לכתוב קוד שעובד, אלא קוד שיעבוד <strong>מהר וביעילות</strong> גם כשיש מיליוני נתונים.<br>במדעי המחשב אנו מודדים יעילות בעזרת מונח שנקרא <code dir='ltr'>O(n)</code> (Big O Notation).<br><br><strong>מה זה אומר?</strong><br>אם נתון לנו מערך בגודל N, ואנו צריכים לעבור עליו איבר-איבר מתחילתו ועד סופו, זמן הריצה יגדל ביחס ישר לכמות הנתונים. לוגיקה כזו מוגדרת כ- <code dir='ltr'>O(n)</code>.<br><br>לדוגמה, חיפוש ליניארי פשוט:<br><pre dir='ltr'>public int linearSearch(int[] arr, int target) {\n    for (int i = 0; i < arr.length; i++) {\n        if (arr[i] == target) {\n            return i;\n        }\n    }\n    return -1;\n}</pre><br>בשלב זה, נתרגל כתיבת מבנה של פעולה (Method) שמבצעת סריקה ליניארית.",
                tasks: [
                    { desc: "הגדר פעולה בשם <code>findMax</code> המקבלת מערך של שלמים <code>int[] arr</code>", regex: 'int\\s+findMax\\s*\\(\\s*int\\[\\]\\s+arr\\s*\\)' },
                    { desc: "צור לולאת <code>for</code> שעוברת על המערך מתחילתו ועד סופו (<code>arr.length</code>)", regex: 'for\\s*\\(.*?;.*?(arr\\.length\vert{}<=.*?arr\\.length\\s*-\\s*1).*?;.*?\\)' },
                    { desc: "החזר ערך <code>return</code> כלשהו בסוף הפעולה", regex: 'return\\s+[^;]+;' }
                ]
            },
            {
                title: "אלגוריתם חיפוש בינארי (Binary Search) - גישת Divide and Conquer",
                content: "החיפוש הליניארי שלמדנו בשלב הקודם הוא איטי <code dir='ltr'>O(n)</code>. מה אם המערך שלנו ממוין מראש? במקרה כזה, אנו יכולים להשתמש באלגוריתם חכם הרבה יותר הנקרא <strong>חיפוש בינארי</strong>.<br><br><strong>הלוגיקה:</strong><br>במקום לסרוק את כל המערך, אנו בודקים את האיבר האמצעי. אם הוא גדול מהמספר שאנו מחפשים, אנו יודעים בוודאות שהמספר שלנו נמצא בחצי השמאלי של המערך, ומתעלמים לחלוטין מהחצי הימני! כך אנו חותכים את כמות הנתונים לחצי בכל איטרציה.<br>סיבוכיות הזמן יורדת דרסטית ל- <code dir='ltr'>O(log n)</code>.<br><br><pre dir='ltr'>int left = 0;\nint right = arr.length - 1;\nwhile (left <= right) {\n    int mid = left + (right - left) / 2;\n    // לוגיקת החיתוך\n}</pre><br>במשימה זו ניישם את המעטפת של החיפוש הבינארי.",
                tasks: [
                    { desc: "הגדר פעולה בשם <code>binarySearch</code> המקבלת <code>int[] arr</code> ואת המספר לחיפוש <code>int target</code>", regex: 'binarySearch\\s*\\(\\s*int\\[\\]\\s+arr\\s*,\\s*int\\s+target\\s*\\)' },
                    { desc: "הגדר מצביע התחלתי <code>left = 0</code> ומצביע סופי <code>right</code> (בגודל המערך פחות 1)", regex: 'int\\s+left\\s*=\\s*0;.*?int\\s+right\\s*=\\s*arr\\.length\\s*-\\s*1;' },
                    { desc: "צור לולאת <code>while</code> שרצה כל עוד <code>left <= right</code>", regex: 'while\\s*\\(\\s*left\\s*<=\\s*right\\s*\\)' }
                ]
            },
            {
                title: "רקורסיה - כשהפונקציה קוראת לעצמה",
                content: "אחד הקונספטים החשובים במדעי המחשב הוא <strong>רקורסיה</strong>. זוהי דרך לפתור בעיה על ידי פירוקה לתת-בעיות קטנות יותר מאותו סוג, עד להגעה ל'תנאי עצירה' (Base Case).<br><br>פונקציה רקורסיבית מורכבת תמיד משני שלבים:<br>1. <strong>תנאי העצירה:</strong> מתי הפונקציה מפסיקה לקרוא לעצמה (כדי למנוע לולאה אינסופית הקורסת את הזיכרון - Stack Overflow).<br>2. <strong>קריאה רקורסיבית:</strong> קריאה לפונקציה עם קלט 'קטן' יותר.<br><br>חישוב עצרת (Factorial) לדוגמה:<br><pre dir='ltr'>public int factorial(int n) {\n    if (n == 0) return 1; // תנאי עצירה\n    return n * factorial(n - 1); // קריאה רקורסיבית\n}</pre>",
                tasks: [
                    { desc: "הגדר פעולה רקורסיבית בשם <code>sumRecursive</code> המקבלת מספר <code>int n</code>", regex: 'sumRecursive\\s*\\(\\s*int\\s+n\\s*\\)' },
                    { desc: "כתוב תנאי עצירה <code>if</code> הבוחן האם <code>n</code> שווה ל-0 או 1", regex: 'if\\s*\\(\\s*n\\s*(==\vert{}<=)\\s*[01]\\s*\\)' },
                    { desc: "בצע קריאה רקורסיבית שמחזירה את <code>n</code> פלוס <code>sumRecursive(n - 1)</code>", regex: 'return\\s+n\\s*\\+\\s*sumRecursive\\s*\\(\\s*n\\s*-\\s*1\\s*\\)' }
                ]
            },
            {
                title: "מבני נתונים: מערך דו-ממדי (מטריצה)",
                content: "בעוד מערך רגיל הוא שורת נתונים ליניארית, בעיות רבות במדעי המחשב (כמו ייצוג תמונה, רשתות וגרפים) דורשות <strong>מערך דו-ממדי</strong> - או מטריצה.<br>זהו למעשה 'מערך של מערכים'. כדי לעבור על כל הנתונים במטריצה, נידרש ללולאה מקוננת (לולאה בתוך לולאה), מה שמעלה את סיבוכיות הזמן ל- <code dir='ltr'>O(n^2)</code>.<br><br>תחביר ב-Java:<br><pre dir='ltr'>int[][] matrix = new int[3][3];\nfor (int i = 0; i < matrix.length; i++) {\n    for (int j = 0; j < matrix[i].length; j++) {\n        // טיפול בתא [i][j]\n    }\n}</pre>",
                tasks: [
                    { desc: "צור מערך דו-ממדי מסוג שלמים בשם <code>matrix</code> בגודל 4 על 4", regex: 'int\\[\\]\\[\\]\\s+matrix\\s*=\\s*new\\s+int\\[4\\]\\[4\\]' },
                    { desc: "צור לולאת <code>for</code> חיצונית (כנגד <code>i</code>) שרצה עד <code>matrix.length</code>", regex: 'for\\s*\\(.*?i\\s*<\\s*matrix\\.length.*?\\)' },
                    { desc: "צור לולאת <code>for</code> פנימית (כנגד <code>j</code>) שרצה עד <code>matrix[i].length</code>", regex: 'for\\s*\\(.*?j\\s*<\\s*matrix\\[i\\]\\.length.*?\\)' }
                ]
            }
        ];

        coreLessons.forEach(lesson => this.stages.push(lesson));

        // תבניות ליצירת שאר השלבים עד 200
        const practiceTemplates = [
            { 
                title: "אלגוריתם מיון בועות (Bubble Sort)", 
                content: "מיון בועות הוא אלגוריתם המיון הפשוט ביותר. הרעיון הלוגי: אנו עוברים על המערך, וכל פעם ששני איברים סמוכים אינם בסדר הנכון (הימני קטן מהשמאלי), אנו <strong>מחליפים (Swap)</strong> ביניהם. התהליך חוזר על עצמו עד שהמערך כולו ממוין.<br>סיבוכיות: <code dir='ltr'>O(n^2)</code>.",
                tasks: [
                    { desc: "הגדר לולאה מקוננת בתוך פעולה כלשהי", regex: 'for\\s*\\(.*\\)\\s*\\{?\\s*for' },
                    { desc: "הגדר תנאי <code>if</code> הבוחן האם <code>arr[j] > arr[j+1]</code>", regex: 'if\\s*\\(\\s*arr\\[j\\]\\s*>\\s*arr\\[j\\s*\\+\\s*1\\]\\s*\\)' },
                    { desc: "בצע החלפה בעזרת משתנה עזר <code>temp</code>", regex: 'temp\\s*=\\s*arr\\[.*?\\];.*?arr\\[.*?\\]\\s*=\\s*arr\\[.*?\\];.*?arr\\[.*?\\]\\s*=\\s*temp;' }
                ]
            },
            {
                title: "הערכת יעילות קוד (Code Optimization)",
                content: "לעיתים קרובות אנו מבצעים פעולות מיותרות בתוך הלולאה. כדי לייעל אלגוריתמים נשתמש במילת המפתח <code dir='ltr'>break</code> כדי לעצור לולאה ברגע שמצאנו את מבוקשנו, או <code dir='ltr'>continue</code> כדי לדלג על שלב לא רלוונטי ולחסוך מחזורי מעבד יקרים.",
                tasks: [
                    { desc: "צור פעולה עם לולאת <code>while</code> או <code>for</code>", regex: '(while|for)\\s*\\(' },
                    { desc: "צור תנאי בתוך הלולאה", regex: 'if\\s*\\(' },
                    { desc: "השתמש בפקודה <code>break</code> או <code>continue</code> בתוך התנאי", regex: '(break|continue)\\s*;' }
                ]
            },
            {
                title: "לוגיקה בוליאנית וטבלאות אמת",
                content: "במדעי המחשב אנו מסתמכים רבות על לוגיקה. אופרטורים כמו <code dir='ltr'>&&</code> (וגם), <code dir='ltr'>||</code> (או), ו- <code dir='ltr'>!</code> (לא/שלילה) מרכיבים את התנאים שלנו. תנאים מורכבים יכולים לחסוך קוד רב אם משתמשים בהם נכון בהתאם לחוקי דה-מורגן (De Morgan's laws).",
                tasks: [
                    { desc: "הגדר לפחות שני משתנים בוליאניים (<code>boolean</code>)", regex: 'boolean\\s+\\w+\\s*=.*?;.*?boolean\\s+\\w+\\s*=.*?;' },
                    { desc: "צור משפט <code>if</code> המכיל את האופרטור <code>&&</code> (וגם)", regex: 'if\\s*\\(.*&&.*\\)' },
                    { desc: "שלב בתנאי גם את האופרטור <code>!</code> (שלילה)", regex: 'if\\s*\\(.*!.*\\)' }
                ]
            }
        ];

        for (let i = coreLessons.length + 1; i <= 200; i++) {
            let p = practiceTemplates[i % practiceTemplates.length];
            this.stages.push({
                title: `שלב ${i}: ${p.title}`,
                content: `<strong>העמקה אלגוריתמית:</strong><br><br>${p.content}<br><br>בשלב זה נתרגל את היישום של הרעיון באמצעות כתיבת הלוגיקה והתחביר הנכון ב-Java. היצמד למשימות הנדרשות.`,
                tasks: p.tasks
            });
        }
    },

    /* ניהול ממשק המשימות */
    renderStage: function() {
        const stage = this.stages[this.currentStageIndex];
        document.getElementById('stage-badge').textContent = `שלב ${this.currentStageIndex + 1} / 200`;
        document.getElementById('stage-title').textContent = stage.title;
        document.getElementById('stage-content').innerHTML = stage.content;
        
        document.getElementById('next-stage-btn').disabled = true;
        document.getElementById('console-output').innerHTML = "> System ready. Write your Java logic and press 'קמפל ובדוק לוגיקה'.";
        document.getElementById('console-output').className = "console-output";

        // אתחול 3 המשימות
        for(let i=0; i<3; i++) {
            const cb = document.getElementById(`task-cb-${i}`);
            const desc = document.getElementById(`task-desc-${i}`);
            cb.checked = false;
            cb.parentElement.classList.remove('task-success');
            desc.innerHTML = stage.tasks[i].desc;
        }
    },

    nextStage: function() {
        if (this.currentStageIndex < this.stages.length - 1) {
            this.currentStageIndex++;
            document.getElementById('code-java').value = 'public class Main {\n    public static void main(String[] args) {\n        // Your logic here...\n    }\n}';
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

    /* בדיקת הקוד (ניתוח סטטי) */
    verifyCode: function() {
        const code = document.getElementById('code-java').value;
        const stage = this.stages[this.currentStageIndex];
        let passedCount = 0;
        let consoleMsg = "> Compiling...\n> Executing static analysis...\n";

        for(let i=0; i<3; i++) {
            const task = stage.tasks[i];
            const regex = new RegExp(task.regex, 'is'); // התעלמות מרווחים וירידות שורה
            const cb = document.getElementById(`task-cb-${i}`);
            
            if (regex.test(code)) {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.parentElement.classList.add('task-success');
                }
                passedCount++;
                consoleMsg += `[OK] Task ${i+1} verified successfully.\n`;
            } else {
                cb.checked = false;
                cb.parentElement.classList.remove('task-success');
                consoleMsg += `[FAIL] Task ${i+1} logic missing or incorrect.\n`;
            }
        }

        const out = document.getElementById('console-output');
        if (passedCount === 3) {
            out.innerHTML = consoleMsg + "\n> BUILD SUCCESSFUL! You mastered this concept.";
            out.classList.add('log-success');
            out.classList.remove('log-error');
            document.getElementById('next-stage-btn').disabled = false;
            this.showSuccessToast('מצוין! כל הלוגיקה הושלמה.');
        } else {
            out.innerHTML = consoleMsg + "\n> BUILD FAILED. Check your logical implementation.";
            out.classList.add('log-error');
            out.classList.remove('log-success');
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

// אתחול בלחיצה
document.addEventListener('DOMContentLoaded', () => CSApp.init());