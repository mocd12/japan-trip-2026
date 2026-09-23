# טיול יפן 2026 – Japan Trip Companion

אתר מלווה אינטראקטיבי לטיול הקבוצה ביפן  
**28 בספטמבר – 14 באוקטובר 2026**

🌐 **אתר חי:** https://mocd12.github.io/japan-trip-2026/  
📁 **קבצים מעודכנים:** [Google Drive](https://drive.google.com/drive/folders/1j_7uHFJallxZRCvjkNE6ZHbwd24ggqYX)

---

## תכונות עיקריות

| טאב | מה יש |
|-----|--------|
| **היום** | תוכנית יומית, מזג אוויר, תזכורות, צ׳ק־ליסט |
| **לוח זמנים** | 17 ימים עם סינון לפי עיר (גלילה אופקית) |
| **מזג אוויר** | תחזית Open-Meteo · הדגשת ימי הטיול · דובאי / טוקיו / האקונה / אוסקה / קיוטו |
| **טיפים** | הכנות, אפליקציות, תרבות, מזומן, קניות |
| **כלים** | מחשבון יֶן↔ש״ח, מעקב מזוודות, הזמנות, מלונות, טיסות |

**נוסף:**
- קישורים ל-Google Maps על שמות מלונות ומסעדות
- מפות אינטראקטיביות (Leaflet + OpenStreetMap)
- שמירה מקומית (localStorage) – צ׳ק־ליסטים והערות נשמרים במכשיר
- באנר «הוסף למסך הבית» (PWA)
- פלטת צבעים: **אדום דובדבן**

---

## עדכון האתר מגוגל דרייב → GitHub

הגרסה המלאה והמעודכנת תמיד נמצאת ב-Google Drive.  
כדי לעדכן את האתר החי:

### אפשרות א׳ – דרך האתר של GitHub
1. הורידו מ-Drive את הקבצים שהשתנו (בדרך כלל):
   - `index.html`
   - `css/styles.css`
   - `js/app.js`
   - `data/itinerary.json`
   - `manifest.json`
   - `icons/icon.svg`
2. בריפו [mocd12/japan-trip-2026](https://github.com/mocd12/japan-trip-2026):
   - לכל קובץ → עיפרון (Edit) → הדביקו את התוכן החדש → Commit

### אפשרות ב׳ – דרך טרמינל (מומלץ)
```bash
git clone https://github.com/mocd12/japan-trip-2026.git
cd japan-trip-2026

# העתיקו מהתיקייה שהורדתם מ-Drive:
# index.html, css/, js/, data/, icons/, manifest.json

git add .
git commit -m "Update from Drive – latest UX and data"
git push
```

אחרי הדחיפה, GitHub Pages מתעדכן תוך כ-1–2 דקות.  
רענון קשיח בדפדפן: **Ctrl+F5** (או Cmd+Shift+R).

---

## הפעלת GitHub Pages (פעם ראשונה)

1. Settings → Pages  
2. Source: **Deploy from a branch**  
3. Branch: `main` · Folder: `/ (root)`  
4. Save  

הכתובת: `https://mocd12.github.io/japan-trip-2026/`

---

## הרצה מקומית

```bash
npx serve .
# או
python3 -m http.server 8080
```

גלשו אל `http://localhost:8080`.  
**חשוב:** לא לפתוח ישירות כ-`file://` (fetch ל-JSON ולמזג אוויר דורש שרת).

---

## מבנה התיקיות

```
japan-trip-2026/
├── index.html          # ממשק ראשי (עברית, RTL)
├── manifest.json       # PWA
├── css/
│   └── styles.css      # עיצוב + פלטת אדום דובדבן
├── js/
│   └── app.js          # לוגיקה, מזג אוויר, localStorage
├── data/
│   └── itinerary.json  # כל תוכן הטיול (מקור האמת)
├── icons/
│   ├── icon.svg        # אייקון PWA
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## עדכון תוכן הטיול

כמעט כל התוכן נמצא ב:

```
data/itinerary.json
```

ימים, מלונות, מסעדות, טיסות, טיפים, הזמנות – עורכים שם בלבד.  
אחרי עריכה: העלו ל-Drive ואז ל-GitHub (כמו למעלה).

---

## שפה

כל הממשק בעברית.  
שמות מקומות, מלונות ותחנות מופיעים גם באנגלית בסוגריים, למשל:  
**גינזה (Ginza)** · **קיוטו (Kyoto)**

---

נבנה כמלווה לטיול הקבוצה · ספטמבר–אוקטובר 2026
