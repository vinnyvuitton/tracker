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
      subtitle: "Day 1 starts Wednesday, September 9",
      type: "Cardio",
      cardioSegments: cardioOne(),
      sections: [{ label: "Treadmill", exercises: [ex("30-Minute Guided Walk", "Follow the six 5-minute stages", "Start the dashboard timer, then watch YouTube. Your phone will alert you at every change.")] }]
    },
    Thu: {
      title: "Upper B",
      subtitle: "Upper chest, back, rear shoulders, and arms",
      type: "Strength",
      sections: [
        { label: "Main Work", exercises: [
          ex("Incline Dumbbell Bench Press", "3 sets of 8 to 12", "Set the bench to a modest incline and keep your shoulder blades set.", load(13, 2)),
          ex("Chest Supported Dumbbell Row", "3 sets of 10 to 15", "Keep your chest on the bench and squeeze your shoulder blades.", load(17, 2)),
          ex("Push Up", "2 controlled sets, stop with 2 reps left", "Keep a straight line from head to heels. Elevate your hands if needed.")
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
    }
  };

  var state = {
    view: "today",
    selectedDate: TODAY,
    data: defaultData(),
    version: 0,
    sync: "Loading",
    saveTimer: null,
    pendingPhotoSide: null,
    photoUrls: [],
    revealedPhoto: null,
    mealEstimate: null,
    serviceWorker: null,
    notificationEnabled: false
  };

  function ex(name, prescription, tip, equipment) {
    return { name: name, prescription: prescription, tip: tip, equipment: equipment || null };
  }

  function load(start, dumbbells) { return { type: "dumbbell", start: start, dumbbells: dumbbells }; }

  function cardioOne() {
    return [
      cardio(0, 5, 2.5, 0, "Easy warmup"), cardio(5, 10, 2.8, 2, "Settle into a brisk walk"),
      cardio(10, 15, 3.0, 3, "Effort check: easy +1% incline; right stay; hard -1%"),
      cardio(15, 20, 3.0, 4, "Strong and controlled—do not hold the rails"),
      cardio(20, 25, 2.9, 3, "Second effort check: easy +1%; right stay; hard -1%"),
      cardio(25, 30, 2.4, 0, "Cooldown")
    ];
  }

  function cardioTwo() {
    return [
      cardio(0, 5, 2.5, 0, "Easy warmup"), cardio(5, 10, 2.9, 2, "Smooth brisk walk"),
      cardio(10, 15, 3.0, 3, "Effort check: easy +1% incline; right stay; hard -1%"),
      cardio(15, 20, 3.1, 3, "Stay tall and keep your hands off the rails"),
      cardio(20, 25, 3.0, 2, "Second effort check: easy +1%; right stay; hard -1%"),
      cardio(25, 30, 2.4, 0, "Cooldown")
    ];
  }

  function cardio(start, end, speed, incline, cue) { return { start: start, end: end, speed: speed, incline: incline, cue: cue }; }

  function defaultData() {
    return {
      schemaVersion: 2,
      profile: { name: "Vinny", age: 35, height: "5 ft 6 in", baselineWeight: 150.6, startDate: "2026-09-09" },
      targets: { calories: 1700, protein: 150, water: 10, checkpointWeight: 140, deadline: "2026-12-31" },
      days: {},
      preferences: { notifications: true },
      meta: { planVersion: "workout-2.1-2026-09-08", createdAt: new Date().toISOString() }
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
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function pct(value, target) { return target > 0 ? clamp(Math.round((value / target) * 100), 0, 100) : 0; }

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
      return sum;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
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

    html += renderPhotos(day, iso);
    html += renderWorkout(day, plan, iso);
    html += renderMeals(day, t);
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
        var firstPlaceholder = plan.type === "Strength" ? "Choose below" : plan.type === "Cardio" ? "Example: +1% at minute 10" : "Optional";
        var secondPlaceholder = plan.type === "Strength" ? "Example: 12, 12, 11" : plan.type === "Cardio" ? "30" : "Optional";
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
    var active = day.cardio && day.cardio.status === "active";
    if (active && day.cardio.startedAt && Date.now() - new Date(day.cardio.startedAt).getTime() > 31 * 60 * 1000) active = false;
    var html = '<div class="cardio-timeline">';
    plan.cardioSegments.forEach(function (segment) {
      html += '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>' + segment.speed.toFixed(1) + ' mph · incline ' + segment.incline + '%</strong><span>' + esc(segment.cue) + '</span></div></div>';
    });
    html += '</div><div class="cardio-controls"><button class="primary" id="start-cardio" ' + (active ? "disabled" : "") + '>' + (active ? "Session alerts active" : "Start 30-minute session") + '</button>';
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
    var saved = savedMeals();
    if (saved.length) html += '<div class="section-label">Quick repeats</div><div class="saved-meals">' + saved.map(function (meal, index) { return '<button data-repeat-meal="' + index + '">' + esc(meal.name) + '</button>'; }).join("") + '</div>';
    html += '<div class="meal-actions"><button id="open-meal" class="primary">Log with photo or notes</button><button id="open-manual-meal" class="secondary">Enter macros manually</button></div></section>';
    return html;
  }

  function savedMeals() {
    var seen = {}, out = [];
    Object.keys(state.data.days || {}).sort().reverse().forEach(function (iso) {
      (state.data.days[iso].meals || []).slice().reverse().forEach(function (meal) {
        var key = [meal.name, meal.calories, meal.protein, meal.carbs, meal.fat].join("|");
        if (!seen[key] && out.length < 6) { seen[key] = true; out.push(meal); }
      });
    });
    return out;
  }

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
    var stats = periodStats("2026-09-09", TODAY);
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
    var html = header("The Plan", "September 9 to December 31");
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
      if (plan.cardioSegments) html += '<div class="cardio-timeline">' + plan.cardioSegments.map(function (segment) { return '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>' + segment.speed.toFixed(1) + ' mph · incline ' + segment.incline + '%</strong><span>' + esc(segment.cue) + '</span></div></div>'; }).join("") + '</div>';
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
    document.querySelectorAll("[data-repeat-meal]").forEach(function (button) { button.addEventListener("click", function () { repeatMeal(Number(button.dataset.repeatMeal)); }); });
    document.getElementById("open-meal").addEventListener("click", function () { openMealDialog(false); });
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

  function repeatMeal(index) {
    var meal = savedMeals()[index];
    if (!meal) return;
    getDay(state.selectedDate).meals.push({ name: meal.name, protein: number(meal.protein), calories: number(meal.calories), carbs: number(meal.carbs), fat: number(meal.fat), notes: meal.notes || "Repeated meal" });
    queueSave(true);
  }

  function openMealDialog(manual) {
    state.mealEstimate = null;
    document.getElementById("meal-notes").value = "";
    document.getElementById("meal-photo").value = "";
    document.getElementById("keep-meal-photo").checked = false;
    document.getElementById("meal-error").textContent = "";
    document.getElementById("meal-result").hidden = !manual;
    if (manual) showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", confidence: "Manual entry", assumptions: "Enter the package, restaurant, or measured values you trust." });
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
    document.getElementById("meal-confidence").textContent = (result.confidence || "Estimate") + " confidence—review before saving";
    document.getElementById("meal-assumptions").textContent = result.assumptions || "Nutrition values are estimates.";
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
      var imageData = "";
      if (file) imageData = await blobToDataUrl(await compressImage(file, 900, 900, 0.72));
      var response = await apiFetch("/meals/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: notes, image: imageData }) });
      showMealResult(await response.json());
    } catch (error) {
      document.getElementById("meal-error").textContent = error.message === "Meal analysis is not configured" ? "AI meal estimates need one final private setup step. You can enter this meal manually now." : (error.message || "That meal could not be estimated.");
    } finally {
      button.disabled = false;
      button.textContent = "Estimate for me";
    }
  }

  async function saveMeal() {
    var meal = {
      name: document.getElementById("meal-result-name").value.trim() || "Meal",
      calories: number(document.getElementById("meal-result-calories").value),
      protein: number(document.getElementById("meal-result-protein").value),
      carbs: number(document.getElementById("meal-result-carbs").value),
      fat: number(document.getElementById("meal-result-fat").value),
      notes: document.getElementById("meal-notes").value.trim(),
      estimateConfidence: state.mealEstimate && state.mealEstimate.confidence || "manual",
      estimateAssumptions: state.mealEstimate && state.mealEstimate.assumptions || ""
    };
    var file = document.getElementById("meal-photo").files[0];
    if (file && document.getElementById("keep-meal-photo").checked) {
      try {
        var blob = await compressImage(file, 720, 960, 0.72);
        if (localMode) meal.photo = await blobToDataUrl(blob);
        else { var id = state.selectedDate + "-meal-" + crypto.randomUUID() + ".jpg"; await uploadPhoto(id, blob); meal.photo = { id: id }; }
      } catch (error) { document.getElementById("meal-error").textContent = "The macros are ready, but the optional photo could not be saved."; return; }
    }
    getDay(state.selectedDate).meals.push(meal);
    document.getElementById("meal-dialog").close();
    queueSave(true);
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
      var alerts = plan.cardioSegments.slice(1).map(function (segment) {
        return { atMinutes: segment.start, title: "Treadmill change · minute " + segment.start, body: segment.speed.toFixed(1) + " mph · incline " + segment.incline + "%. " + segment.cue };
      });
      alerts.push({ atMinutes: 30, title: "Cardio complete", body: "Nice work, Vinny. Cooldown finished—log how the session felt." });
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
    if (redraw) render(); else updateSyncLabel();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveData, 500);
  }

  function updateSyncLabel() {
    var label = document.querySelector(".sync span:last-child");
    if (label) label.textContent = state.sync;
  }

  async function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    if (localMode) { state.sync = "Saved locally"; render(); return; }
    try {
      var response = await apiFetch("/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload: state.data, expectedVersion: state.version }) });
      var result = await response.json();
      state.version = result.version;
      state.sync = "Saved";
    } catch (error) {
      state.sync = error.message === "conflict" ? "Newer data found. Reload." : "Save failed";
    }
    render();
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
    data.targets = Object.assign(defaultData().targets, data.targets || {});
    delete data.targets.steps;
    data.preferences = Object.assign({ notifications: true }, data.preferences || {});
    data.meta = Object.assign({}, data.meta || {}, { planVersion: "workout-2.1-2026-09-08" });
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
      try { var body = await response.json(); message = body.error || message; } catch (ignore) {}
      throw new Error(message);
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

  document.querySelectorAll(".bottom-nav button").forEach(function (button) { button.addEventListener("click", function () { state.revealedPhoto = null; state.view = button.dataset.view; render(); }); });
  document.getElementById("access-form").addEventListener("submit", submitAccess);
  document.getElementById("photo-form").addEventListener("submit", function (event) { event.preventDefault(); savePhoto(); });
  document.getElementById("analyze-meal").addEventListener("click", analyzeMeal);
  document.getElementById("manual-meal").addEventListener("click", function () { showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", confidence: "Manual entry", assumptions: "Enter the package, restaurant, or measured values you trust." }); });
  document.getElementById("meal-cancel").addEventListener("click", function () { document.getElementById("meal-dialog").close(); });
  document.getElementById("save-meal").addEventListener("click", saveMeal);
  document.addEventListener("visibilitychange", function () { if (document.hidden && state.revealedPhoto) { state.revealedPhoto = null; render(); } });
  window.addEventListener("pagehide", function () { state.revealedPhoto = null; });
  if ("serviceWorker" in navigator && !localMode) navigator.serviceWorker.register("./sw.js").then(async function (registration) { state.serviceWorker = registration; await refreshNotificationState(); render(); }).catch(function () {});
  loadData();
})();
