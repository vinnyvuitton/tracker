(function () {
  "use strict";

  var API_BASE = "https://vinny-workout-api.vinny-olsauskas.workers.dev";
  var STORAGE_KEY = "vinny_workout_2_data";
  var TOKEN_KEY = "vinny_workout_2_access";
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var TODAY = chicagoToday();
  var localMode = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:";

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
          ex("Dumbbell Flat Bench Press", "3 sets of 8 to 12", "Keep your feet planted and stop each set with about 3 good reps left."),
          ex("One Arm Dumbbell Row", "3 sets of 10 to 15 each side", "Brace on the bench and pull your elbow toward your hip."),
          ex("Seated Dumbbell Shoulder Press", "3 sets of 8 to 12", "Keep your ribs down and avoid leaning back.")
        ] },
        { label: "Build", exercises: [
          ex("Dumbbell Lateral Raise", "2 sets of 12 to 20", "Use a light load and raise with control."),
          ex("Overhead Dumbbell Triceps Extension", "2 sets of 10 to 15", "Keep your elbows pointed forward and move slowly."),
          ex("Alternating Dumbbell Curl", "2 sets of 10 to 15 each side", "Keep your elbows still and avoid swinging.")
        ] }
      ]
    },
    Tue: {
      title: "Lower A + Core",
      subtitle: "Quads, hamstrings, glutes, and trunk",
      type: "Strength",
      sections: [
        { label: "Lower Body", exercises: [
          ex("Goblet Squat", "3 sets of 10 to 15", "Hold one dumbbell at your chest and sit down between your hips."),
          ex("Dumbbell Romanian Deadlift", "3 sets of 8 to 12", "Push your hips back while keeping a long neutral spine."),
          ex("Dumbbell Reverse Lunge", "2 sets of 8 to 12 each side", "Step back far enough to keep your front foot planted."),
          ex("Standing Calf Raise", "3 sets of 12 to 20", "Pause at the top and lower through a full range.")
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
      sections: [{ label: "Treadmill", exercises: [
        ex("Easy Warmup", "5 minutes", "Walk easily and let your stride loosen up."),
        ex("Brisk Walk", "20 minutes at effort 5 to 6 out of 10", "Use speed and incline that let you speak in complete sentences. Do not hold the rails."),
        ex("Easy Cooldown", "5 minutes", "Gradually slow down until your breathing feels close to normal.")
      ] }]
    },
    Thu: {
      title: "Upper B",
      subtitle: "Upper chest, back, rear shoulders, and arms",
      type: "Strength",
      sections: [
        { label: "Main Work", exercises: [
          ex("Incline Dumbbell Bench Press", "3 sets of 8 to 12", "Set the bench to a modest incline and keep your shoulder blades set."),
          ex("Chest Supported Dumbbell Row", "3 sets of 10 to 15", "Keep your chest on the bench and squeeze your shoulder blades."),
          ex("Push Up", "2 controlled sets, stop with 2 reps left", "Keep a straight line from head to heels. Elevate your hands if needed.")
        ] },
        { label: "Build", exercises: [
          ex("Incline Rear Delt Raise", "2 sets of 12 to 20", "Use a light load and move from the shoulders."),
          ex("Dumbbell Hammer Curl", "2 sets of 10 to 15", "Keep palms facing in and elbows close to your sides."),
          ex("Lying Dumbbell Triceps Extension", "2 sets of 10 to 15", "Move at the elbows and lower the weights with control.")
        ] }
      ]
    },
    Fri: {
      title: "Lower B + Core",
      subtitle: "Single leg strength, glutes, and trunk",
      type: "Strength",
      sections: [
        { label: "Lower Body", exercises: [
          ex("Bulgarian Split Squat", "3 sets of 8 to 12 each side", "Start with bodyweight if balance is the limiting factor."),
          ex("Dumbbell Hip Thrust", "3 sets of 10 to 15", "Pause and squeeze your glutes at the top."),
          ex("Dumbbell Sumo Squat", "3 sets of 10 to 15", "Use a wide stance and keep your knees tracking over your toes."),
          ex("Single Leg Romanian Deadlift", "2 sets of 8 to 12 each side", "Use the bench for balance and keep your hips square."),
          ex("Standing Calf Raise", "3 sets of 12 to 20", "Pause at the top and lower slowly.")
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
      sections: [{ label: "Treadmill", exercises: [
        ex("Easy Warmup", "5 minutes", "Start at a relaxed pace."),
        ex("Steady Walk", "20 minutes at effort 5 to 6 out of 10", "Adjust incline before speed. Stay tall and keep your hands off the rails."),
        ex("Easy Cooldown", "5 minutes", "Reduce incline and speed gradually.")
      ] }]
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
    photoUrls: []
  };

  function ex(name, prescription, tip) {
    return { name: name, prescription: prescription, tip: tip };
  }

  function defaultData() {
    return {
      schemaVersion: 2,
      profile: { name: "Vinny", age: 35, height: "5 ft 6 in", baselineWeight: 150.6, startDate: "2026-09-09" },
      targets: { calories: 1700, protein: 150, water: 10, steps: 8000, checkpointWeight: 140, deadline: "2026-12-31" },
      days: {},
      meta: { planVersion: "workout-2.0-2026-09-07", createdAt: new Date().toISOString() }
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
      '<div class="row wrap"><label class="field">Weight, lb<input id="weight" type="number" min="90" max="300" step="0.1" value="' + esc(day.weight) + '"></label>' +
      '<label class="field">Steps<input id="steps" type="number" min="0" max="100000" step="100" value="' + esc(day.steps) + '"></label>' +
      '<label class="field">Water, glasses<input id="water" type="number" min="0" max="30" step="1" value="' + esc(day.water) + '"></label></div></section>';

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
      html += '<div class="photo-slot" data-photo-container="' + side + '">';
      if (ref) {
        html += '<img alt="' + side + ' progress photo" data-photo-ref="' + esc(photoRefValue(ref)) + '"><button class="remove-photo" data-remove-photo="' + side + '" aria-label="Remove ' + side + ' photo">×</button>';
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
    if (plan.type === "Strength") html += '<div class="notice">Calibration week: choose a load that leaves about 3 good reps in reserve. Technique comes first.</div>';
    plan.sections.forEach(function (section) {
      html += '<div class="section-label">' + esc(section.label) + '</div>';
      section.exercises.forEach(function (exercise) {
        var id = exerciseId(exercise.name);
        var log = day.exercises[id] || {};
        var firstLabel = plan.type === "Strength" ? "Load used" : plan.type === "Cardio" ? "Speed / incline" : "Setup used";
        var secondLabel = plan.type === "Strength" ? "Reps completed" : plan.type === "Cardio" ? "Minutes completed" : "Notes";
        var firstPlaceholder = plan.type === "Strength" ? "Example: 15 lb each" : plan.type === "Cardio" ? "Example: 3.1 mph / 4 incline" : "Optional";
        var secondPlaceholder = plan.type === "Strength" ? "Example: 12, 12, 11" : plan.type === "Cardio" ? "Example: 20" : "Optional";
        html += '<div class="exercise"><div class="exercise-main"><input type="checkbox" data-exercise-done="' + id + '" ' + (log.done ? "checked" : "") + ' aria-label="Complete ' + esc(exercise.name) + '"><div><div class="exercise-name">' + esc(exercise.name) + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div><p class="exercise-tip">' + esc(exercise.tip) + '</p></div></div>' +
          '<div class="exercise-log"><label class="field">' + firstLabel + '<input data-exercise-load="' + id + '" value="' + esc(log.load || "") + '" placeholder="' + firstPlaceholder + '"></label><label class="field">' + secondLabel + '<input data-exercise-reps="' + id + '" value="' + esc(log.reps || "") + '" placeholder="' + secondPlaceholder + '"></label></div></div>';
      });
    });
    html += '<label class="field">Session effort<select id="session-rating"><option value="">Choose after training</option>';
    ["Easy", "Solid", "Hard", "Brutal"].forEach(function (rating) { html += '<option ' + (day.workout.rating === rating ? "selected" : "") + '>' + rating + '</option>'; });
    html += '</select></label></section>';
    return html;
  }

  function renderMeals(day, t) {
    var html = '<section class="card"><div class="card-head"><div><h2>Meals</h2><p>' + Math.round(t.protein) + ' g protein and ' + Math.round(t.calories) + ' calories logged</p></div></div>';
    if (!day.meals.length) html += '<div class="empty">No meals logged yet</div>';
    day.meals.forEach(function (meal, index) {
      html += '<div class="meal"><div><strong>' + esc(meal.name || "Meal") + '</strong><small>' + Math.round(number(meal.protein)) + ' g protein · ' + Math.round(number(meal.calories)) + ' cal</small></div><button data-remove-meal="' + index + '" aria-label="Remove meal">×</button></div>';
    });
    html += '<div class="row wrap"><label class="field">Meal<input id="meal-name" placeholder="Chicken bowl"></label><label class="field">Protein<input id="meal-protein" type="number" min="0" step="1" placeholder="40"></label><label class="field">Calories<input id="meal-calories" type="number" min="0" step="1" placeholder="500"></label><button id="add-meal" class="primary">Add</button></div></section>';
    return html;
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
        section.exercises.forEach(function (exercise) { html += '<div class="exercise"><div class="exercise-name">' + esc(exercise.name) + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div></div>'; });
      });
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
      '<section class="card"><div class="notice">The dashboard never sends your information to ChatGPT automatically. You decide when to copy or upload a check-in.</div></section>';
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
    document.querySelectorAll("[data-date]").forEach(function (button) { button.addEventListener("click", function () { state.selectedDate = button.dataset.date; render(); }); });
    document.querySelectorAll("[data-week-shift]").forEach(function (button) { button.addEventListener("click", function () { state.selectedDate = addDays(state.selectedDate, Number(button.dataset.weekShift)); render(); }); });
    document.querySelectorAll("[data-this-week]").forEach(function (button) { button.addEventListener("click", function () { state.selectedDate = TODAY; render(); }); });
    if (state.view !== "today") {
      var copy = document.getElementById("copy-checkin");
      if (copy) copy.addEventListener("click", copyCheckin);
      var backup = document.getElementById("download-backup");
      if (backup) backup.addEventListener("click", downloadBackup);
      var lock = document.getElementById("lock-tracker");
      if (lock) lock.addEventListener("click", lockTracker);
      return;
    }

    ["weight", "steps", "water"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function (event) { getDay(state.selectedDate)[id] = event.target.value; queueSave(); });
    });
    document.getElementById("day-note").addEventListener("change", function (event) { getDay(state.selectedDate).workout.notes = event.target.value; queueSave(); });
    document.getElementById("session-rating").addEventListener("change", function (event) { getDay(state.selectedDate).workout.rating = event.target.value; queueSave(); });
    document.querySelectorAll("[data-exercise-done]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseDone, "done", input.checked); }); });
    document.querySelectorAll("[data-exercise-load]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseLoad, "load", input.value); }); });
    document.querySelectorAll("[data-exercise-reps]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseReps, "reps", input.value); }); });
    document.querySelectorAll("[data-add-photo]").forEach(function (button) { button.addEventListener("click", function () { openPhotoDialog(button.dataset.addPhoto); }); });
    document.querySelectorAll("[data-remove-photo]").forEach(function (button) { button.addEventListener("click", function () { removePhoto(button.dataset.removePhoto); }); });
    document.querySelectorAll("[data-remove-meal]").forEach(function (button) { button.addEventListener("click", function () { getDay(state.selectedDate).meals.splice(Number(button.dataset.removeMeal), 1); queueSave(true); }); });
    document.getElementById("add-meal").addEventListener("click", addMeal);
  }

  function updateExercise(id, field, value) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    day.exercises[id][field] = value;
    var planned = exercisesForPlan(planForDate(state.selectedDate));
    day.workout.completed = planned.every(function (exercise) { return day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; });
    queueSave(field === "done");
  }

  function addMeal() {
    var name = document.getElementById("meal-name").value.trim();
    var protein = number(document.getElementById("meal-protein").value);
    var calories = number(document.getElementById("meal-calories").value);
    if (!name && !protein && !calories) return;
    getDay(state.selectedDate).meals.push({ name: name || "Meal", protein: protein, calories: calories, carbs: 0, fat: 0 });
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

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var maxWidth = 720, maxHeight = 960;
        var ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("Photo conversion failed.")); }, "image/jpeg", 0.72);
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
    return WorkoutMigration.migrateData(raw, { defaultData: defaultData, defaultDay: defaultDay, addDays: addDays });
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

  document.querySelectorAll(".bottom-nav button").forEach(function (button) { button.addEventListener("click", function () { state.view = button.dataset.view; render(); }); });
  document.getElementById("access-form").addEventListener("submit", submitAccess);
  document.getElementById("photo-form").addEventListener("submit", function (event) { event.preventDefault(); savePhoto(); });
  if ("serviceWorker" in navigator && !localMode) navigator.serviceWorker.register("./sw.js").catch(function () {});
  loadData();
})();
