/* ===== Japan Trip Companion 2026 ===== */
(function () {
  "use strict";

  // ----- State -----
  let data = null;
  let currentView = "today";
  let currentDayIndex = null;
  let weatherCache = {};
  let mapInstance = null;

  const COORDS = {
    tokyo: { lat: 35.67, lng: 139.76, name: "טוקיו (Tokyo)" },
    hakone: { lat: 35.23, lng: 139.10, name: "האקונה (Hakone)" },
    osaka: { lat: 34.69, lng: 135.50, name: "אוסקה (Osaka)" },
    kyoto: { lat: 35.01, lng: 135.77, name: "קיוטו (Kyoto)" },
    dubai: { lat: 25.20, lng: 55.27, name: "דובאי (Dubai)" }
  };

  const WEATHER_CODES = {
    0: { icon: "☀️", desc: "בהיר" },
    1: { icon: "🌤️", desc: "מעונן חלקית" },
    2: { icon: "⛅", desc: "מעונן חלקית" },
    3: { icon: "☁️", desc: "מעונן" },
    45: { icon: "🌫️", desc: "ערפל" },
    48: { icon: "🌫️", desc: "ערפל" },
    51: { icon: "🌧️", desc: "טפטוף קל" },
    53: { icon: "🌧️", desc: "טפטוף" },
    55: { icon: "🌧️", desc: "טפטוף חזק" },
    61: { icon: "🌧️", desc: "גשם קל" },
    63: { icon: "🌧️", desc: "גשם" },
    65: { icon: "🌧️", desc: "גשם חזק" },
    71: { icon: "🌨️", desc: "שלג קל" },
    73: { icon: "🌨️", desc: "שלג" },
    75: { icon: "🌨️", desc: "שלג חזק" },
    80: { icon: "🌦️", desc: "ממטרים קלים" },
    81: { icon: "🌦️", desc: "ממטרים" },
    82: { icon: "🌦️", desc: "ממטרים חזקים" },
    95: { icon: "⛈️", desc: "סופה" },
    96: { icon: "⛈️", desc: "סופה עם ברד" },
    99: { icon: "⛈️", desc: "סופה עם ברד חזק" }
  };

  // ----- Init -----
  async function init() {
    try {
      const res = await fetch("data/itinerary.json");
      data = await res.json();
    } catch (e) {
      console.error("Failed to load itinerary", e);
      document.getElementById("app").innerHTML = "<p style='padding:20px;text-align:center'>שגיאה בטעינת הנתונים. נסו לרענן.</p>";
      return;
    }

    setupNavigation();
    setupFilters();
    setupWeatherSwitcher();
    setupCurrency();
    renderTips();
    renderTools();
    renderTimeline();
    renderToday();
    // Pre-fetch weather for current city
    const todayDay = getTodayDay();
    if (todayDay && todayDay.weatherLocation) {
      fetchWeather(todayDay.weatherLocation);
    }
  }

  // ----- Navigation -----
  function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        switchView(view);
      });
    });

    document.getElementById("btn-back-timeline").addEventListener("click", () => {
      switchView("timeline");
    });

    document.getElementById("btn-open-day").addEventListener("click", () => {
      const today = getTodayDay();
      if (today) openDay(today.date);
    });
  }

  function switchView(view) {
    currentView = view;
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + view).classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.view === view);
    });

    if (view === "weather") {
      const activeCity = document.querySelector(".city-btn.active")?.dataset.city || "tokyo";
      renderWeather(activeCity);
    }
    if (view === "timeline") renderTimeline();
    if (view === "today") renderToday();
  }

  // ----- Date Helpers -----
  function getTodayStr() {
    // For demo / real use: actual current date
    const now = new Date();
    // Uncomment next line to force a specific date for testing (e.g. during trip)
    // return "2026-10-03";
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getTodayDay() {
    const today = getTodayStr();
    return data.days.find(d => d.date === today) || data.days[0];
  }

  function formatDateHe(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${day}/${month}`;
  }

  function daysBetween(start, end) {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    return Math.round((e - s) / 86400000);
  }

  // ----- LocalStorage Helpers -----
  function lsGet(key, fallback) {
    try {
      const v = localStorage.getItem("japan2026_" + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem("japan2026_" + key, JSON.stringify(val)); } catch {}
  }

  // ----- Today View -----
  function renderToday() {
    const day = getTodayDay();
    if (!day) return;

    const todayStr = getTodayStr();
    const dayIndex = data.days.findIndex(d => d.date === day.date);
    const totalDays = data.days.length;
    const progress = ((dayIndex + 1) / totalDays) * 100;

    document.getElementById("today-date").textContent = `${day.weekdayHe} · ${formatDateHe(day.date)}`;
    document.getElementById("today-city").textContent = day.cityHe + (day.cityEn && day.cityEn !== day.cityHe ? ` (${day.cityEn})` : "");
    document.getElementById("progress-fill").style.width = progress + "%";
    document.getElementById("progress-text").textContent = `יום ${dayIndex + 1} מתוך ${totalDays}`;

    // Weather
    if (day.weatherLocation) {
      fetchWeather(day.weatherLocation).then(w => {
        if (w) updateTodayWeather(w, day.date);
      });
    } else {
      document.getElementById("today-weather").innerHTML = `<span class="weather-desc">אין תחזית ליום זה</span>`;
    }

    // Timeline mini
    const tl = document.getElementById("today-timeline");
    tl.innerHTML = day.timeline.map(t => `
      <div class="timeline-item">
        <div class="timeline-time">${t.time || ""}</div>
        <div class="timeline-content">
          <div class="timeline-title">${t.title}</div>
          ${t.details ? `<div class="timeline-details">${t.details}</div>` : ""}
        </div>
      </div>
    `).join("");

    // Reminders
    const reminders = [];
    data.reservations.filter(r => r.date === day.date).forEach(r => {
      reminders.push({ text: r.title + (r.time ? ` · ${r.time}` : "") + (r.notes ? ` – ${r.notes}` : ""), id: r.id });
    });
    data.luggageTransfers.filter(l => l.when && l.when.includes(day.date.slice(5).replace("-", "/")) || (day.date === "2026-10-03" && l.id === "hakone-trolley") || (day.date === "2026-10-13" && l.id === "final-narita")).forEach(l => {
      reminders.push({ text: `מזוודות: ${l.from} → ${l.to}`, id: l.id });
    });
    if (day.notes) reminders.push({ text: day.notes, id: "note-" + day.date });

    const remEl = document.getElementById("today-reminders");
    if (reminders.length === 0) {
      remEl.innerHTML = `<div class="empty-state"><span class="empty-icon">✨</span>אין תזכורות מיוחדות להיום – יום רגוע</div>`;
    } else {
      const statuses = lsGet("res_status", {});
      remEl.innerHTML = reminders.map(r => {
        const done = statuses[r.id];
        return `<div class="reminder-card ${done ? "done" : ""}" data-id="${r.id}">${r.text}</div>`;
      }).join("");
    }

    // Checklist
    renderChecklist("today-checklist", day.date, day.checklist || []);
  }

  function updateTodayWeather(w, dateStr) {
    const idx = w.daily.time.indexOf(dateStr);
    if (idx === -1) return;
    const code = w.daily.weathercode[idx];
    const info = WEATHER_CODES[code] || { icon: "🌡️", desc: "" };
    const max = Math.round(w.daily.temperature_2m_max[idx]);
    const min = Math.round(w.daily.temperature_2m_min[idx]);
    document.getElementById("today-weather").innerHTML = `
      <span class="weather-icon">${info.icon}</span>
      <span class="weather-temp">${max}°</span>
      <span class="weather-desc">${info.desc} · ${min}°–${max}°</span>
    `;
  }

  // ----- Checklist -----
  function renderChecklist(containerId, dayDate, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const checked = lsGet("checklist_" + dayDate, {});
    el.innerHTML = items.map((item, i) => {
      const id = "c_" + i;
      const isChecked = !!checked[id];
      return `
        <label class="check-item ${isChecked ? "checked" : ""}">
          <input type="checkbox" data-day="${dayDate}" data-id="${id}" ${isChecked ? "checked" : ""} />
          <span>${item}</span>
        </label>
      `;
    }).join("");

    el.querySelectorAll("input[type=checkbox]").forEach(cb => {
      cb.addEventListener("change", () => {
        const day = cb.dataset.day;
        const id = cb.dataset.id;
        const store = lsGet("checklist_" + day, {});
        store[id] = cb.checked;
        lsSet("checklist_" + day, store);
        cb.closest(".check-item").classList.toggle("checked", cb.checked);
      });
    });
  }

  // ----- Timeline -----
  function setupFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderTimeline(btn.dataset.filter);
      });
    });
  }

  function renderTimeline(filter = "all") {
    const list = document.getElementById("timeline-list");
    const todayStr = getTodayStr();
    let days = data.days;

    if (filter === "tokyo") days = days.filter(d => d.cityEn === "Tokyo" || d.area?.includes("Ginza") || d.area?.includes("Shibuya") || d.area?.includes("Odaiba"));
    else if (filter === "hakone") days = days.filter(d => d.cityEn === "Hakone");
    else if (filter === "osaka") days = days.filter(d => d.cityEn === "Osaka");
    else if (filter === "kyoto") days = days.filter(d => d.cityEn === "Kyoto");

    list.innerHTML = days.map(day => {
      const isToday = day.date === todayStr;
      const isPast = day.date < todayStr;
      return `
        <div class="day-card ${isToday ? "today" : ""} ${isPast ? "past" : ""}" data-date="${day.date}">
          <div class="day-card-header">
            <div>
              <div class="day-card-date">${formatDateHe(day.date)}</div>
              <div class="day-card-weekday">${day.weekdayHe}</div>
            </div>
            <div class="day-card-weather" data-wloc="${day.weatherLocation || ""}">🌤️</div>
          </div>
          <div class="day-card-city">${day.cityHe}${day.cityEn && day.cityEn !== day.cityHe ? ` (${day.cityEn})` : ""}</div>
          <div class="day-card-summary">${day.summary}</div>
        </div>
      `;
    }).join("");

    list.querySelectorAll(".day-card").forEach(card => {
      card.addEventListener("click", () => openDay(card.dataset.date));
    });

    // Fill weather icons asynchronously
    const locs = [...new Set(days.map(d => d.weatherLocation).filter(Boolean))];
    locs.forEach(loc => {
      fetchWeather(loc).then(w => {
        if (!w) return;
        days.forEach(day => {
          if (day.weatherLocation !== loc) return;
          const idx = w.daily.time.indexOf(day.date);
          if (idx === -1) return;
          const code = w.daily.weathercode[idx];
          const info = WEATHER_CODES[code] || { icon: "🌡️" };
          const max = Math.round(w.daily.temperature_2m_max[idx]);
          const el = list.querySelector(`.day-card[data-date="${day.date}"] .day-card-weather`);
          if (el) el.textContent = `${info.icon} ${max}°`;
        });
      });
    });
  }

  // ----- Day Detail -----
  function openDay(dateStr) {
    const day = data.days.find(d => d.date === dateStr);
    if (!day) return;
    currentDayIndex = data.days.indexOf(day);

    const hotel = day.hotelId ? data.hotels.find(h => h.id === day.hotelId) : null;
    const container = document.getElementById("day-content");

    let html = `
      <div class="day-header">
        <h2>${day.weekdayHe} · ${formatDateHe(day.date)}</h2>
        <div class="meta">${day.cityHe}${day.cityEn ? ` (${day.cityEn})` : ""}${day.area ? " · " + day.area : ""}</div>
        ${hotel ? `<div class="meta mt-8">🏨 ${hotel.mapsUrl ? `<a href="${hotel.mapsUrl}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${hotel.nameHe}</a>` : hotel.nameHe} (${hotel.nameEn})</div>` : ""}

        <div class="day-weather-card" id="day-weather-box">
          <span class="weather-icon">🌤️</span>
          <span class="weather-desc">טוען מזג אוויר...</span>
        </div>
      </div>
    `;

    // Map
    if (day.mapMarkers && day.mapMarkers.length) {
      html += `<div id="day-map"></div>`;
    }

    // Timeline
    html += `
      <div class="section-card">
        <h2>לוח זמנים</h2>
        <div class="timeline-mini">
          ${day.timeline.map(t => `
            <div class="timeline-item">
              <div class="timeline-time">${t.time || ""}</div>
              <div class="timeline-content">
                <div class="timeline-title">${t.title}</div>
                ${t.details ? `<div class="timeline-details">${t.details}</div>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Checklist
    if (day.checklist && day.checklist.length) {
      html += `
        <div class="section-card">
          <h2>צ׳ק־ליסט</h2>
          <div id="day-checklist" class="checklist"></div>
        </div>
      `;
    }

    // Restaurants
    if (day.restaurants && day.restaurants.length) {
      html += `
        <div class="section-card">
          <h2>מסעדות ומומלצים</h2>
          ${day.restaurants.map(r => `
            <div class="restaurant-card">
              <strong>${r.mapsUrl ? `<a href="${r.mapsUrl}" target="_blank" rel="noopener">${r.name}</a>` : r.name}</strong>
              ${r.note ? `<div class="text-muted">${r.note}</div>` : ""}
            </div>

          `).join("")}
        </div>
      `;
    }

    // Notes
    if (day.notes) {
      html += `<div class="notes-box">${day.notes}</div>`;
    }

    // Personal notes
    html += `
      <div class="section-card">
        <h2>הערות אישיות</h2>
        <textarea class="personal-notes" id="personal-notes" placeholder="כתבו כאן הערות אישיות ליום זה...">${lsGet("notes_" + day.date, "")}</textarea>
      </div>
    `;

    // Nav buttons
    html += `
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn-primary" id="btn-prev-day" style="flex:1" ${currentDayIndex <= 0 ? "disabled" : ""}>יום קודם →</button>
        <button class="btn-primary" id="btn-next-day" style="flex:1" ${currentDayIndex >= data.days.length - 1 ? "disabled" : ""}>← יום הבא</button>
      </div>
    `;

    container.innerHTML = html;
    switchView("day");

    // Checklist
    if (day.checklist && day.checklist.length) {
      renderChecklist("day-checklist", day.date, day.checklist);
    }

    // Personal notes save
    const notesEl = document.getElementById("personal-notes");
    if (notesEl) {
      notesEl.addEventListener("input", () => {
        lsSet("notes_" + day.date, notesEl.value);
      });
    }

    // Prev/Next
    document.getElementById("btn-prev-day")?.addEventListener("click", () => {
      if (currentDayIndex > 0) openDay(data.days[currentDayIndex - 1].date);
    });
    document.getElementById("btn-next-day")?.addEventListener("click", () => {
      if (currentDayIndex < data.days.length - 1) openDay(data.days[currentDayIndex + 1].date);
    });

    // Weather
    if (day.weatherLocation) {
      fetchWeather(day.weatherLocation).then(w => {
        if (!w) return;
        const idx = w.daily.time.indexOf(day.date);
        if (idx === -1) return;
        const code = w.daily.weathercode[idx];
        const info = WEATHER_CODES[code] || { icon: "🌡️", desc: "" };
        const max = Math.round(w.daily.temperature_2m_max[idx]);
        const min = Math.round(w.daily.temperature_2m_min[idx]);
        const precip = w.daily.precipitation_probability_max ? w.daily.precipitation_probability_max[idx] : null;
        const box = document.getElementById("day-weather-box");
        if (box) {
          box.innerHTML = `
            <span class="weather-icon">${info.icon}</span>
            <div>
              <div class="weather-temp" style="font-size:1.3rem;font-weight:700">${max}° <span style="font-weight:400;font-size:0.9rem">/ ${min}°</span></div>
              <div class="weather-desc">${info.desc}${precip != null ? ` · סיכוי לגשם ${precip}%` : ""}</div>
            </div>
          `;
        }
      });
    }

    // Map
    if (day.mapMarkers && day.mapMarkers.length) {
      setTimeout(() => {
        if (mapInstance) { mapInstance.remove(); mapInstance = null; }
        const mapEl = document.getElementById("day-map");
        if (!mapEl) return;
        mapInstance = L.map("day-map").setView([day.mapMarkers[0].lat, day.mapMarkers[0].lng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap"
        }).addTo(mapInstance);
        day.mapMarkers.forEach((m, i) => {
          L.marker([m.lat, m.lng]).addTo(mapInstance)
            .bindPopup(`<b>${i + 1}. ${m.label}</b>`);
        });
        if (day.mapMarkers.length > 1) {
          const bounds = L.latLngBounds(day.mapMarkers.map(m => [m.lat, m.lng]));
          mapInstance.fitBounds(bounds, { padding: [30, 30] });
        }
      }, 100);
    }
  }

  // ----- Weather -----
  function setupWeatherSwitcher() {
    document.querySelectorAll(".city-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".city-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderWeather(btn.dataset.city);
      });
    });
  }

  async function fetchWeather(location) {
    if (weatherCache[location] && Date.now() - weatherCache[location].ts < 3600000) {
      return weatherCache[location].data;
    }
    // Try localStorage cache
    const cached = lsGet("weather_" + location, null);
    if (cached && Date.now() - cached.ts < 7200000) {
      weatherCache[location] = cached;
      return cached.data;
    }

    const c = COORDS[location];
    if (!c) return null;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=14`;
      const res = await fetch(url);
      const json = await res.json();
      const entry = { data: json, ts: Date.now() };
      weatherCache[location] = entry;
      lsSet("weather_" + location, entry);
      return json;
    } catch (e) {
      console.warn("Weather fetch failed", e);
      if (cached) return cached.data;
      return null;
    }
  }

  async function renderWeather(city) {
    const container = document.getElementById("weather-forecast");
    container.innerHTML = `<p class="loading">טוען תחזית ל${COORDS[city]?.name || city}...</p>`;

    const w = await fetchWeather(city);
    if (!w || !w.daily) {
      container.innerHTML = `<p class="loading">לא הצלחנו לטעון תחזית. בדקו חיבור לאינטרנט.</p>`;
      return;
    }

    const todayStr = getTodayStr();
    container.innerHTML = w.daily.time.map((date, i) => {
      const code = w.daily.weathercode[i];
      const info = WEATHER_CODES[code] || { icon: "🌡️", desc: "—" };
      const max = Math.round(w.daily.temperature_2m_max[i]);
      const min = Math.round(w.daily.temperature_2m_min[i]);
      const precip = w.daily.precipitation_probability_max ? w.daily.precipitation_probability_max[i] : null;
      const isToday = date === todayStr;
      const d = new Date(date + "T12:00:00");
      const weekday = ["יום א׳","יום ב׳","יום ג׳","יום ד׳","יום ה׳","יום ו׳","שבת"][d.getDay()];

      return `
        <div class="weather-day-card ${isToday ? "today" : ""} ${date >= "2026-09-28" && date <= "2026-10-14" ? "trip-day" : ""}">
          <div class="w-icon">${info.icon}</div>
          <div class="w-info">
            <div class="w-date">${weekday} · ${formatDateHe(date)}${isToday ? " (היום)" : ""}</div>
            <div class="w-desc">${info.desc}</div>
            <div class="w-extra">${precip != null ? `סיכוי לגשם: ${precip}%` : ""}</div>
          </div>
          <div class="w-temps">${max}°<br><span style="font-weight:400;font-size:0.85rem;color:#5a5a5a">${min}°</span></div>
        </div>
      `;
    }).join("");
  }

  // ----- Tips -----
  function renderTips() {
    const t = data.tips;
    document.getElementById("tips-before").innerHTML = t.beforeTrip.map(i => `<li>${i}</li>`).join("");
    document.getElementById("tips-apps").innerHTML = t.apps.map(a => `<li><strong>${a.name}</strong> – ${a.note}</li>`).join("");
    document.getElementById("tips-culture").innerHTML = t.culture.map(i => `<li>${i}</li>`).join("");
    document.getElementById("tips-cash").innerHTML = `
      <p style="margin-bottom:8px"><strong>שער משוער:</strong> ${data.trip.currencyNote}</p>
      <p style="margin-bottom:8px"><strong>מקומות שמקבלים מזומן בלבד:</strong></p>
      <ul>${t.cash.map(i => `<li>${i}</li>`).join("")}</ul>
    `;
    document.getElementById("tips-shopping").innerHTML = t.shopping.map(s => `<li><strong>${s.name}</strong> – ${s.note}</li>`).join("");
    document.getElementById("tips-general").innerHTML = `
      <p><strong>שקעים:</strong> ${t.plugs}</p>
      <p style="margin-top:8px"><strong>הפרש שעות:</strong> ${data.trip.timeDiff}</p>
      <p style="margin-top:8px"><strong>אפליקציות מזג אוויר:</strong> ${t.weatherApps}</p>
    `;
  }

  // ----- Tools -----
  function setupCurrency() {
    const rate = data.trip.currencyRate; // 1 JPY = rate ILS → 1 ILS = 1/rate JPY
    const ilsToJpy = 1 / rate;

    document.getElementById("rate-note").textContent = data.trip.currencyNote;

    const ilsInput = document.getElementById("ils-input");
    const jpyInput = document.getElementById("jpy-input");

    function updateFromIls() {
      const v = parseFloat(ilsInput.value);
      if (!isNaN(v)) jpyInput.value = Math.round(v * ilsToJpy);
    }
    function updateFromJpy() {
      const v = parseFloat(jpyInput.value);
      if (!isNaN(v)) ilsInput.value = (v * rate).toFixed(1);
    }

    ilsInput.addEventListener("input", updateFromIls);
    jpyInput.addEventListener("input", updateFromJpy);
    updateFromIls();
  }

  function renderTools() {
    // Luggage
    const lugEl = document.getElementById("luggage-tracker");
    const lugStatus = lsGet("luggage_status", {});
    lugEl.innerHTML = data.luggageTransfers.map(l => {
      const done = !!lugStatus[l.id];
      return `
        <div class="luggage-item">
          <strong>${l.from} → ${l.to}</strong>
          <div class="text-muted">${l.when || ""} · ${l.notes || ""}</div>
          <button class="status-toggle ${done ? "done" : ""}" data-type="luggage" data-id="${l.id}">
            ${done ? "✓ בוצע" : "סמן כבוצע"}
          </button>
        </div>
      `;
    }).join("");

    // Reservations
    const resEl = document.getElementById("reservations-list");
    const resStatus = lsGet("res_status", {});
    resEl.innerHTML = data.reservations.map(r => {
      const done = !!resStatus[r.id];
      return `
        <div class="reservation-item">
          <strong>${r.title}</strong>
          <div class="text-muted">
            ${r.date ? formatDateHe(r.date) : ""} ${r.time || ""} ${r.slot || ""}
            ${r.deadline ? ` · ${r.deadline}` : ""}
            ${r.notes ? ` · ${r.notes}` : ""}
          </div>
          <button class="status-toggle ${done ? "done" : ""}" data-type="res" data-id="${r.id}">
            ${done ? "✓ הוזמן" : "סמן כהוזמן"}
          </button>
        </div>
      `;
    }).join("");

    // Hotels
    const hotEl = document.getElementById("hotels-list");
    hotEl.innerHTML = data.hotels.map(h => `
      <div class="hotel-card">
        <strong>${h.mapsUrl ? `<a href="${h.mapsUrl}" target="_blank" rel="noopener">${h.nameHe}</a>` : h.nameHe}</strong>
        <div class="text-muted">${h.nameEn}</div>
        <div class="text-muted">${h.cityHe} (${h.cityEn}) · ${h.area}</div>
        <div class="text-muted">${formatDateHe(h.checkIn)} – ${formatDateHe(h.checkOut)} · ${h.nights} לילות</div>
        ${h.notes ? `<div class="text-muted mt-8">${h.notes}</div>` : ""}
        <div style="margin-top:6px">
          ${h.mapsUrl ? `<a href="${h.mapsUrl}" target="_blank" rel="noopener">מפות Google</a>` : ""}
          ${h.mapsUrl && h.bookingUrl ? " · " : ""}
          ${h.bookingUrl ? `<a href="${h.bookingUrl}" target="_blank" rel="noopener">Booking</a>` : ""}
        </div>
      </div>
    `).join("");


    // Flights
    const flyEl = document.getElementById("flights-list");
    flyEl.innerHTML = data.flights.map(f => `
      <div class="flight-card">
        <strong>${f.type === "outbound" ? "הלוך" : "חזור"} · ${formatDateHe(f.date)}</strong>
        <div>${f.from} → ${f.to}</div>
        <div class="text-muted">${f.airline} ${f.flightNo} · המראה ${f.depart} · נחיתה ${f.arrive}</div>
        ${f.notes ? `<div class="text-muted">${f.notes}</div>` : ""}
      </div>
    `).join("");

    // Toggle handlers
    document.querySelectorAll(".status-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        const key = type === "luggage" ? "luggage_status" : "res_status";
        const store = lsGet(key, {});
        store[id] = !store[id];
        lsSet(key, store);
        btn.classList.toggle("done", store[id]);
        btn.textContent = store[id]
          ? (type === "luggage" ? "✓ בוצע" : "✓ הוזמן")
          : (type === "luggage" ? "סמן כבוצע" : "סמן כהוזמן");
      });
    });
  }


  // ----- Install banner -----
  function setupInstallBanner() {
    const banner = document.getElementById("install-banner");
    if (!banner) return;
    if (localStorage.getItem("japan2026_install_dismissed")) return;
    // Show after short delay if not standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) return;
    setTimeout(() => banner.classList.remove("hidden"), 2500);
    document.getElementById("install-dismiss")?.addEventListener("click", () => {
      banner.classList.add("hidden");
      localStorage.setItem("japan2026_install_dismissed", "1");
    });
    document.getElementById("install-btn")?.addEventListener("click", () => {
      banner.classList.add("hidden");
      localStorage.setItem("japan2026_install_dismissed", "1");
      alert("בדפדפן: לחצו על ⋮ או Share ← הוסף למסך הבית");
    });
  }

  // ----- Start -----
  document.addEventListener("DOMContentLoaded", init);
})();
