(function () {
  "use strict";

  var API_BASE = "https://vinny-workout-api.vinny-olsauskas.workers.dev";
  var STORAGE_KEY = "vinny_workout_2_data";
  var TOKEN_KEY = "vinny_workout_2_access";
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var TODAY = chicagoToday();
  var localMode = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:";
  var NOTIFICATION_DEVICE_KEY = "vinny_workout_2_notification_device";
  var PLATES = [2.5, 3.5, 4.5, 6.5];
  var DUMBBELL_HANDLE_WEIGHT = 1;
  var LOAD_OPTIONS = buildLoadOptions();
  var MEAL_CATEGORIES = ["breakfast", "lunch", "dinner", "snack"];

  var PLAN = {
    Sun: {
      title: "Recovery Day",
      subtitle: "Easy movement that helps Monday feel better",
      type: "Recovery",
      sections: [{ label: "Restore", exercises: [
        ex("Easy Walk", "20 to 40 minutes", "Comfortable pace. You should finish feeling better than when you started."),
        ex("Mobility Flow", "8 to 10 minutes", "Move gently through hips, ankles, upper back, and shoulders. Nothing should hurt.")
      ] }]
    },
    Mon: {
      title: "Upper A",
      subtitle: "Chest, back, shoulders, and arms",
      type: "Strength",
      sections: [
        { label: "Main Work", exercises: [
          ex("Dumbbell Flat Bench Press", "3 sets of 8 to 12", "Keep your feet planted and stop each set with about 3 good reps left.", load(15, 2)),
          ex("One Arm Dumbbell Row", "3 sets of 10 to 15 each side", "Brace on the bench and pull your elbow toward your hip.", load(19, 1)),
          ex("Seated Dumbbell Shoulder Press", "3 sets of 8 to 12", "Keep your ribs down and avoid leaning back.", load(10, 2))
        ] },
        { label: "Build", exercises: [
          ex("Dumbbell Lateral Raise", "2 sets of 12 to 20", "Use a light load and raise with control.", load(6, 2)),
          ex("Overhead Dumbbell Triceps Extension", "2 sets of 10 to 15", "Keep your elbows pointed forward and move slowly.", load(15, 1)),
          ex("Alternating Dumbbell Curl", "2 sets of 10 to 15 each side", "Keep your elbows still and avoid swinging.", load(10, 2))
        ] }
      ]
    },
    Tue: {
      title: "Lower A + Core",
      subtitle: "Quads, hamstrings, glutes, and trunk",
      type: "Strength",
      sections: [
        { label: "Lower Body", exercises: [
          ex("Goblet Squat", "3 sets of 10 to 15", "Hold one dumbbell at your chest and sit down between your hips.", load(21, 1)),
          ex("Dumbbell Romanian Deadlift", "3 sets of 8 to 12", "Push your hips back while keeping a long neutral spine.", load(19, 2)),
          ex("Dumbbell Reverse Lunge", "2 sets of 8 to 12 each side", "Step back far enough to keep your front foot planted.", load(10, 2)),
          ex("Standing Calf Raise", "3 sets of 12 to 20", "Pause at the top and lower through a full range.", load(15, 2))
        ] },
        { label: "Core", exercises: [
          ex("Dead Bug", "3 sets of 8 to 12 each side", "Keep your lower back gently pressed into the mat."),
          ex("Forearm Plank", "3 sets of 20 to 45 seconds", "Brace your abs and glutes without holding your breath.")
        ] }
      ]
    },
    Wed: {
      title: "Cardio 1",
      subtitle: "Guided treadmill conditioning",
      type: "Cardio",
      cardioSegments: cardioOne(),
      sections: [{ label: "Treadmill", exercises: [ex("60-Minute Guided Walk", "Follow the eight guided stages", "Start the dashboard timer when the treadmill begins, then watch YouTube. Each alert leads with the exact speed and incline setting.")] }]
    },
    Thu: {
      title: "Upper B",
      subtitle: "Upper chest, back, rear shoulders, and arms",
      type: "Strength",
      sections: [
        { label: "Main Work", exercises: [
          ex("Incline Dumbbell Bench Press", "3 sets of 8 to 12", "Set the bench to a modest incline and keep your shoulder blades set.", load(13, 2)),
          ex("Chest Supported Dumbbell Row", "3 sets of 10 to 15", "Keep your chest on the bench and squeeze your shoulder blades.", load(17, 2)),
          ex("Push Up", "2 sets of 6 to 12 clean reps", "Stop each set when you believe you could still do 2 more good reps. If you cannot reach 6 on the floor, put your hands on the bench. If 12 feels easy, record that so we can progress it.")
        ] },
        { label: "Build", exercises: [
          ex("Incline Rear Delt Raise", "2 sets of 12 to 20", "Use a light load and move from the shoulders.", load(6, 2)),
          ex("Dumbbell Hammer Curl", "2 sets of 10 to 15", "Keep palms facing in and elbows close to your sides.", load(10, 2)),
          ex("Lying Dumbbell Triceps Extension", "2 sets of 10 to 15", "Move at the elbows and lower the weights with control.", load(10, 2))
        ] }
      ]
    },
    Fri: {
      title: "Lower B + Core",
      subtitle: "Single leg strength, glutes, and trunk",
      type: "Strength",
      sections: [
        { label: "Lower Body", exercises: [
          ex("Bulgarian Split Squat", "3 sets of 8 to 12 each side", "Start with bodyweight if balance is the limiting factor.", load(10, 2)),
          ex("Dumbbell Hip Thrust", "3 sets of 10 to 15", "Pause and squeeze your glutes at the top.", load(21, 1)),
          ex("Dumbbell Sumo Squat", "3 sets of 10 to 15", "Use a wide stance and keep your knees tracking over your toes.", load(21, 1)),
          ex("Single Leg Romanian Deadlift", "2 sets of 8 to 12 each side", "Use the bench for balance and keep your hips square.", load(13, 1)),
          ex("Standing Calf Raise", "3 sets of 12 to 20", "Pause at the top and lower slowly.", load(15, 2))
        ] },
        { label: "Core", exercises: [
          ex("Reverse Crunch", "3 sets of 10 to 15", "Curl your pelvis up without swinging your legs."),
          ex("Side Plank", "2 sets of 20 to 40 seconds each side", "Keep your body in a straight line and breathe steadily.")
        ] }
      ]
    },
    Sat: {
      title: "Cardio 2",
      subtitle: "Steady treadmill work",
      type: "Cardio",
      cardioSegments: cardioTwo(),
      sections: [{ label: "Treadmill", exercises: [ex("30-Minute Guided Walk", "Follow the six 5-minute stages", "Start the dashboard timer, then watch YouTube. Your phone will alert you at every change.")] }]
    }
  };

  var SPECIAL_DAYS = {
    "2026-09-07": {
      title: "Baseline Day",
      subtitle: "No formal workout required today",
      type: "Preparation",
      sections: [{ label: "Set the starting point", exercises: [
        ex("Morning Weight", "Record 150.6 lb", "Your starting weight is already saved."),
        ex("Baseline Photos", "Front, side, and back if desired", "Keep these private and use the same setup for future comparisons."),
        ex("Easy Walk", "Optional 10 to 20 minutes", "Only if you feel like moving. This is not a test.")
      ] }]
    },
    "2026-09-08": {
      title: "Equipment Setup",
      subtitle: "Learn the FEIERDUN weights and bench before training",
      type: "Preparation",
      sections: [{ label: "Safety and practice", exercises: [
        ex("Assemble Both Dumbbells", "Practice adding and removing plates", "Load both sides evenly and tighten every collar firmly."),
        ex("Check the Bench", "Test every angle and locking pin", "The bench should not shift or wobble before you put weight over it."),
        ex("Practice Light Reps", "Optional 5 reps of a press, row, squat, and hinge", "Use very light weight. Stop if anything feels unstable or painful.")
      ] }]
    },
    "2026-09-09": {
      title: "Recovery Day",
      subtitle: "Let your stomach settle—training starts Thursday",
      type: "Recovery",
      sections: [{ label: "Today", exercises: [
        ex("Rest and Recover", "No formal workout today", "Sip fluids, eat as tolerated, and do not try to make up the treadmill session tonight. Resume with Thursday's weights only if you feel back to normal.")
      ] }]
    }
  };

  var state = {
    view: "today",
    selectedDate: TODAY,
    data: defaultData(),
    version: 0,
    sync: "Loading",
    saveTimer: null,
    saveInFlight: false,
    saveDirty: false,
    savePromise: null,
    pendingPhotoSide: null,
    photoUrls: [],
    revealedPhoto: null,
    mealEstimate: null,
    activePendingMealId: null,
    adjustingFavoriteId: null,
    favoriteFilter: "all",
    mealAdvice: { turns: [], suggestion: null },
    adviceImage: "",
    pendingRetryStarted: false,
    pendingRetryTimer: null,
    serviceWorker: null,
    notificationEnabled: false
  };

  function ex(name, prescription, tip, equipment) {
    return { name: name, prescription: prescription, tip: tip, equipment: equipment || null };
  }

  function load(start, dumbbells) { return { type: "dumbbell", start: start, dumbbells: dumbbells }; }

  function cardioOne() {
    return [
      cardio(0, 5, 2.5, 0, "Easy warmup"),
      cardio(5, 10, 2.8, 1.5, "Settle into a brisk walk"),
      cardio(10, 20, 3.0, 3, "Build into steady work—stay tall and avoid holding the rails"),
      cardio(20, 30, 3.1, 4, "Target 6–7/10 effort. If too easy, use incline 5; if too hard, use incline 3"),
      cardio(30, 40, 3.1, 5, "Strong, controlled work—short sentences should still be possible"),
      cardio(40, 50, 3.0, 3.5, "Target 6–7/10. If too easy, use incline 4.5; if too hard, use incline 2.5"),
      cardio(50, 55, 2.7, 1, "Begin cooldown"),
      cardio(55, 60, 2.4, 0, "Easy cooldown")
    ];
  }

  function cardioTwo() {
    return [
      cardio(0, 5, 2.5, 0, "Easy warmup"), cardio(5, 10, 2.9, 2, "Smooth brisk walk"),
      cardio(10, 15, 3.0, 3, "Effort check: easy add 1 incline level; right stay; hard subtract 1"),
      cardio(15, 20, 3.1, 3, "Stay tall and keep your hands off the rails"),
      cardio(20, 25, 3.0, 2, "Second effort check: easy add 1 incline level; right stay; hard subtract 1"),
      cardio(25, 30, 2.4, 0, "Cooldown")
    ];
  }

  function cardio(start, end, speed, incline, cue) { return { start: start, end: end, speed: speed, incline: incline, cue: cue }; }

  function cardioDuration(plan) {
    return plan && plan.cardioSegments && plan.cardioSegments.length ? plan.cardioSegments[plan.cardioSegments.length - 1].end : 0;
  }

  function defaultData() {
    return {
      schemaVersion: 2,
      profile: { name: "Vinny", age: 35, height: "5 ft 6 in", baselineWeight: 150.6, startDate: "2026-09-10" },
      targets: { calories: 1700, protein: 150, water: 10, checkpointWeight: 140, deadline: "2026-12-31" },
      days: {},
      pendingMeals: [],
      favorites: [],
      preferences: { notifications: true },
      meta: { planVersion: "workout-2.3-2026-09-09", createdAt: new Date().toISOString() }
    };
  }

  function defaultDay() {
    return {
      weight: "",
      steps: "",
      water: 0,
      meals: [],
      exercises: {},
      workout: { completed: false, rating: "", notes: "" },
      cardio: { sessionId: "", startedAt: "", status: "" },
      photos: { front: null, side: null, back: null },
      cannabis: "",
      cannabisNote: "",
      extraActivities: []
    };
  }

  function chicagoToday() {
    var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    return map.year + "-" + map.month + "-" + map.day;
  }

  function addDays(iso, amount) {
    var d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + amount);
    return d.toISOString().slice(0, 10);
  }

  function dayIndex(iso) { return new Date(iso + "T12:00:00Z").getUTCDay(); }
  function dayKey(iso) { return DAYS[dayIndex(iso)]; }
  function startOfWeek(iso) { return addDays(iso, -dayIndex(iso)); }
  function formatDate(iso, options) { return new Intl.DateTimeFormat("en-US", options || { weekday: "long", month: "long", day: "numeric" }).format(new Date(iso + "T12:00:00Z")); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function number(value) { var n = Number(value); return Number.isFinite(n) ? n : 0; }
  function optionalNumber(value) { if (value === "" || value == null) return null; var n = Number(value); return Number.isFinite(n) && n >= 0 ? n : null; }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function pct(value, target) { return target > 0 ? clamp(Math.round((value / target) * 100), 0, 100) : 0; }
  function categoryLabel(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ""; }
  function validCategory(value) { return MEAL_CATEGORIES.includes(value) ? value : "snack"; }
  function defaultMealCategory() {
    var hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour >= 17) return "dinner";
    return "snack";
  }

  function buildLoadOptions() {
    var byWeight = {};
    for (var mask = 0; mask < Math.pow(2, PLATES.length); mask++) {
      var plates = [], sum = 0;
      PLATES.forEach(function (plate, index) { if (mask & (1 << index)) { plates.push(plate); sum += plate; } });
      var total = DUMBBELL_HANDLE_WEIGHT + (2 * sum);
      if (!byWeight[total] || plates.length < byWeight[total].plates.length) byWeight[total] = { weight: total, plates: plates };
    }
    return Object.keys(byWeight).map(Number).sort(function (a, b) { return a - b; }).map(function (weight) { return byWeight[weight]; });
  }

  function loadOption(weight) { return LOAD_OPTIONS.find(function (option) { return option.weight === number(weight); }); }

  function plateText(weight, count) {
    var option = loadOption(weight);
    if (!option) return "Choose one of the available balanced loads.";
    var plates = option.plates.length ? option.plates.map(function (plate) { return "1 × " + plate + " lb"; }).join(" + ") : "no plates";
    return "On each end: " + plates + ". " + (count === 2 ? "Make both dumbbells identical. " : "Use one dumbbell. ") + "Handle + collars assumed ≈ 1 lb.";
  }

  function previousExerciseLog(id, beforeIso) {
    return Object.keys(state.data.days || {}).filter(function (iso) { return iso < beforeIso; }).sort().reverse().map(function (iso) {
      var log = state.data.days[iso].exercises && state.data.days[iso].exercises[id];
      return log && log.load ? { iso: iso, log: log } : null;
    }).find(Boolean) || null;
  }

  function recommendedLoad(exercise, id) {
    var previous = previousExerciseLog(id, state.selectedDate);
    if (!previous) return exercise.equipment.start;
    var weight = number(previous.log.load);
    var index = LOAD_OPTIONS.findIndex(function (option) { return option.weight === weight; });
    if (index < 0) return exercise.equipment.start;
    if (previous.log.loadFeel === "too-light") return LOAD_OPTIONS[Math.min(index + 1, LOAD_OPTIONS.length - 1)].weight;
    if (previous.log.loadFeel === "too-heavy") return LOAD_OPTIONS[Math.max(index - 1, 1)].weight;
    return weight;
  }

  function getDay(iso) {
    if (!state.data.days[iso]) state.data.days[iso] = defaultDay();
    return state.data.days[iso];
  }

  function totals(day) {
    return day.meals.reduce(function (sum, meal) {
      sum.calories += number(meal.calories);
      sum.protein += number(meal.protein);
      sum.carbs += number(meal.carbs);
      sum.fat += number(meal.fat);
      ["fiber", "saturatedFat", "addedSugar", "sodium"].forEach(function (field) {
        var value = optionalNumber(meal[field]);
        if (value != null) { sum[field] += value; sum.known[field]++; }
      });
      return sum;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, saturatedFat: 0, addedSugar: 0, sodium: 0, known: { fiber: 0, saturatedFat: 0, addedSugar: 0, sodium: 0 } });
  }

  function allExercises(dayName) {
    return exercisesForPlan(PLAN[dayName]);
  }

  function exercisesForPlan(plan) {
    var out = [];
    plan.sections.forEach(function (section) { section.exercises.forEach(function (exercise) { out.push(exercise); }); });
    return out;
  }

  function planForDate(iso) { return SPECIAL_DAYS[iso] || PLAN[dayKey(iso)]; }

  function exerciseId(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function render() {
    state.photoUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    state.photoUrls = [];
    document.querySelectorAll(".bottom-nav button").forEach(function (button) { button.classList.toggle("active", button.dataset.view === state.view); });
    var app = document.getElementById("app");
    if (state.view === "today") app.innerHTML = renderToday();
    if (state.view === "progress") app.innerHTML = renderProgress();
    if (state.view === "plan") app.innerHTML = renderPlan();
    if (state.view === "checkin") app.innerHTML = renderCheckin();
    bindViewEvents();
    hydratePhotos();
  }

  function header(title, eyebrow) {
    var syncClass = state.sync === "Saved" ? "good" : state.sync.indexOf("failed") >= 0 ? "bad" : "";
    return '<header class="topbar"><div><div class="brand">Workout 2.0</div><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1></div>' +
      '<div class="sync ' + syncClass + '"><span class="sync-dot"></span><span>' + esc(state.sync) + '</span></div></header>';
  }

  function weekStrip() {
    var start = startOfWeek(state.selectedDate);
    var end = addDays(start, 6);
    var html = '<div class="week-controls"><button class="secondary" data-week-shift="-7" aria-label="Previous week">‹</button><strong>' +
      esc(formatDate(start, { month: "short", day: "numeric" })) + " to " + esc(formatDate(end, { month: "short", day: "numeric" })) +
      '</strong><button class="ghost" data-this-week>Today</button><button class="secondary" data-week-shift="7" aria-label="Next week">›</button></div><div class="week-strip">';
    for (var i = 0; i < 7; i++) {
      var iso = addDays(start, i);
      html += '<button class="day-button ' + (iso === state.selectedDate ? "active " : "") + (i === 3 ? "official" : "") + '" data-date="' + iso + '"><strong>' + DAYS[i] + '</strong><span>' + Number(iso.slice(8)) + '</span></button>';
    }
    return html + '</div>';
  }

  function renderToday() {
    var iso = state.selectedDate;
    var key = dayKey(iso);
    var plan = planForDate(iso);
    var day = getDay(iso);
    var t = totals(day);
    var html = header(plan.title, formatDate(iso)) + weekStrip();
    html += '<div class="grid two">' +
      statCard("Protein", Math.round(t.protein), "g", state.data.targets.protein) +
      statCard("Calories", Math.round(t.calories), "cal", state.data.targets.calories) +
      '</div>';

    html += '<section class="card"><div class="card-head"><div><h2>Morning check</h2><p>Weight after the bathroom, before food or drink</p></div></div>' +
      '<div class="row wrap"><label class="field">Weight, lb<input id="weight" type="number" inputmode="decimal" min="90" max="300" step="0.1" value="' + esc(day.weight) + '"></label>' +
      '<label class="field">Water, glasses<input id="water" type="number" inputmode="numeric" min="0" max="30" step="1" value="' + esc(day.water) + '"></label></div></section>';

    html += renderMeals(day, t);
    html += renderPendingMeals();
    html += renderPhotos(day, iso);
    html += renderWorkout(day, plan, iso);
    html += '<section class="card"><div class="card-head"><div><h2>Day note</h2><p>Energy, sleep, soreness, schedule, or anything I should know</p></div></div>' +
      '<textarea id="day-note" placeholder="Optional note">' + esc(day.workout.notes) + '</textarea></section>';
    return html;
  }

  function statCard(label, value, unit, target) {
    return '<section class="card"><p class="eyebrow">' + esc(label) + '</p><div class="stat">' + esc(value) + ' <small>/ ' + esc(target) + ' ' + esc(unit) + '</small></div>' +
      '<div class="progress-bar"><span style="width:' + pct(value, target) + '%"></span></div></section>';
  }

  function renderPhotos(day, iso) {
    var official = dayKey(iso) === "Wed";
    var html = '<section class="card"><div class="card-head"><div><h2>Progress photos</h2><p>' + (official ? "Official weekly checkpoint today" : "Daily is optional. Wednesday is the official checkpoint.") + '</p></div></div><div class="photos">';
    ["front", "side", "back"].forEach(function (side) {
      var ref = day.photos[side];
      var revealed = state.revealedPhoto === iso + ":" + side;
      html += '<div class="photo-slot ' + (revealed ? "revealed" : "") + '" data-photo-container="' + side + '">';
      if (ref) {
        html += '<img alt="' + side + ' progress photo" data-photo-ref="' + esc(photoRefValue(ref)) + '"><button class="reveal-photo" data-reveal-photo="' + side + '" aria-pressed="' + revealed + '">' + (revealed ? "Tap to hide" : "Tap to reveal") + '</button><button class="remove-photo" data-remove-photo="' + side + '" aria-label="Remove ' + side + ' photo">×</button>';
      } else {
        html += '<span>+ ' + side + '</span><button data-add-photo="' + side + '" aria-label="Add ' + side + ' photo">Add</button>';
      }
      html += '</div>';
    });
    return html + '</div></section>';
  }

  function photoRefValue(ref) { return typeof ref === "string" ? ref : ref && ref.id ? "r2:" + ref.id : ""; }

  function renderWorkout(day, plan) {
    var todayExercises = exercisesForPlan(plan);
    var done = todayExercises.filter(function (exercise) { return day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; }).length;
    var total = todayExercises.length;
    var html = '<section class="card"><div class="card-head workout-title"><div><p class="eyebrow">' + esc(plan.type) + '</p><h2>' + esc(plan.title) + '</h2><p>' + esc(plan.subtitle) + '</p></div><div class="stat">' + done + '<small> / ' + total + '</small></div></div>';
    if (plan.type === "Strength") html += '<div class="notice">Choose a load that leaves about 3 good reps in reserve. The plate setup is exact; total dumbbell weight is approximate.</div>';
    if (plan.type === "Cardio") html += renderCardioGuide(day, plan);
    plan.sections.forEach(function (section) {
      html += '<div class="section-label">' + esc(section.label) + '</div>';
      section.exercises.forEach(function (exercise) {
        var id = exerciseId(exercise.name);
        var log = day.exercises[id] || {};
        var firstLabel = plan.type === "Strength" ? "Load used" : plan.type === "Cardio" ? "Adjustments made" : "Setup used";
        var secondLabel = plan.type === "Strength" ? "Reps completed" : plan.type === "Cardio" ? "Minutes completed" : "Notes";
        var firstPlaceholder = plan.type === "Strength" ? "Choose below" : plan.type === "Cardio" ? "Example: incline 5 felt right" : "Optional";
        var secondPlaceholder = plan.type === "Strength" ? "Example: 12, 12, 11" : plan.type === "Cardio" ? String(cardioDuration(plan)) : "Optional";
        html += '<div class="exercise"><div class="exercise-main"><input type="checkbox" data-exercise-done="' + id + '" ' + (log.done ? "checked" : "") + ' aria-label="Complete ' + esc(exercise.name) + '"><div><div class="exercise-name">' + esc(exercise.name) + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div><p class="exercise-tip">' + esc(exercise.tip) + '</p></div></div>' +
          renderExerciseLog(plan, exercise, id, log, firstLabel, secondLabel, firstPlaceholder, secondPlaceholder) + '</div>';
      });
    });
    html += '<label class="field">Session effort<select id="session-rating"><option value="">Choose after training</option>';
    ["Easy", "Solid", "Hard", "Brutal"].forEach(function (rating) { html += '<option ' + (day.workout.rating === rating ? "selected" : "") + '>' + rating + '</option>'; });
    html += '</select></label></section>';
    return html;
  }

  function renderExerciseLog(plan, exercise, id, log, firstLabel, secondLabel, firstPlaceholder, secondPlaceholder) {
    if (plan.type === "Strength" && exercise.equipment && exercise.equipment.type === "dumbbell") {
      var recommended = recommendedLoad(exercise, id);
      var selected = number(log.load) || recommended;
      var previous = previousExerciseLog(id, state.selectedDate);
      var options = LOAD_OPTIONS.filter(function (option) { return option.weight > 1; }).map(function (option) {
        return '<option value="' + option.weight + '" ' + (option.weight === selected ? "selected" : "") + '>≈ ' + option.weight + ' lb ' + (exercise.equipment.dumbbells === 2 ? "each" : "total") + '</option>';
      }).join("");
      return '<div class="load-guide"><strong>Recommended: approximately ' + selected + ' lb ' + (exercise.equipment.dumbbells === 2 ? "per dumbbell" : "on one dumbbell") + '</strong><span>' + esc(plateText(selected, exercise.equipment.dumbbells)) + '</span>' +
        (previous ? '<span class="previous-load">Last time: ≈ ' + esc(previous.log.load) + ' lb' + (previous.log.reps ? ' · ' + esc(previous.log.reps) + ' reps' : '') + '</span>' : '') + '</div>' +
        '<div class="exercise-log"><label class="field">Load used<select data-exercise-load="' + id + '">' + options + '</select></label><label class="field">Reps completed<input data-exercise-reps="' + id + '" value="' + esc(log.reps || "") + '" placeholder="' + secondPlaceholder + '"></label></div>' +
        '<div class="effort-buttons" aria-label="How did the load feel?"><button data-load-feel="' + id + '" data-feel="too-light" class="' + (log.loadFeel === "too-light" ? "active" : "") + '">Too light</button><button data-load-feel="' + id + '" data-feel="right" class="' + (log.loadFeel === "right" ? "active" : "") + '">Just right</button><button data-load-feel="' + id + '" data-feel="too-heavy" class="' + (log.loadFeel === "too-heavy" ? "active" : "") + '">Too heavy</button></div>';
    }
    return '<div class="exercise-log"><label class="field">' + firstLabel + '<input data-exercise-load="' + id + '" value="' + esc(log.load || "") + '" placeholder="' + firstPlaceholder + '"></label><label class="field">' + secondLabel + '<input data-exercise-reps="' + id + '" inputmode="numeric" value="' + esc(log.reps || "") + '" placeholder="' + secondPlaceholder + '"></label></div>';
  }

  function renderCardioGuide(day, plan) {
    var duration = cardioDuration(plan);
    var active = day.cardio && day.cardio.status === "active";
    if (active && day.cardio.startedAt && Date.now() - new Date(day.cardio.startedAt).getTime() > (duration + 1) * 60 * 1000) active = false;
    var html = '<div class="cardio-timeline">';
    plan.cardioSegments.forEach(function (segment) {
      html += '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>' + segment.speed.toFixed(1) + ' mph · incline ' + segment.incline + '</strong><span>' + esc(segment.cue) + '</span></div></div>';
    });
    html += '</div><div class="cardio-controls"><button class="primary" id="start-cardio" ' + (active ? "disabled" : "") + '>' + (active ? "Session alerts active" : "Start ' + duration + '-minute session") + '</button>';
    if (active) html += '<button class="secondary" id="cancel-cardio">Cancel alerts</button>';
    html += '</div><p class="notification-status">' + (state.notificationEnabled ? "You can switch to YouTube—push alerts will tell you every speed and incline change." : "Enable notifications first so alerts can reach you while YouTube is open.") + '</p>';
    return html;
  }

  function renderMeals(day, t) {
    var html = '<section class="card"><div class="card-head"><div><h2>Meals</h2><p>' + Math.round(t.protein) + ' g protein and ' + Math.round(t.calories) + ' calories logged</p></div></div>';
    if (!day.meals.length) html += '<div class="empty">No meals logged yet</div>';
    day.meals.forEach(function (meal, index) {
      html += '<div class="meal"><div><strong>' + esc(meal.name || "Meal") + '</strong><small>' + Math.round(number(meal.protein)) + ' g protein · ' + Math.round(number(meal.calories)) + ' cal' + (meal.photo ? ' · private photo saved' : '') + '</small></div><button data-remove-meal="' + index + '" aria-label="Remove meal">×</button></div>';
    });
    html += renderNutritionDetails(t, day.meals.length);
    html += renderFavoritePicker();
    html += '<div class="meal-actions"><button id="open-meal" class="primary">Log what I ate</button><button id="open-advice" class="secondary">Help me decide</button><button id="open-manual-meal" class="secondary">Enter macros manually</button></div></section>';
    return html;
  }

  function renderNutritionDetails(t, mealCount) {
    var known = t.known || {};
    var optional = function (field, unit) { return known[field] ? (field === "sodium" ? Math.round(t[field]) : Math.round(t[field] * 10) / 10) + " " + unit : "Not available"; };
    var missing = ["fiber", "saturatedFat", "addedSugar", "sodium"].some(function (field) { return known[field] < mealCount; });
    return '<details class="nutrition-details"><summary>Nutrition details</summary><div class="nutrition-grid">' +
      nutritionItem("Carbohydrates", Math.round(t.carbs) + " g") + nutritionItem("Total fat", Math.round(t.fat) + " g") +
      nutritionItem("Fiber", optional("fiber", "g")) + nutritionItem("Saturated fat", optional("saturatedFat", "g")) +
      nutritionItem("Added sugar", optional("addedSugar", "g")) + nutritionItem("Sodium", optional("sodium", "mg")) +
      '</div><p class="meal-detail-note">' + (missing && mealCount ? "Some detailed values are unavailable because photos cannot always reveal them reliably." : "Detailed values come from the information available for each meal.") + '</p></details>';
  }

  function nutritionItem(label, value) { return '<div class="nutrition-item"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>'; }

  function sortedFavorites(filter) {
    return (state.data.favorites || []).filter(function (favorite) { return filter === "all" || favorite.category === filter; }).slice().sort(function (a, b) {
      return number(b.useCount) - number(a.useCount) || String(b.lastUsedAt || "").localeCompare(String(a.lastUsedAt || "")) || String(a.name || "").localeCompare(String(b.name || ""));
    });
  }

  function renderFavoritePicker() {
    var all = sortedFavorites("all");
    if (!all.length) return '';
    var filtered = sortedFavorites(state.favoriteFilter);
    var categoryOptions = ['<option value="all">All favorites</option>'].concat(MEAL_CATEGORIES.map(function (category) { return '<option value="' + category + '" ' + (state.favoriteFilter === category ? "selected" : "") + '>' + categoryLabel(category) + '</option>'; })).join("");
    var favoriteOptions = filtered.length ? filtered.map(function (favorite) { return '<option value="' + esc(favorite.id) + '">' + esc(favorite.name) + '</option>'; }).join("") : '<option value="">No favorites in this category</option>';
    var manager = all.map(function (favorite) {
      var options = MEAL_CATEGORIES.map(function (category) { return '<option value="' + category + '" ' + (favorite.category === category ? "selected" : "") + '>' + categoryLabel(category) + '</option>'; }).join("");
      return '<div class="favorite-edit"><input data-favorite-name="' + esc(favorite.id) + '" value="' + esc(favorite.name) + '" aria-label="Favorite name"><select data-favorite-category="' + esc(favorite.id) + '" aria-label="Favorite category">' + options + '</select><button data-remove-favorite="' + esc(favorite.id) + '" aria-label="Remove ' + esc(favorite.name) + '">Remove</button></div>';
    }).join("");
    return '<div class="section-label">Favorites</div><div class="favorite-picker"><select id="favorite-category-filter" aria-label="Favorite category">' + categoryOptions + '</select><select id="favorite-meal-select" aria-label="Favorite meal">' + favoriteOptions + '</select></div>' +
      '<div class="favorite-picker-actions"><button id="add-favorite-meal" class="primary" ' + (filtered.length ? '' : 'disabled') + '>Add usual portion</button><button id="adjust-favorite-meal" class="secondary" ' + (filtered.length ? '' : 'disabled') + '>Adjust portion first</button></div>' +
      '<details class="favorite-manager"><summary>Manage favorites</summary>' + manager + '</details>';
  }

  function renderPendingMeals() {
    var pending = state.data.pendingMeals || [];
    if (!pending.length) return "";
    var html = '<section class="card pending-meals"><div class="card-head"><div><p class="eyebrow">Saved safely</p><h2>Meal estimates</h2><p>These stay here on Daily—you never need to hunt through old dates.</p></div></div>';
    pending.slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).forEach(function (meal) {
      var ready = meal.status === "ready" && meal.result;
      var label = ready ? "Ready for your review" : meal.status === "estimating" ? "Estimating now" : meal.lastError === "daily_limit" ? "Daily free limit reached—saved for automatic retry. No charge" : "Saved—will retry automatically";
      var description = meal.notes || "Meal photo";
      html += '<div class="pending-meal"><div><strong>' + esc(description) + '</strong><small>' + esc(formatDate(meal.date, { month: "short", day: "numeric" })) + ' · ' + esc(label) + (meal.photoId ? ' · photo saved privately' : '') + '</small></div><div class="pending-actions">';
      if (ready) html += '<button class="primary" data-review-pending="' + esc(meal.id) + '">Review</button>';
      else html += '<button class="secondary" data-retry-pending="' + esc(meal.id) + '" ' + (meal.status === "estimating" ? "disabled" : "") + '>' + (meal.status === "estimating" ? "Estimating…" : "Retry now") + '</button>';
      html += '<button class="ghost" data-discard-pending="' + esc(meal.id) + '">Discard</button></div></div>';
    });
    return html + '</section>';
  }

  function favoriteById(id) { return (state.data.favorites || []).find(function (favorite) { return favorite.id === id; }); }

  function renderProgress() {
    var dates = Object.keys(state.data.days).sort();
    var weights = dates.filter(function (iso) { return number(state.data.days[iso].weight) > 0; }).slice(-14);
    var latest = weights.length ? number(state.data.days[weights[weights.length - 1]].weight) : 0;
    var first = weights.length ? number(state.data.days[weights[0]].weight) : 0;
    var change = latest && first ? latest - first : 0;
    var html = header("Progress", "Trend over noise");
    html += '<section class="card"><div class="grid two"><div><p class="eyebrow">Latest weight</p><div class="stat">' + (latest ? latest.toFixed(1) : "No data") + (latest ? ' <small>lb</small>' : '') + '</div></div><div><p class="eyebrow">Change shown</p><div class="stat">' + (weights.length > 1 ? (change > 0 ? "+" : "") + change.toFixed(1) : "No trend") + (weights.length > 1 ? ' <small>lb</small>' : '') + '</div></div></div></section>';
    html += '<section class="card"><div class="card-head"><div><h2>Recent morning weights</h2><p>Use the weekly average to judge progress</p></div></div><div class="weight-list">';
    weights.forEach(function (iso) { html += '<div class="weight-chip"><small>' + esc(formatDate(iso, { month: "short", day: "numeric" })) + '</small><strong>' + number(state.data.days[iso].weight).toFixed(1) + '</strong></div>'; });
    if (!weights.length) html += '<div class="empty">Your weight trend will appear here.</div>';
    html += '</div></section>';
    html += renderGoalProgress();
    return html;
  }

  function renderGoalProgress() {
    var stats = periodStats(state.data.profile.startDate || "2026-09-10", TODAY);
    var start = state.data.profile.baselineWeight;
    var latest = stats.latestWeight || start;
    var weightProgress = pct(start - latest, start - state.data.targets.checkpointWeight);
    return '<section class="card"><div class="card-head"><div><p class="eyebrow">December 31 goal</p><h2>Lean and visibly defined</h2><p>140 lb is a checkpoint, not a promise that one scale number creates abs.</p></div></div>' +
      metric("Weight checkpoint", weightProgress, latest.toFixed(1) + " / " + state.data.targets.checkpointWeight + " lb") +
      metric("Strength sessions", pct(stats.strengthDone, stats.strengthPlanned), stats.strengthDone + " / " + stats.strengthPlanned) +
      metric("Cardio sessions", pct(stats.cardioDone, stats.cardioPlanned), stats.cardioDone + " / " + stats.cardioPlanned) +
      metric("Protein days", pct(stats.proteinDays, stats.loggedDays || 1), stats.proteinDays + " / " + stats.loggedDays + " logged days") + '</section>';
  }

  function metric(label, percentage, copy) {
    return '<div class="metric"><div class="metric-copy"><strong>' + esc(label) + '</strong><span>' + esc(copy) + '</span></div><div class="progress-bar"><span style="width:' + percentage + '%"></span></div></div>';
  }

  function renderPlan() {
    var html = header("The Plan", "September 10 to December 31");
    html += '<section class="card"><div class="notice">Four strength days, two cardio days, and one active recovery day. Week 1 establishes safe working weights.</div></section>';
    DAYS.forEach(function (key) {
      var plan = PLAN[key];
      html += '<section class="card"><div class="card-head"><div><p class="eyebrow">' + DAY_NAMES[DAYS.indexOf(key)] + ' · ' + plan.type + '</p><h2>' + esc(plan.title) + '</h2><p>' + esc(plan.subtitle) + '</p></div></div>';
      plan.sections.forEach(function (section) {
        html += '<div class="section-label">' + esc(section.label) + '</div>';
        section.exercises.forEach(function (exercise) {
          html += '<div class="exercise"><div class="exercise-name">' + esc(exercise.name) + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div>';
          if (exercise.equipment && exercise.equipment.type === "dumbbell") html += '<p class="exercise-tip">Starting point: ≈ ' + exercise.equipment.start + ' lb ' + (exercise.equipment.dumbbells === 2 ? "per dumbbell. " : "on one dumbbell. ") + esc(plateText(exercise.equipment.start, exercise.equipment.dumbbells)) + '</p>';
          html += '</div>';
        });
      });
      if (plan.cardioSegments) html += '<div class="cardio-timeline">' + plan.cardioSegments.map(function (segment) { return '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>' + segment.speed.toFixed(1) + ' mph · incline ' + segment.incline + '</strong><span>' + esc(segment.cue) + '</span></div></div>'; }).join("") + '</div>';
      html += '</section>';
    });
    return html;
  }

  function renderCheckin() {
    var summary = buildCheckin(TODAY);
    return header("Weekly Check-In", "One tap, no retyping") +
      '<section class="card"><div class="card-head"><div><h2>Send this to ChatGPT</h2><p>Each Sunday, copy this summary into our Workout conversation.</p></div></div>' +
      '<textarea id="checkin-output" class="checkin-output" readonly>' + esc(summary) + '</textarea>' +
      '<div class="row wrap"><button id="copy-checkin" class="primary">Copy check-in</button><button id="download-backup" class="secondary">Download private backup</button><button id="lock-tracker" class="secondary">Lock this device</button></div></section>' +
      '<section class="card notification-card"><div><p class="eyebrow">Phone alerts</p><h2>Workout, water, and protein reminders</h2><p class="notification-status">Specific reminders at useful times, with quiet hours from 11 PM to 4 AM. Cardio alerts continue while YouTube is open.</p></div>' +
      '<button id="enable-notifications" class="' + (state.notificationEnabled ? "secondary" : "primary") + '">' + (state.notificationEnabled ? "Notifications enabled" : "Enable notifications") + '</button><p id="notification-message" class="notification-status"></p></section>' +
      '<section class="card"><div class="notice">Your weekly summary is only copied when you tap the button. Meal analysis sends only the meal photo and notes you choose, and does not expose your dashboard access code.</div></section>';
  }

  function periodStats(startIso, endIso) {
    var result = { loggedDays: 0, strengthDone: 0, strengthPlanned: 0, cardioDone: 0, cardioPlanned: 0, proteinDays: 0, calorieDays: 0, weights: [], latestWeight: 0 };
    for (var iso = startIso; iso <= endIso; iso = addDays(iso, 1)) {
      var day = state.data.days[iso];
      var plan = planForDate(iso);
      if (plan.type === "Strength") result.strengthPlanned++;
      if (plan.type === "Cardio") result.cardioPlanned++;
      if (!day) continue;
      var t = totals(day);
      var hasLog = number(day.weight) || day.meals.length || Object.keys(day.exercises || {}).length || day.workout.notes || day.steps;
      if (hasLog) result.loggedDays++;
      if (t.protein >= state.data.targets.protein) result.proteinDays++;
      if (t.calories > 0 && t.calories <= state.data.targets.calories + 100) result.calorieDays++;
      if (number(day.weight)) { result.weights.push(number(day.weight)); result.latestWeight = number(day.weight); }
      if (sessionComplete(day, plan)) {
        if (plan.type === "Strength") result.strengthDone++;
        if (plan.type === "Cardio") result.cardioDone++;
      }
    }
    return result;
  }

  function sessionComplete(day, plan) {
    if (!day) return false;
    if (day.workout && day.workout.completed) return true;
    var planned = exercisesForPlan(plan);
    var completed = planned.filter(function (exercise) { return day.exercises && day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; }).length;
    return planned.length > 0 && completed / planned.length >= 0.5;
  }

  function buildCheckin(endIso) {
    var startIso = addDays(endIso, -6);
    var stats = periodStats(startIso, endIso);
    var average = stats.weights.length ? stats.weights.reduce(function (a, b) { return a + b; }, 0) / stats.weights.length : 0;
    var change = stats.weights.length > 1 ? stats.weights[stats.weights.length - 1] - stats.weights[0] : 0;
    var notes = [];
    var training = [];
    for (var iso = startIso; iso <= endIso; iso = addDays(iso, 1)) {
      var day = state.data.days[iso];
      if (!day) continue;
      if (day.workout && day.workout.notes) notes.push(formatDate(iso, { weekday: "short" }) + ": " + day.workout.notes);
      var exerciseLines = [];
      var plan = planForDate(iso);
      exercisesForPlan(plan).forEach(function (exercise) {
        var log = day.exercises && day.exercises[exerciseId(exercise.name)];
        if (!log || (!log.done && !log.load && !log.reps)) return;
        exerciseLines.push("  " + (log.done ? "✓ " : "• ") + exercise.name + (log.load ? " | " + log.load : "") + (log.reps ? " | " + log.reps : ""));
      });
      if (exerciseLines.length || (day.workout && day.workout.rating)) {
        training.push(formatDate(iso, { weekday: "short", month: "short", day: "numeric" }) + " · " + plan.title + (day.workout.rating ? " · " + day.workout.rating : "") + "\n" + exerciseLines.join("\n"));
      }
    }
    return [
      "VINNY WORKOUT 2.0 WEEKLY CHECK-IN",
      formatDate(startIso, { month: "short", day: "numeric" }) + " to " + formatDate(endIso, { month: "short", day: "numeric", year: "numeric" }),
      "",
      "Morning weights: " + (stats.weights.length ? stats.weights.map(function (w) { return w.toFixed(1); }).join(", ") + " lb" : "none logged"),
      "Weekly average: " + (average ? average.toFixed(1) + " lb" : "not available"),
      "First to latest change: " + (stats.weights.length > 1 ? (change > 0 ? "+" : "") + change.toFixed(1) + " lb" : "not available"),
      "Strength sessions: " + stats.strengthDone + " completed",
      "Cardio sessions: " + stats.cardioDone + " completed",
      "Protein target days: " + stats.proteinDays,
      "Calorie target days: " + stats.calorieDays,
      "",
      "Training details:",
      training.length ? training.join("\n") : "No exercise details entered.",
      "",
      "Notes:",
      notes.length ? notes.join("\n") : "No notes entered.",
      "",
      "Please review my trend, adherence, recovery, and exercise logs, then give me any changes for next week."
    ].join("\n");
  }

  function bindViewEvents() {
    document.querySelectorAll("[data-date]").forEach(function (button) { button.addEventListener("click", function () { state.revealedPhoto = null; state.selectedDate = button.dataset.date; render(); }); });
    document.querySelectorAll("[data-week-shift]").forEach(function (button) { button.addEventListener("click", function () { state.revealedPhoto = null; state.selectedDate = addDays(state.selectedDate, Number(button.dataset.weekShift)); render(); }); });
    document.querySelectorAll("[data-this-week]").forEach(function (button) { button.addEventListener("click", function () { state.revealedPhoto = null; state.selectedDate = TODAY; render(); }); });
    if (state.view !== "today") {
      var copy = document.getElementById("copy-checkin");
      if (copy) copy.addEventListener("click", copyCheckin);
      var backup = document.getElementById("download-backup");
      if (backup) backup.addEventListener("click", downloadBackup);
      var lock = document.getElementById("lock-tracker");
      if (lock) lock.addEventListener("click", lockTracker);
      var enableNotifications = document.getElementById("enable-notifications");
      if (enableNotifications) enableNotifications.addEventListener("click", enablePushNotifications);
      return;
    }

    ["weight", "water"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function (event) { getDay(state.selectedDate)[id] = event.target.value; queueSave(); });
    });
    document.getElementById("day-note").addEventListener("change", function (event) { getDay(state.selectedDate).workout.notes = event.target.value; queueSave(); });
    document.getElementById("session-rating").addEventListener("change", function (event) { getDay(state.selectedDate).workout.rating = event.target.value; queueSave(); });
    document.querySelectorAll("[data-exercise-done]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseDone, "done", input.checked); }); });
    document.querySelectorAll("[data-exercise-load]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseLoad, "load", input.value); }); });
    document.querySelectorAll("[data-exercise-reps]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseReps, "reps", input.value); }); });
    document.querySelectorAll("[data-load-feel]").forEach(function (button) { button.addEventListener("click", function () { updateExercise(button.dataset.loadFeel, "loadFeel", button.dataset.feel); }); });
    document.querySelectorAll("[data-add-photo]").forEach(function (button) { button.addEventListener("click", function () { openPhotoDialog(button.dataset.addPhoto); }); });
    document.querySelectorAll("[data-reveal-photo]").forEach(function (button) { button.addEventListener("click", function () { togglePhotoReveal(button.dataset.revealPhoto); }); });
    document.querySelectorAll("[data-remove-photo]").forEach(function (button) { button.addEventListener("click", function () { removePhoto(button.dataset.removePhoto); }); });
    document.querySelectorAll("[data-remove-meal]").forEach(function (button) { button.addEventListener("click", function () { getDay(state.selectedDate).meals.splice(Number(button.dataset.removeMeal), 1); queueSave(true); }); });
    var favoriteFilter = document.getElementById("favorite-category-filter");
    if (favoriteFilter) favoriteFilter.addEventListener("change", function () { state.favoriteFilter = favoriteFilter.value; render(); });
    var addFavorite = document.getElementById("add-favorite-meal");
    if (addFavorite) addFavorite.addEventListener("click", function () { useSelectedFavorite(false); });
    var adjustFavorite = document.getElementById("adjust-favorite-meal");
    if (adjustFavorite) adjustFavorite.addEventListener("click", function () { useSelectedFavorite(true); });
    document.querySelectorAll("[data-favorite-name]").forEach(function (input) { input.addEventListener("change", function () { updateFavorite(input.dataset.favoriteName, "name", input.value.trim() || "Favorite meal"); }); });
    document.querySelectorAll("[data-favorite-category]").forEach(function (select) { select.addEventListener("change", function () { updateFavorite(select.dataset.favoriteCategory, "category", select.value); }); });
    document.querySelectorAll("[data-remove-favorite]").forEach(function (button) { button.addEventListener("click", function () { removeFavorite(button.dataset.removeFavorite); }); });
    document.querySelectorAll("[data-review-pending]").forEach(function (button) { button.addEventListener("click", function () { reviewPendingMeal(button.dataset.reviewPending); }); });
    document.querySelectorAll("[data-retry-pending]").forEach(function (button) { button.addEventListener("click", function () { retryPendingMeal(button.dataset.retryPending, true); }); });
    document.querySelectorAll("[data-discard-pending]").forEach(function (button) { button.addEventListener("click", function () { discardPendingMeal(button.dataset.discardPending); }); });
    document.getElementById("open-meal").addEventListener("click", function () { openMealDialog(false); });
    document.getElementById("open-advice").addEventListener("click", openAdviceDialog);
    document.getElementById("open-manual-meal").addEventListener("click", function () { openMealDialog(true); });
    var startCardioButton = document.getElementById("start-cardio");
    if (startCardioButton) startCardioButton.addEventListener("click", startCardioSession);
    var cancelCardioButton = document.getElementById("cancel-cardio");
    if (cancelCardioButton) cancelCardioButton.addEventListener("click", cancelCardioSession);
  }

  function updateExercise(id, field, value) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    day.exercises[id][field] = value;
    var planned = exercisesForPlan(planForDate(state.selectedDate));
    if (field === "done" && value && !day.exercises[id].load) {
      var exercise = planned.find(function (item) { return exerciseId(item.name) === id; });
      if (exercise && exercise.equipment && exercise.equipment.type === "dumbbell") day.exercises[id].load = recommendedLoad(exercise, id);
    }
    day.workout.completed = planned.every(function (exercise) { return day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; });
    queueSave(field === "done" || field === "load" || field === "loadFeel");
  }

  function togglePhotoReveal(side) {
    var key = state.selectedDate + ":" + side;
    state.revealedPhoto = state.revealedPhoto === key ? null : key;
    render();
  }

  function mealFromNutrition(source, fallbackNotes) {
    return {
      name: source.name || "Meal", protein: number(source.protein), calories: number(source.calories), carbs: number(source.carbs), fat: number(source.fat),
      fiber: optionalNumber(source.fiber), saturatedFat: optionalNumber(source.saturatedFat), addedSugar: optionalNumber(source.addedSugar), sodium: optionalNumber(source.sodium),
      notes: source.notes || fallbackNotes || "", category: MEAL_CATEGORIES.includes(source.category) ? source.category : "",
      estimateConfidence: source.estimateConfidence || source.confidence || "saved favorite", estimateAssumptions: source.estimateAssumptions || source.assumptions || "",
      nutritionBasis: source.nutritionBasis || "Saved favorite", includedItems: source.includedItems || ""
    };
  }

  function selectedFavorite() {
    var select = document.getElementById("favorite-meal-select");
    return select ? favoriteById(select.value) : null;
  }

  function useSelectedFavorite(adjustFirst) {
    var favorite = selectedFavorite();
    if (!favorite) return;
    if (adjustFirst) {
      state.adjustingFavoriteId = favorite.id;
      openMealDialog(true, favorite);
      return;
    }
    favorite.useCount = number(favorite.useCount) + 1;
    favorite.lastUsedAt = new Date().toISOString();
    getDay(state.selectedDate).meals.push(mealFromNutrition(favorite, "Repeated favorite"));
    queueSave(true);
  }

  function updateFavorite(id, field, value) {
    var favorite = favoriteById(id);
    if (!favorite) return;
    favorite[field] = field === "category" ? validCategory(value) : value;
    favorite.updatedAt = new Date().toISOString();
    queueSave(true);
  }

  function removeFavorite(id) {
    var favorite = favoriteById(id);
    if (!favorite || !confirm("Remove " + favorite.name + " from favorites?")) return;
    state.data.favorites = state.data.favorites.filter(function (item) { return item.id !== id; });
    queueSave(true);
  }

  function openMealDialog(manual, source) {
    state.mealEstimate = null;
    state.activePendingMealId = null;
    if (!source) state.adjustingFavoriteId = null;
    state.adviceImage = source && source.adviceImage || "";
    document.getElementById("meal-notes").value = source && source.notes || "";
    document.getElementById("meal-photo").value = "";
    document.getElementById("keep-meal-photo").checked = false;
    document.getElementById("save-meal-favorite").checked = false;
    document.getElementById("favorite-category-wrap").hidden = true;
    document.getElementById("meal-error").textContent = "";
    document.getElementById("meal-result").hidden = !manual;
    if (source) showMealResult(source);
    else if (manual) showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", fiber: null, saturatedFat: null, addedSugar: null, sodium: null, category: defaultMealCategory(), confidence: "Manual entry", nutritionBasis: "Manual", assumptions: "Enter the package, restaurant, or measured values you trust." });
    document.getElementById("meal-dialog").showModal();
    document.getElementById("meal-close").focus({ preventScroll: true });
  }

  function showMealResult(result) {
    state.mealEstimate = result;
    document.getElementById("meal-result").hidden = false;
    document.getElementById("meal-result-name").value = result.name || "Meal";
    document.getElementById("meal-result-calories").value = result.calories == null ? "" : result.calories;
    document.getElementById("meal-result-protein").value = result.protein == null ? "" : result.protein;
    document.getElementById("meal-result-carbs").value = result.carbs == null ? "" : result.carbs;
    document.getElementById("meal-result-fat").value = result.fat == null ? "" : result.fat;
    document.getElementById("meal-result-fiber").value = result.fiber == null ? "" : result.fiber;
    document.getElementById("meal-result-saturated-fat").value = result.saturatedFat == null ? "" : result.saturatedFat;
    document.getElementById("meal-result-added-sugar").value = result.addedSugar == null ? "" : result.addedSugar;
    document.getElementById("meal-result-sodium").value = result.sodium == null ? "" : result.sodium;
    document.getElementById("meal-confidence").textContent = (result.confidence || "Estimate") + " confidence—review before saving";
    document.getElementById("meal-included-items").textContent = result.includedItems ? "Included: " + result.includedItems : "";
    document.getElementById("meal-nutrition-basis").textContent = result.nutritionBasis ? "Nutrition source: " + result.nutritionBasis : "";
    document.getElementById("meal-assumptions").textContent = result.assumptions || "Nutrition values are estimates.";
    setFavoriteCategory(result.category || defaultMealCategory(), Boolean(result.category));
  }

  function setFavoriteCategory(category, recommended) {
    category = validCategory(category);
    document.querySelectorAll('input[name="favorite-category"]').forEach(function (input) { input.checked = input.value === category; });
    document.getElementById("favorite-category-note").textContent = recommended ? "Suggested from this meal—you can change it." : "Choose where you want this favorite to live.";
  }

  function openAdviceDialog() {
    document.getElementById("advice-error").textContent = "";
    document.getElementById("advice-question").value = "";
    document.getElementById("advice-photo").value = "";
    renderAdviceConversation();
    document.getElementById("advice-dialog").showModal();
    document.getElementById("advice-close").focus({ preventScroll: true });
  }

  function renderAdviceConversation() {
    var container = document.getElementById("advice-conversation");
    container.innerHTML = state.mealAdvice.turns.map(function (turn) {
      return '<div class="advice-turn ' + (turn.role === "user" ? "user" : "assistant") + '"><strong>' + (turn.role === "user" ? "You" : "Meal coach") + '</strong>' + esc(turn.text) + '</div>';
    }).join("");
    container.hidden = !state.mealAdvice.turns.length;
    var logButton = document.getElementById("log-advice-meal");
    logButton.hidden = !(state.mealAdvice.suggestion && Number.isFinite(Number(state.mealAdvice.suggestion.calories)));
    if (state.mealAdvice.turns.length) container.scrollTop = container.scrollHeight;
  }

  function adviceContext() {
    var day = getDay(state.selectedDate);
    var consumed = totals(day);
    var plan = planForDate(state.selectedDate);
    return {
      date: state.selectedDate,
      localTime: new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }).format(new Date()),
      targets: { calories: number(state.data.targets.calories), protein: number(state.data.targets.protein) },
      consumed: { calories: Math.round(consumed.calories), protein: Math.round(consumed.protein), carbs: Math.round(consumed.carbs), fat: Math.round(consumed.fat) },
      remaining: { calories: Math.max(0, Math.round(number(state.data.targets.calories) - consumed.calories)), protein: Math.max(0, Math.round(number(state.data.targets.protein) - consumed.protein)) },
      workout: { title: plan.title, type: plan.type, completed: Boolean(day.workout.completed) }
    };
  }

  async function askMealAdvice() {
    var question = document.getElementById("advice-question").value.trim();
    var file = document.getElementById("advice-photo").files[0];
    if (!question && !file) { document.getElementById("advice-error").textContent = "Ask a question or add a food photo."; return; }
    if (!question) question = "Would this food fit my goals today, and how much should I have?";
    var button = document.getElementById("ask-meal-advice");
    button.disabled = true;
    button.textContent = "Thinking…";
    document.getElementById("advice-error").textContent = "";
    try {
      var image = "";
      if (file) {
        var blob = await compressImage(file, 900, 900, 0.72);
        image = await blobToDataUrl(blob);
        state.adviceImage = image;
      }
      var priorTurns = state.mealAdvice.turns.slice(-6);
      var response = await apiFetch("/meals/advise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, image: image, conversation: priorTurns, context: adviceContext() }) });
      var result = await response.json();
      state.mealAdvice.turns.push({ role: "user", text: question });
      state.mealAdvice.turns.push({ role: "assistant", text: formatAdvice(result) });
      state.mealAdvice.turns = state.mealAdvice.turns.slice(-8);
      state.mealAdvice.suggestion = result.suggestion || null;
      document.getElementById("advice-question").value = "";
      document.getElementById("advice-photo").value = "";
      renderAdviceConversation();
    } catch (error) {
      document.getElementById("advice-error").textContent = error.code === "daily_limit" ? "The free AI limit has been reached for today. Your dashboard and meal logging still work, and advice will be available again after the reset." : "Meal advice is temporarily unavailable. Nothing was logged.";
    } finally {
      button.disabled = false;
      button.textContent = state.mealAdvice.turns.length ? "Ask follow-up" : "Ask for advice";
    }
  }

  function formatAdvice(result) {
    var parts = [result.answer];
    if (result.portion) parts.push("Portion: " + result.portion);
    if (result.dayImpact) parts.push("How it fits today: " + result.dayImpact);
    if (result.alternative) parts.push("Alternative: " + result.alternative);
    if (result.followUpQuestion) parts.push("One thing I need to know: " + result.followUpQuestion);
    return parts.filter(Boolean).join("\n\n");
  }

  function clearMealAdvice() {
    state.mealAdvice = { turns: [], suggestion: null };
    state.adviceImage = "";
    document.getElementById("advice-question").value = "";
    document.getElementById("advice-photo").value = "";
    document.getElementById("advice-error").textContent = "";
    document.getElementById("ask-meal-advice").textContent = "Ask for advice";
    renderAdviceConversation();
  }

  function reviewAdviceMeal() {
    var suggestion = state.mealAdvice.suggestion;
    if (!suggestion) return;
    var lastQuestion = state.mealAdvice.turns.slice().reverse().find(function (turn) { return turn.role === "user"; });
    document.getElementById("advice-dialog").close();
    openMealDialog(true, Object.assign({}, suggestion, { notes: lastQuestion ? lastQuestion.text : "Meal discussed with the meal coach", confidence: "AI advice", assumptions: suggestion.assumptions || "Review the amount before saving.", adviceImage: state.adviceImage }));
  }

  async function analyzeMeal() {
    var notes = document.getElementById("meal-notes").value.trim();
    var file = document.getElementById("meal-photo").files[0];
    if (!notes && !file) { document.getElementById("meal-error").textContent = "Add a photo, notes, or both."; return; }
    var button = document.getElementById("analyze-meal");
    button.disabled = true;
    button.textContent = "Estimating…";
    document.getElementById("meal-error").textContent = "";
    try {
      var pending = {
        id: crypto.randomUUID(), date: state.selectedDate, createdAt: new Date().toISOString(), notes: notes,
        photoId: "", localImage: "", keepPhoto: document.getElementById("keep-meal-photo").checked,
        status: "pending", result: null, retryAt: "", lastError: ""
      };
      if (file) {
        var blob = await compressImage(file, 900, 900, 0.72);
        if (localMode) pending.localImage = await blobToDataUrl(blob);
        else {
          pending.photoId = state.selectedDate + "-meal-pending-" + pending.id + ".jpg";
          await uploadPhoto(pending.photoId, blob);
        }
      }
      state.data.pendingMeals.push(pending);
      state.activePendingMealId = pending.id;
      queueSave(false);
      await saveData();
      await runPendingEstimate(pending, true);
    } catch (error) {
      document.getElementById("meal-error").textContent = error.message || "That meal could not be saved.";
    } finally {
      button.disabled = false;
      button.textContent = "Estimate for me";
    }
  }

  function findPendingMeal(id) {
    return (state.data.pendingMeals || []).find(function (meal) { return meal.id === id; });
  }

  async function runPendingEstimate(pending, reviewOnSuccess) {
    if (!pending || pending.status === "estimating") return false;
    pending.status = "estimating";
    pending.lastError = "";
    queueSave(true);
    try {
      var response = await apiFetch("/meals/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: pending.notes, photoId: pending.photoId, image: pending.localImage }) });
      pending.result = await response.json();
      pending.status = "ready";
      pending.retryAt = "";
      queueSave(false);
      if (reviewOnSuccess) {
        state.activePendingMealId = pending.id;
        showMealResult(pending.result);
      } else {
        render();
      }
      return true;
    } catch (error) {
      pending.status = "waiting";
      pending.lastError = error.code || "temporary";
      pending.retryAt = error.retryAt || new Date(Date.now() + 30 * 60 * 1000).toISOString();
      state.activePendingMealId = null;
      queueSave(false);
      await saveData();
      if (document.getElementById("meal-dialog").open) document.getElementById("meal-dialog").close();
      render();
      schedulePendingRetry();
      return false;
    }
  }

  async function retryPendingMeal(id, manual) {
    var pending = findPendingMeal(id);
    if (!pending || pending.status === "ready") return;
    if (!manual && pending.retryAt && new Date(pending.retryAt).getTime() > Date.now()) return;
    await runPendingEstimate(pending, false);
  }

  async function retryDuePendingMeals() {
    var due = (state.data.pendingMeals || []).filter(function (meal) {
      return meal.status !== "ready" && meal.status !== "estimating" && (!meal.retryAt || new Date(meal.retryAt).getTime() <= Date.now());
    });
    for (var i = 0; i < due.length; i++) {
      await retryPendingMeal(due[i].id, false);
      if (due[i].lastError === "daily_limit") break;
    }
    schedulePendingRetry();
  }

  function schedulePendingRetry() {
    clearTimeout(state.pendingRetryTimer);
    var times = (state.data.pendingMeals || []).filter(function (meal) { return meal.status !== "ready" && meal.retryAt; }).map(function (meal) { return new Date(meal.retryAt).getTime(); }).filter(Number.isFinite);
    if (!times.length) return;
    var wait = Math.max(1000, Math.min.apply(Math, times) - Date.now());
    state.pendingRetryTimer = setTimeout(retryDuePendingMeals, Math.min(wait, 2147483647));
  }

  function startPendingRetry() {
    if (state.pendingRetryStarted) return;
    state.pendingRetryStarted = true;
    setTimeout(retryDuePendingMeals, 750);
  }

  function reviewPendingMeal(id) {
    var pending = findPendingMeal(id);
    if (!pending || !pending.result) return;
    state.activePendingMealId = id;
    state.mealEstimate = pending.result;
    document.getElementById("meal-notes").value = pending.notes || "";
    document.getElementById("meal-photo").value = "";
    document.getElementById("keep-meal-photo").checked = Boolean(pending.keepPhoto);
    document.getElementById("save-meal-favorite").checked = false;
    document.getElementById("favorite-category-wrap").hidden = true;
    document.getElementById("meal-error").textContent = "";
    state.adjustingFavoriteId = null;
    state.adviceImage = "";
    showMealResult(pending.result);
    document.getElementById("meal-dialog").showModal();
    document.getElementById("meal-close").focus({ preventScroll: true });
  }

  async function discardPendingMeal(id) {
    var pending = findPendingMeal(id);
    if (!pending || !confirm("Discard this saved meal entry?")) return;
    if (pending.photoId && !localMode) {
      try { await apiFetch("/photos/" + encodeURIComponent(pending.photoId), { method: "DELETE" }); } catch (ignore) {}
    }
    state.data.pendingMeals = state.data.pendingMeals.filter(function (meal) { return meal.id !== id; });
    queueSave(true);
  }

  async function saveMeal() {
    var pending = state.activePendingMealId && findPendingMeal(state.activePendingMealId);
    var meal = {
      name: document.getElementById("meal-result-name").value.trim() || "Meal",
      calories: number(document.getElementById("meal-result-calories").value),
      protein: number(document.getElementById("meal-result-protein").value),
      carbs: number(document.getElementById("meal-result-carbs").value),
      fat: number(document.getElementById("meal-result-fat").value),
      fiber: optionalNumber(document.getElementById("meal-result-fiber").value),
      saturatedFat: optionalNumber(document.getElementById("meal-result-saturated-fat").value),
      addedSugar: optionalNumber(document.getElementById("meal-result-added-sugar").value),
      sodium: optionalNumber(document.getElementById("meal-result-sodium").value),
      notes: document.getElementById("meal-notes").value.trim(),
      category: state.mealEstimate && MEAL_CATEGORIES.includes(state.mealEstimate.category) ? state.mealEstimate.category : "",
      estimateConfidence: state.mealEstimate && state.mealEstimate.confidence || "manual",
      estimateAssumptions: state.mealEstimate && state.mealEstimate.assumptions || "",
      includedItems: state.mealEstimate && state.mealEstimate.includedItems || "",
      nutritionBasis: state.mealEstimate && state.mealEstimate.nutritionBasis || "Manual"
    };
    var file = document.getElementById("meal-photo").files[0];
    if (pending && pending.photoId && document.getElementById("keep-meal-photo").checked) {
      meal.photo = { id: pending.photoId };
    } else if (pending && pending.localImage && document.getElementById("keep-meal-photo").checked) {
      meal.photo = pending.localImage;
    } else if (file && document.getElementById("keep-meal-photo").checked) {
      try {
        var blob = await compressImage(file, 720, 960, 0.72);
        if (localMode) meal.photo = await blobToDataUrl(blob);
        else { var id = state.selectedDate + "-meal-" + crypto.randomUUID() + ".jpg"; await uploadPhoto(id, blob); meal.photo = { id: id }; }
      } catch (error) { document.getElementById("meal-error").textContent = "The macros are ready, but the optional photo could not be saved."; return; }
    } else if (state.adviceImage && document.getElementById("keep-meal-photo").checked) {
      try {
        var adviceBlob = await (await fetch(state.adviceImage)).blob();
        if (localMode) meal.photo = state.adviceImage;
        else { var advicePhotoId = state.selectedDate + "-meal-" + crypto.randomUUID() + ".jpg"; await uploadPhoto(advicePhotoId, adviceBlob); meal.photo = { id: advicePhotoId }; }
      } catch (error) { document.getElementById("meal-error").textContent = "The macros are ready, but the optional photo could not be saved."; return; }
    }
    var mealDate = pending ? pending.date : state.selectedDate;
    getDay(mealDate).meals.push(meal);
    if (document.getElementById("save-meal-favorite").checked) {
      var selectedCategory = document.querySelector('input[name="favorite-category"]:checked');
      if (!selectedCategory) { document.getElementById("meal-error").textContent = "Choose a favorite category before saving."; getDay(mealDate).meals.pop(); return; }
      meal.category = selectedCategory.value;
      saveFavoriteFromMeal(meal, selectedCategory.value);
    } else if (state.adjustingFavoriteId) {
      var adjustedFavorite = favoriteById(state.adjustingFavoriteId);
      if (adjustedFavorite) { adjustedFavorite.useCount = number(adjustedFavorite.useCount) + 1; adjustedFavorite.lastUsedAt = new Date().toISOString(); }
    }
    if (pending) {
      state.data.pendingMeals = state.data.pendingMeals.filter(function (item) { return item.id !== pending.id; });
      if (pending.photoId && !meal.photo && !localMode) {
        try { await apiFetch("/photos/" + encodeURIComponent(pending.photoId), { method: "DELETE" }); } catch (ignore) {}
      }
    }
    state.activePendingMealId = null;
    state.adjustingFavoriteId = null;
    state.adviceImage = "";
    document.getElementById("meal-dialog").close();
    queueSave(true);
  }

  function saveFavoriteFromMeal(meal, category) {
    var key = String(meal.name || "").trim().toLowerCase();
    var existing = (state.data.favorites || []).find(function (favorite) { return String(favorite.name || "").trim().toLowerCase() === key; });
    var snapshot = mealFromNutrition(meal);
    delete snapshot.photo;
    if (existing) {
      Object.assign(existing, snapshot, { category: validCategory(category), useCount: number(existing.useCount) + 1, lastUsedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return;
    }
    state.data.favorites.push(Object.assign(snapshot, { id: crypto.randomUUID(), category: validCategory(category), useCount: 1, lastUsedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
  }

  function openPhotoDialog(side) {
    state.pendingPhotoSide = side;
    document.getElementById("photo-title").textContent = "Add " + side + " photo";
    document.getElementById("photo-error").textContent = "";
    document.getElementById("photo-input").value = "";
    document.getElementById("photo-dialog").showModal();
  }

  async function savePhoto() {
    var input = document.getElementById("photo-input");
    if (!input.files || !input.files[0]) return;
    var button = document.getElementById("photo-submit");
    button.disabled = true;
    button.textContent = "Saving...";
    try {
      var blob = await compressImage(input.files[0]);
      var ref;
      if (localMode) {
        ref = await blobToDataUrl(blob);
      } else {
        var id = state.selectedDate + "-" + state.pendingPhotoSide + "-" + crypto.randomUUID() + ".jpg";
        await uploadPhoto(id, blob);
        ref = { id: id };
      }
      getDay(state.selectedDate).photos[state.pendingPhotoSide] = ref;
      document.getElementById("photo-dialog").close();
      queueSave(true);
    } catch (error) {
      document.getElementById("photo-error").textContent = error.message || "Photo could not be saved.";
    } finally {
      button.disabled = false;
      button.textContent = "Save photo";
    }
  }

  async function removePhoto(side) {
    var day = getDay(state.selectedDate);
    var ref = day.photos[side];
    if (ref && typeof ref === "object" && ref.id && !localMode) {
      try { await apiFetch("/photos/" + encodeURIComponent(ref.id), { method: "DELETE" }); } catch (error) { state.sync = "Delete failed"; render(); return; }
    }
    day.photos[side] = null;
    queueSave(true);
  }

  function compressImage(file, requestedWidth, requestedHeight, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var maxWidth = requestedWidth || 720, maxHeight = requestedHeight || 960;
        var ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("Photo conversion failed.")); }, "image/jpeg", quality || 0.72);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("That image could not be opened.")); };
      img.src = url;
    });
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(blob); });
  }

  async function hydratePhotos() {
    var images = Array.from(document.querySelectorAll("img[data-photo-ref]"));
    await Promise.all(images.map(async function (img) {
      var ref = img.dataset.photoRef;
      if (ref.indexOf("data:") === 0) { img.src = ref; return; }
      if (ref.indexOf("r2:") === 0) {
        try {
          var response = await apiFetch("/photos/" + encodeURIComponent(ref.slice(3)), { method: "GET" }, true);
          var blob = await response.blob();
          var url = URL.createObjectURL(blob);
          state.photoUrls.push(url);
          img.src = url;
        } catch (error) { img.alt = "Photo unavailable"; }
      }
    }));
  }

  async function uploadPhoto(id, blob) {
    await apiFetch("/photos/" + encodeURIComponent(id), { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob }, true);
  }

  function urlBase64ToUint8Array(value) {
    var padding = "=".repeat((4 - value.length % 4) % 4);
    var raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, function (char) { return char.charCodeAt(0); });
  }

  async function refreshNotificationState() {
    if (!state.serviceWorker || !("PushManager" in window) || !("Notification" in window) || Notification.permission !== "granted") { state.notificationEnabled = false; return; }
    state.notificationEnabled = Boolean(await state.serviceWorker.pushManager.getSubscription());
  }

  async function enablePushNotifications() {
    var message = document.getElementById("notification-message");
    try {
      if (!state.serviceWorker || !("PushManager" in window) || !("Notification" in window)) throw new Error("Install this dashboard on your Home Screen to enable iPhone notifications.");
      var permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications are blocked. Allow them in iPhone Settings, then try again.");
      var statusResponse = await apiFetch("/notifications/status", { method: "GET" });
      var status = await statusResponse.json();
      if (!status.publicKey) throw new Error("Notification setup is not finished yet.");
      var subscription = await state.serviceWorker.pushManager.getSubscription();
      if (!subscription) subscription = await state.serviceWorker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(status.publicKey) });
      var response = await apiFetch("/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON(), timezone: "America/Chicago" }) });
      var saved = await response.json();
      localStorage.setItem(NOTIFICATION_DEVICE_KEY, saved.id);
      state.notificationEnabled = true;
      await apiFetch("/notifications/test", { method: "POST" });
      if (message) message.textContent = "Enabled. A test alert is on its way now.";
      else render();
    } catch (error) {
      if (message) message.textContent = error.message;
      else alert(error.message);
    }
  }

  async function startCardioSession() {
    try {
      if (!state.notificationEnabled) {
        await enablePushNotifications();
        await refreshNotificationState();
        if (!state.notificationEnabled) return;
      }
      var plan = planForDate(state.selectedDate);
      var duration = cardioDuration(plan);
      var alerts = plan.cardioSegments.slice(1).map(function (segment) {
        return { atMinutes: segment.start, title: "Minute " + segment.start + " · " + segment.speed.toFixed(1) + " mph · incline " + segment.incline, body: segment.cue };
      });
      alerts.push({ atMinutes: duration, title: duration + " minutes complete", body: "Nice work, Vinny. Cooldown finished—log your adjustments and how the session felt." });
      var response = await apiFetch("/notifications/cardio/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: state.selectedDate, title: plan.title, alerts: alerts }) });
      var result = await response.json();
      var day = getDay(state.selectedDate);
      day.cardio = { sessionId: result.id, startedAt: result.startedAt, status: "active" };
      queueSave(true);
    } catch (error) { alert(error.message || "Cardio alerts could not be started."); }
  }

  async function cancelCardioSession() {
    var day = getDay(state.selectedDate);
    try { if (day.cardio && day.cardio.sessionId) await apiFetch("/notifications/cardio/" + encodeURIComponent(day.cardio.sessionId), { method: "DELETE" }); } catch (ignore) {}
    day.cardio = { sessionId: "", startedAt: "", status: "cancelled" };
    queueSave(true);
  }

  function queueSave(redraw) {
    state.sync = "Saving";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    state.saveDirty = true;
    if (redraw) render(); else updateSyncLabel();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveData, 1500);
  }

  function updateSyncLabel() {
    var label = document.querySelector(".sync span:last-child");
    if (label) label.textContent = state.sync;
  }

  async function saveData() {
    clearTimeout(state.saveTimer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    if (localMode) { state.saveDirty = false; state.sync = "Saved locally"; render(); return true; }
    if (state.saveInFlight) {
      state.saveDirty = true;
      await state.savePromise;
      return state.saveDirty ? saveData() : true;
    }
    state.saveInFlight = true;
    state.saveDirty = false;
    var snapshot = JSON.parse(JSON.stringify(state.data));
    state.savePromise = (async function () {
      try {
        var response = await apiFetch("/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload: snapshot, expectedVersion: state.version }) });
        var result = await response.json();
        state.version = result.version;
        state.sync = "Saved";
        return true;
      } catch (error) {
        state.sync = error.message === "conflict" ? "Newer data found. Reload." : "Save failed";
        if (error.message === "conflict") state.saveDirty = false;
        return false;
      }
    })();
    var saved = await state.savePromise;
    state.saveInFlight = false;
    state.savePromise = null;
    if (state.saveDirty) state.saveTimer = setTimeout(saveData, 1000);
    else render();
    return saved;
  }

  async function loadData() {
    state.sync = "Loading";
    if (localMode) {
      var local = localStorage.getItem(STORAGE_KEY);
      if (local) state.data = migrateData(JSON.parse(local));
      state.sync = "Saved locally";
      render();
      return;
    }
    if (!localStorage.getItem(TOKEN_KEY)) { showAccessDialog(); return; }
    try {
      var response = await apiFetch("/data", { method: "GET" });
      var result = await response.json();
      var raw = result.payload || defaultData();
      var migrated = !(raw && raw.schemaVersion === 2);
      state.data = migrateData(raw);
      state.version = number(result.version);
      state.sync = "Saved";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      render();
      if (migrated) queueSave(false);
      startPendingRetry();
    } catch (error) {
      if (error.message === "unauthorized") { localStorage.removeItem(TOKEN_KEY); showAccessDialog("That access code did not work."); return; }
      var cached = localStorage.getItem(STORAGE_KEY);
      if (cached) { state.data = migrateData(JSON.parse(cached)); state.sync = "Offline copy"; render(); }
      else { state.sync = "Load failed"; render(); }
    }
  }

  function migrateData(raw) {
    return ensureDataShape(WorkoutMigration.migrateData(raw, { defaultData: defaultData, defaultDay: defaultDay, addDays: addDays }));
  }

  function ensureDataShape(data) {
    data.profile = Object.assign(defaultData().profile, data.profile || {});
    if (data.profile.startDate === "2026-09-09") data.profile.startDate = "2026-09-10";
    data.targets = Object.assign(defaultData().targets, data.targets || {});
    data.days = data.days || {};
    data.pendingMeals = Array.isArray(data.pendingMeals) ? data.pendingMeals : [];
    data.pendingMeals.forEach(function (meal) {
      if (meal.status === "estimating") { meal.status = "waiting"; meal.retryAt = ""; }
    });
    data.favorites = Array.isArray(data.favorites) ? data.favorites.filter(function (favorite) { return favorite && favorite.name; }).map(function (favorite) {
      favorite.id = favorite.id || crypto.randomUUID();
      favorite.category = validCategory(favorite.category);
      favorite.useCount = number(favorite.useCount);
      return favorite;
    }) : [];
    delete data.targets.steps;
    data.preferences = Object.assign({ notifications: true }, data.preferences || {});
    data.meta = Object.assign({}, data.meta || {}, { planVersion: "workout-2.3-2026-09-09" });
    Object.keys(data.days || {}).forEach(function (iso) {
      var day = data.days[iso];
      day.meals = Array.isArray(day.meals) ? day.meals : [];
      day.exercises = day.exercises || {};
      day.workout = Object.assign({ completed: false, rating: "", notes: "" }, day.workout || {});
      day.cardio = Object.assign({ sessionId: "", startedAt: "", status: "" }, day.cardio || {});
      day.photos = Object.assign({ front: null, side: null, back: null }, day.photos || {});
    });
    return data;
  }

  async function apiFetch(path, options, returnRaw) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Authorization = "Bearer " + (localStorage.getItem(TOKEN_KEY) || "");
    var response = await fetch(API_BASE + path, options);
    if (response.status === 401) throw new Error("unauthorized");
    if (response.status === 409) throw new Error("conflict");
    if (!response.ok) {
      var message = "request failed";
      var detail = {};
      try { detail = await response.json(); message = detail.error || message; } catch (ignore) {}
      var requestError = new Error(message);
      requestError.code = detail.code || "";
      requestError.retryAt = detail.retryAt || "";
      throw requestError;
    }
    return returnRaw ? response : response;
  }

  function showAccessDialog(message) {
    document.getElementById("access-error").textContent = message || "";
    var dialog = document.getElementById("access-dialog");
    if (!dialog.open) dialog.showModal();
  }

  async function submitAccess(event) {
    event.preventDefault();
    var token = document.getElementById("access-token").value;
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    document.getElementById("access-submit").disabled = true;
    try {
      var response = await apiFetch("/data", { method: "GET" });
      var result = await response.json();
      state.data = migrateData(result.payload || defaultData());
      state.version = number(result.version);
      state.sync = "Saved";
      document.getElementById("access-dialog").close();
      render();
      if (!(result.payload && result.payload.schemaVersion === 2)) queueSave(false);
      startPendingRetry();
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      document.getElementById("access-error").textContent = error.message === "unauthorized" ? "That access code did not work." : "The secure tracker could not be reached.";
    } finally {
      document.getElementById("access-submit").disabled = false;
    }
  }

  async function copyCheckin() {
    var output = document.getElementById("checkin-output");
    await navigator.clipboard.writeText(output.value);
    var button = document.getElementById("copy-checkin");
    button.textContent = "Copied";
    setTimeout(function () { button.textContent = "Copy check-in"; }, 1500);
  }

  function downloadBackup() {
    var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vinny-workout-backup-" + TODAY + ".json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function lockTracker() {
    localStorage.removeItem(TOKEN_KEY);
    state.data = defaultData();
    state.sync = "Locked";
    render();
    showAccessDialog();
  }

  document.querySelectorAll(".bottom-nav button").forEach(function (button) { button.addEventListener("click", function () {
    state.revealedPhoto = null;
    state.view = button.dataset.view;
    render();
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }); });
  document.getElementById("access-form").addEventListener("submit", submitAccess);
  document.getElementById("photo-form").addEventListener("submit", function (event) { event.preventDefault(); savePhoto(); });
  document.getElementById("analyze-meal").addEventListener("click", analyzeMeal);
  document.getElementById("manual-meal").addEventListener("click", function () { showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", fiber: null, saturatedFat: null, addedSugar: null, sodium: null, category: defaultMealCategory(), confidence: "Manual entry", nutritionBasis: "Manual", assumptions: "Enter the package, restaurant, or measured values you trust." }); });
  document.getElementById("save-meal-favorite").addEventListener("change", function (event) { document.getElementById("favorite-category-wrap").hidden = !event.target.checked; });
  document.getElementById("meal-cancel").addEventListener("click", function () { document.getElementById("meal-dialog").close(); });
  document.getElementById("save-meal").addEventListener("click", saveMeal);
  document.getElementById("ask-meal-advice").addEventListener("click", askMealAdvice);
  document.getElementById("clear-meal-advice").addEventListener("click", clearMealAdvice);
  document.getElementById("log-advice-meal").addEventListener("click", reviewAdviceMeal);
  document.addEventListener("visibilitychange", function () { if (document.hidden && state.revealedPhoto) { state.revealedPhoto = null; render(); } });
  window.addEventListener("pagehide", function () { state.revealedPhoto = null; });
  if ("serviceWorker" in navigator && !localMode) navigator.serviceWorker.register("./sw.js").then(async function (registration) { state.serviceWorker = registration; await refreshNotificationState(); render(); }).catch(function () {});
  loadData();
})();
