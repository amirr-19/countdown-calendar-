// ===== 1. ELEMENTS =====
const totalDaysInput = document.getElementById("totalDays");
const startDateInput = document.getElementById("startDate");
const applyBtn = document.getElementById("applyBtn");
const gridEl = document.getElementById("grid");
const summaryEl = document.getElementById("summary");
const clockEl = document.getElementById("clock");   // NEW: the clock text

// ===== 2. NEPALI DATE SUPPORT =====
// Nepali months have different lengths every year, so there is no simple
// formula. We know one date for sure (anchor) and count forward from it.
// CHECK THIS: confirm today's Nepali date and the month lengths below
// against a real Nepali calendar, and fix any numbers that are wrong.
const ANCHOR = {
  english: new Date(2026, 9, 3),  // 3 October 2026 (months start at 0, so 9 = October)
  year: 2083,
  month: 6,   // Ashwin
  day: 17
};

// Days in each Nepali month (Baisakh to Chaitra) for each year
const BS_MONTH_DAYS = {
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31]
};

const NEPALI_MONTHS = ["Bai", "Jesth", "Asa", "Shr", "Bha", "Ash",
                       "Kar", "Man", "Pou", "Mag", "Fal", "Chai"];

// Number of days between two dates
function daysBetween(from, to) {
  return Math.round((to - from) / 86400000);
}

// Turns an English date into a Nepali date text like "17 Ash"
function nepaliText(date) {
  let diff = daysBetween(ANCHOR.english, date);
  if (diff < 0) return "";   // we only count forward from the anchor

  let y = ANCHOR.year, m = ANCHOR.month, d = ANCHOR.day;

  while (diff > 0) {
    const monthLength = BS_MONTH_DAYS[y] ? BS_MONTH_DAYS[y][m - 1] : null;
    if (!monthLength) return "";   // no data for this year
    d++;
    if (d > monthLength) {         // move to the next month
      d = 1;
      m++;
      if (m > 12) { m = 1; y++; }
    }
    diff--;
  }

  return d + " " + NEPALI_MONTHS[m - 1];
}

// ===== 3. ENGLISH DATE HELPERS =====
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function englishText(date) {
  return date.getDate() + " " + EN_MONTHS[date.getMonth()];
}

// Turns the text from the date input ("2026-10-03") into a Date at midnight
function parseInputDate(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Turns a Date into text for the date input
function toInputValue(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + mm + "-" + dd;
}

function todayAtMidnight() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// ===== 4. SAVING SETTINGS (localStorage) =====
function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("countdownSettings"));
  } catch (error) {
    return null;
  }
}

function saveSettings(total, start) {
  localStorage.setItem("countdownSettings", JSON.stringify({ total, start }));
}

// ===== 5. DRAW THE CALENDAR =====
function savedrender() {
  const total = Number(totalDaysInput.value);
  const start = parseInputDate(startDateInput.value);
  const today = todayAtMidnight();

  gridEl.innerHTML = "";   // clear old circles (safe here: no user text is inserted)
  let passed = 0;

  for (let i = 0; i < total; i++) {
    // Circle i shows the number (total - i): 45, 44, 43 ... 1
    // and belongs to the date (start + i)
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const circle = document.createElement("div");
    circle.className = "day";

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = total - i;

    const en = document.createElement("span");
    en.className = "en";
    en.textContent = englishText(date);

    const np = document.createElement("span");
    np.className = "np";
    np.textContent = nepaliText(date);

    // NEW: the weekday, shown between the two dates
    const wd = document.createElement("span");
    wd.className = "wd";
    wd.textContent = WEEKDAYS[date.getDay()];

    circle.append(num, en, np);

    // Today or earlier: fill black
    if (date <= today) {
      circle.classList.add("done");
      passed++;
    }
    // Highlight today
    if (date.getTime() === today.getTime()) {
      circle.classList.add("today");
    }

    gridEl.appendChild(circle);
  }

  const left = Math.max(total - passed, 0);
  summaryEl.textContent = passed + " days done, " + left + " days left";
}

// ===== 6. START =====
applyBtn.addEventListener("click", () => {
  if (!startDateInput.value || Number(totalDaysInput.value) < 1) return;
  saveSettings(totalDaysInput.value, startDateInput.value);
  render();
});

// On page load: use saved settings, or default to 46 days starting today
const saved = loadSettings();
totalDaysInput.value = saved ? saved.total : 40;
startDateInput.value = saved ? saved.start : toInputValue(todayAtMidnight());
render();

// ===== 7. AUTO-UPDATE WHEN A NEW DAY STARTS (NEW) =====
let lastDay = todayAtMidnight().getTime();   // remember which day we drew

function checkNewDay() {
  const nowDay = todayAtMidnight().getTime();
  if (nowDay !== lastDay) {   // the date changed since we last drew
    lastDay = nowDay;
    render();                 // draw again, so the next circle turns black
  }
}

// ===== 8. LIVE CLOCK (NEW) =====
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("en-US");   // e.g. 3:45:12 PM
  checkNewDay();   // the clock ticks every second, so it also checks for midnight
}

updateClock();                   // show it immediately
setInterval(updateClock, 1000);  // then every 1 second

// Also check right away when you come back to the tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateClock();
});