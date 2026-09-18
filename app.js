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
  var NUTRITION_FIELDS = ["calories", "protein", "carbs", "fat", "fiber", "saturatedFat", "addedSugar", "sodium"];
  var PROGRESS_RANGES = [7, 14, 21, 30, 90, "all"];
  var EFFORT_OPTIONS = [
    { value: "much-too-easy", label: "Much too easy" },
    { value: "slightly-easy", label: "Slightly easy" },
    { value: "right", label: "Just right" },
    { value: "slightly-hard", label: "Slightly hard" },
    { value: "too-hard", label: "Too hard" }
  ];
  var lockedScrollY = 0;
  var dialogTouchY = 0;

  var PLAN = {
    Sun: {
      title: "Recovery Day",
      subtitle: "Easy movement that helps Monday feel better",
      type: "Recovery",
      sections: [{ label: "Restore", exercises: [
        ex("Easy Walk", "20 to 40 minutes", "Comfortable pace. You should finish feeling better than when you started."),
        ex("Cat-Cow", "6 slow reps", "Move gently between rounding and extending your upper back."),
        ex("Thread the Needle", "5 reps each side", "Rotate through your upper back without forcing the shoulder."),
        ex("Half-Kneeling Hip Flexor Stretch", "30 seconds each side", "Squeeze the back-leg glute and keep your ribs stacked."),
        ex("90/90 Hip Switch", "8 controlled reps", "Rotate both knees side to side without rushing."),
        ex("Ankle Rock", "10 reps each side", "Drive the knee forward while keeping the heel down."),
        ex("Wall Slide", "8 controlled reps", "Keep ribs down and slide your arms only as high as comfortable.")
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
          ex("Push Up", "2 sets of 6 to 12 clean reps", "Stop each set when you believe you could still do 2 more good reps. If you cannot reach 6 on the floor, put your hands on the bench. If 12 feels easy, record that so we can progress it.", bodyweight("Floor push-up"))
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
          ex("Bulgarian Split Squat", "3 sets of 8 to 12 each side", "Use one hand on the bench for balance. Keep the current load until every rep feels stable.", load(10, 2)),
          ex("Dumbbell Hip Thrust", "3 sets of 10 to 15", "Pause and squeeze your glutes at the top.", load(21, 1)),
          ex("Dumbbell Sumo Squat", "3 sets of 10 to 15", "Use a wide stance and keep your knees tracking over your toes.", load(21, 1)),
          ex("Supported Kickstand Romanian Deadlift", "2 sets of 8 to 12 each side", "Use the bench for support, keep the back toes down as a kickstand, and make balance automatic.", load(10, 1)),
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
      subtitle: "60-minute steady treadmill endurance",
      type: "Cardio",
      cardioSegments: cardioTwo(),
      expressSegments: cardioTwoExpress(),
      sections: [{ label: "Treadmill", exercises: [ex("60-Minute Steady Walk", "Full 60 minutes or 30-minute express option", "Target 5–6/10 effort. Start the dashboard timer, then watch YouTube while alerts guide every change.")] }]
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
    photoUrls: new Map(),
    photoRequests: new Map(),
    revealedPhoto: null,
    mealEstimate: null,
    activePendingMealId: null,
    adjustingFavoriteId: null,
    favoriteFilter: "all",
    favoritesOpen: false,
    favoriteManagerOpen: false,
    mealAdvice: { turns: [], suggestion: null },
    adviceImage: "",
    editingMeal: null,
    progressRange: 21,
    progressMetric: "weight",
    progressExercise: "dumbbell-flat-bench-press",
    checkinWeekStart: null,
    cardioMode: "full",
    pendingRetryStarted: false,
    pendingRetryTimer: null,
    serviceWorker: null,
    notificationEnabled: false,
    exerciseTimer: null,
    timerWakeLock: null,
    cardioPollTimer: null,
    mealPhotoPreviewUrl: "",
    toastTimer: null
  };

  function ex(name, prescription, tip, equipment) {
    return { name: name, prescription: prescription, tip: tip, equipment: equipment || null };
  }

  function load(start, dumbbells) { return { type: "dumbbell", start: start, dumbbells: dumbbells }; }
  function bodyweight(start) { return { type: "bodyweight", start: start }; }

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
      cardio(0, 5, 2.5, 0, "Easy warmup"),
      cardio(5, 15, 3.0, 2, "Settle into a smooth brisk walk"),
      cardio(15, 25, 3.1, 3, "Stay tall and keep your hands off the rails"),
      cardio(25, 35, 3.2, 4, "Target 5–6/10. If still below 5/10, add one incline level"),
      cardio(35, 45, 3.1, 3, "Strong but sustainable"),
      cardio(45, 55, 3.0, 2, "Ease back while keeping a purposeful pace"),
      cardio(55, 60, 2.5, 0, "Easy cooldown")
    ];
  }

  function cardioTwoExpress() {
    return [
      cardio(0, 5, 2.5, 0, "Easy warmup"), cardio(5, 10, 3.0, 2, "Smooth brisk walk"),
      cardio(10, 20, 3.1, 3, "Stay tall and keep your hands off the rails"),
      cardio(20, 25, 3.2, 4, "Target 5–6/10 effort"), cardio(25, 30, 2.5, 0, "Easy cooldown")
    ];
  }

  function cardio(start, end, speed, incline, cue) { return { start: start, end: end, speed: speed, incline: incline, cue: cue }; }

  function cardioDuration(plan) {
    var segments = cardioSegmentsFor(plan);
    return segments.length ? segments[segments.length - 1].end : 0;
  }

  function cardioSegmentsFor(plan) { return state.cardioMode === "express" && plan && plan.expressSegments ? plan.expressSegments : plan && plan.cardioSegments || []; }

  function defaultData() {
    return {
      schemaVersion: 2,
      profile: { name: "Vinny", age: 35, height: "5 ft 6 in", baselineWeight: 150.6, startDate: "2026-09-10" },
      targets: { calories: 1850, calorieMin: 1750, calorieMax: 1950, protein: 140, proteinMin: 135, proteinMax: 150, water: 10, checkpointWeight: 140, deadline: "2026-12-31" },
      days: {},
      pendingMeals: [],
      favorites: [],
      preferences: {
        notifications: true,
        reminders: {
          workout: true, water: true, protein: true, calories: true, pausedDate: "",
          workoutTime: "04:10", waterTimes: ["07:00", "16:30"], proteinTimes: ["12:00", "20:30"],
          calorieTimes: ["13:00", "17:00", "21:00"], dinnerReserve: 600,
          quietStart: "23:00", quietEnd: "04:00"
        }
      },
      weeklyCheckins: {},
      meta: { planVersion: "workout-2.6-2026-09-13", createdAt: new Date().toISOString() }
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
      cardio: { sessionId: "", startedAt: "", status: "", durationMinutes: 0, completedAt: "", result: null },
      photos: { front: null, side: null, back: null, treadmill: null },
      cannabis: "",
      cannabisNote: "",
      extraActivities: []
    };
  }

  function openDashboardDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (!document.documentElement.classList.contains("dialog-open")) {
      lockedScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      document.documentElement.classList.add("dialog-open");
      document.body.classList.add("dialog-open");
      document.body.style.top = "-" + lockedScrollY + "px";
    }
    dialog.showModal();
  }

  function releaseDialogScrollLock() {
    requestAnimationFrame(function () {
      if (document.querySelector("dialog[open]")) return;
      document.documentElement.classList.remove("dialog-open");
      document.body.classList.remove("dialog-open");
      document.body.style.top = "";
      window.scrollTo(0, lockedScrollY);
    });
  }

  function activeDialog() { return document.querySelector("dialog[open]"); }

  function handleDialogTouchStart(event) {
    if (!activeDialog() || !event.touches.length) return;
    dialogTouchY = event.touches[0].clientY;
  }

  function handleDialogTouchMove(event) {
    var dialog = activeDialog();
    if (!dialog || !event.touches.length) return;
    var nextY = event.touches[0].clientY;
    var movement = nextY - dialogTouchY;
    dialogTouchY = nextY;
    if (!dialog.contains(event.target)) { event.preventDefault(); return; }

    var element = event.target.nodeType === 1 ? event.target : event.target.parentElement;
    var canMoveInsidePopup = false;
    while (element && dialog.contains(element)) {
      var style = getComputedStyle(element);
      var scrollable = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
      if (scrollable) {
        var canMoveDown = movement < 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
        var canMoveUp = movement > 0 && element.scrollTop > 1;
        if (canMoveDown || canMoveUp) { canMoveInsidePopup = true; break; }
      }
      if (element === dialog) break;
      element = element.parentElement;
    }
    if (!canMoveInsidePopup) event.preventDefault();
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
  function selectedPhotoFile(libraryId, cameraId) {
    var library = document.getElementById(libraryId), camera = document.getElementById(cameraId);
    return camera && camera.files && camera.files[0] || library && library.files && library.files[0] || null;
  }
  function clearPhotoInputs(libraryId, cameraId) {
    [libraryId, cameraId].forEach(function (id) { var input = document.getElementById(id); if (input) input.value = ""; });
  }
  function clearMealPhotoPreview() {
    if (state.mealPhotoPreviewUrl) URL.revokeObjectURL(state.mealPhotoPreviewUrl);
    state.mealPhotoPreviewUrl = "";
    var preview = document.getElementById("meal-photo-preview");
    if (preview) { preview.hidden = true; preview.classList.remove("status-only"); }
  }
  function showMealPhotoPreview(file) {
    clearMealPhotoPreview();
    if (!file) return;
    state.mealPhotoPreviewUrl = URL.createObjectURL(file);
    document.getElementById("meal-photo-preview-image").src = state.mealPhotoPreviewUrl;
    document.getElementById("meal-photo-status").textContent = "Photo attached—ready to analyze.";
    document.getElementById("meal-photo-preview").hidden = false;
  }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function pct(value, target) { return target > 0 ? clamp(Math.round((value / target) * 100), 0, 100) : 0; }
  function categoryLabel(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ""; }
  function validCategory(value) { return MEAL_CATEGORIES.includes(value) ? value : "snack"; }
  function normalizedReminderTime(value) {
    var parts = String(value || "").split(":");
    var total = (number(parts[0]) * 60 + number(parts[1]));
    total = Math.round(total / 10) * 10 % 1440;
    return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  }
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
    if (previous.log.loadFeel === "much-too-easy") return LOAD_OPTIONS[Math.min(index + 2, LOAD_OPTIONS.length - 1)].weight;
    if (previous.log.loadFeel === "slightly-easy" || previous.log.loadFeel === "too-light") return LOAD_OPTIONS[Math.min(index + 1, LOAD_OPTIONS.length - 1)].weight;
    if (previous.log.loadFeel === "too-hard" || previous.log.loadFeel === "too-heavy") return LOAD_OPTIONS[Math.max(index - 1, 1)].weight;
    return weight;
  }

  function prescribedSetCount(exercise) {
    var match = String(exercise.prescription || "").match(/(\d+)\s+sets?/i);
    return match ? Math.max(1, Number(match[1])) : 1;
  }

  function exerciseSets(log, exercise) {
    if (Array.isArray(log.sets) && log.sets.length) return log.sets.map(function (value) { return String(value == null ? "" : value); });
    var old = String(log.reps || "").split(/[,/]+/).map(function (value) { return value.trim(); }).filter(Boolean);
    while (old.length < prescribedSetCount(exercise)) old.push("");
    return old;
  }

  function renderSetInputs(exercise, id, log) {
    var sets = exerciseSets(log, exercise);
    return '<div class="set-entry"><div class="set-grid">' + sets.map(function (value, index) {
      return '<label>Set ' + (index + 1) + '<input data-exercise-set="' + id + '" data-set-index="' + index + '" inputmode="numeric" min="0" value="' + esc(value) + '" aria-label="' + esc(exercise.name) + ' set ' + (index + 1) + '"></label>';
    }).join("") + '</div><button type="button" class="ghost add-set" data-add-set="' + id + '">+ Add set</button></div>';
  }

  function renderEffortButtons(id, log) {
    return '<div class="effort-buttons" aria-label="How did this exercise feel?">' + EFFORT_OPTIONS.map(function (option) {
      var active = log.loadFeel === option.value || (option.value === "slightly-easy" && log.loadFeel === "too-light") || (option.value === "too-hard" && log.loadFeel === "too-heavy");
      return '<button type="button" data-load-feel="' + id + '" data-feel="' + option.value + '" class="' + (active ? "active" : "") + '">' + option.label + '</button>';
    }).join("") + '</div>';
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
  function exerciseGuide(exercise) {
    var url = "https://www.google.com/search?q=" + encodeURIComponent("site:acefitness.org " + exercise.name + " exercise demonstration");
    return '<details class="form-guide"><summary>Show form guide</summary><p>' + esc(exercise.tip) + '</p><a href="' + url + '" target="_blank" rel="noopener noreferrer">Find a verified ACE demonstration ↗</a></details>';
  }

  function render() {
    document.querySelectorAll(".bottom-nav button").forEach(function (button) { button.classList.toggle("active", button.dataset.view === state.view); });
    var app = document.getElementById("app");
    if (state.view === "today") app.innerHTML = renderToday();
    if (state.view === "progress") app.innerHTML = renderProgress();
    if (state.view === "plan") app.innerHTML = renderPlan();
    if (state.view === "checkin") app.innerHTML = renderCheckin();
    bindViewEvents();
    hydratePhotos();
  }

  function showFeedback(message, tone) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.className = "toast " + (tone || "");
    toast.hidden = false;
    state.toastTimer = setTimeout(function () { toast.hidden = true; }, 8000);
  }

  function showMealFeedback(day, name) {
    var t = totals(day);
    var calorieLeft = Math.round(number(state.data.targets.calories) - t.calories);
    var proteinLeft = Math.max(0, Math.round(number(state.data.targets.protein) - t.protein));
    var message = calorieLeft >= 0 ? name + " saved. About " + calorieLeft + " calories and " + proteinLeft + " g protein remain." : name + " saved. You’re about " + Math.abs(calorieLeft) + " calories over today’s center target—keep the next choice light.";
    showFeedback(message, calorieLeft < 0 ? "warning" : "success");
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
      html += '<button class="day-button ' + (iso === state.selectedDate ? "active " : "") + (i === 3 ? "official" : "") + '" data-date="' + iso + '"' + (i === 3 ? ' title="Weekly progress-photo day"' : '') + '><strong>' + DAYS[i] + '</strong><span>' + Number(iso.slice(8)) + '</span></button>';
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
      nutritionStatCard("Protein", Math.round(t.protein), "g", state.data.targets.proteinMin, state.data.targets.proteinMax) +
      nutritionStatCard("Calories", Math.round(t.calories), "cal", state.data.targets.calorieMin, state.data.targets.calorieMax) +
      '</div>';

    html += '<section class="card"><div class="card-head"><div><h2>Morning check</h2><p>Weight after the bathroom, before food or drink</p></div></div>' +
      '<div class="row wrap"><label class="field">Weight, lb<input id="weight" type="number" inputmode="decimal" min="90" max="300" step="0.1" value="' + esc(day.weight) + '"></label>' +
      '<div class="field">Water, glasses<div class="stepper"><button type="button" data-water-step="-1" aria-label="Subtract one glass">−</button><input id="water" type="number" inputmode="numeric" min="0" max="30" step="1" value="' + esc(day.water) + '" aria-label="Water glasses"><button type="button" data-water-step="1" aria-label="Add one glass">+</button></div></div></div></section>';

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

  function nutritionStatCard(label, value, unit, low, high) {
    low = number(low); high = number(high) || low;
    var status = value < low ? (low - value) + " " + unit + " to target zone" : value > high ? (value - high) + " " + unit + " above target zone" : "Inside target zone";
    var css = value > high ? " over" : value >= low ? " in-zone" : "";
    return '<section class="card nutrition-stat' + css + '"><p class="eyebrow">' + esc(label) + '</p><div class="stat">' + esc(value) + ' <small>/ ' + esc(low) + '–' + esc(high) + ' ' + esc(unit) + '</small></div>' +
      '<div class="progress-bar"><span style="width:' + pct(value, high) + '%"></span></div><p class="target-status">' + esc(status) + '</p></section>';
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
    if (plan.type === "Strength") {
      html += renderEquipmentPrep(day, plan);
      html += '<div class="notice">Choose a load that leaves about 3 good reps in reserve. The plate setup is exact; total dumbbell weight is approximate.</div>';
      if (/Lower/.test(plan.title)) html += '<details class="recovery-option"><summary>Still very sore? Use the recovery version</summary><p>Use bench support, keep every load the same or lighter, and complete two controlled sets per lower-body exercise. Stop if soreness changes your normal movement or becomes sharp pain.</p></details>';
    }
    if (plan.type === "Cardio") html += renderCardioGuide(day, plan);
    var exercisePosition = 0;
    plan.sections.forEach(function (section) {
      html += '<div class="section-label">' + esc(section.label) + '</div>';
      section.exercises.forEach(function (exercise) {
        exercisePosition++;
        var id = exerciseId(exercise.name);
        var log = day.exercises[id] || {};
        var firstLabel = plan.type === "Strength" ? "Load used" : plan.type === "Cardio" ? "Adjustments made" : "Setup used";
        var secondLabel = plan.type === "Strength" ? "Reps completed" : plan.type === "Cardio" ? "Minutes completed" : "Notes";
        var firstPlaceholder = plan.type === "Strength" ? "Choose below" : plan.type === "Cardio" ? "Example: incline 5 felt right" : "Optional";
        var secondPlaceholder = plan.type === "Strength" ? "Example: 12, 12, 11" : plan.type === "Cardio" ? String(cardioDuration(plan)) : "Optional";
        html += '<div class="exercise"><div class="exercise-main"><input type="checkbox" data-exercise-done="' + id + '" ' + (log.done ? "checked" : "") + ' aria-label="Complete ' + esc(exercise.name) + '"><div><div class="exercise-name-row"><div class="exercise-name">' + esc(exercise.name) + equipmentBadge(exercise) + '</div>' + (plan.type === "Strength" ? '<span class="exercise-count">' + exercisePosition + '/' + total + '</span>' : '') + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div>' + exerciseGuide(exercise) + '</div></div>' +
          renderTimedExerciseTimer(plan, exercise, id) + renderExerciseLog(plan, exercise, id, log, firstLabel, secondLabel, firstPlaceholder, secondPlaceholder) + '</div>';
      });
    });
    html += '<label class="field">Session effort<select id="session-rating"><option value="">Choose after training</option>';
    ["Easy", "Solid", "Hard", "Brutal"].forEach(function (rating) { html += '<option ' + (day.workout.rating === rating ? "selected" : "") + '>' + rating + '</option>'; });
    html += '</select></label></section>';
    return html;
  }

  function equipmentBadge(exercise) {
    if (!exercise.equipment || exercise.equipment.type !== "dumbbell") return "";
    var count = exercise.equipment.dumbbells;
    return '<span class="equipment-badge" aria-label="' + count + ' dumbbell' + (count === 1 ? '' : 's') + '">' + (count === 1 ? '🏋️ ×1' : '🏋️ 🏋️') + '</span>';
  }

  function renderEquipmentPrep(day, plan) {
    var plates = {};
    exercisesForPlan(plan).forEach(function (exercise) {
      if (!exercise.equipment || exercise.equipment.type !== "dumbbell") return;
      var id = exerciseId(exercise.name), log = day.exercises[id] || {};
      var option = loadOption(number(log.load) || recommendedLoad(exercise, id));
      if (option) option.plates.forEach(function (plate) { plates[plate] = true; });
    });
    var plateList = Object.keys(plates).map(Number).sort(function (a, b) { return a - b; }).map(function (plate) { return plate + " lb"; }).join(" · ");
    return '<div class="equipment-prep"><strong>Get these ready</strong><span>Plate sizes needed today: ' + esc(plateList || "none") + '</span></div>';
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
        '<div class="exercise-log"><label class="field">Load used<select data-exercise-load="' + id + '">' + options + '</select></label></div>' +
        renderSetInputs(exercise, id, log) + renderEffortButtons(id, log);
    }
    if (plan.type === "Strength" && exercise.equipment && exercise.equipment.type === "bodyweight") {
      var variations = ["Floor push-up", "Incline push-up", "Knee push-up", "Weighted push-up"];
      var chosen = log.load || exercise.equipment.start;
      return '<div class="exercise-log"><label class="field">Variation<select data-exercise-load="' + id + '">' + variations.map(function (variation) { return '<option ' + (variation === chosen ? "selected" : "") + '>' + variation + '</option>'; }).join("") + '</select></label></div>' +
        renderSetInputs(exercise, id, log) + renderEffortButtons(id, log);
    }
    if (plan.type === "Strength") {
      if (exercise.name === "Side Plank") return renderSidePlankInputs(id, log) + renderEffortButtons(id, log);
      return renderSetInputs(exercise, id, log) + renderEffortButtons(id, log);
    }
    return '<div class="exercise-log"><label class="field">' + firstLabel + '<input data-exercise-load="' + id + '" value="' + esc(log.load || "") + '" placeholder="' + firstPlaceholder + '"></label><label class="field">' + secondLabel + '<input data-exercise-reps="' + id + '" inputmode="numeric" value="' + esc(log.reps || "") + '" placeholder="' + secondPlaceholder + '"></label></div>';
  }

  function renderSidePlankInputs(id, log) {
    var sets = sidePlankSets(log);
    return '<div class="set-entry"><div class="set-grid side-plank-grid">' + sets.map(function (value, index) {
      var label = "Set " + (Math.floor(index / 2) + 1) + " " + (index % 2 === 0 ? "left" : "right");
      return '<label>' + label + ' (sec)<input data-exercise-set="' + id + '" data-set-index="' + index + '" inputmode="numeric" min="0" value="' + esc(value) + '" aria-label="Side Plank ' + label.toLowerCase() + '"></label>';
    }).join("") + '</div><button type="button" class="ghost add-set" data-add-side-plank-set="' + id + '">+ Add set</button></div>';
  }

  function sidePlankSets(log) {
    var sets;
    if (Array.isArray(log.sets)) sets = log.sets.map(function (value) { return String(value == null ? "" : value); });
    else {
      var legacy = String(log.reps || "").split(/[,/]+/).map(function (value) { return value.trim(); }).filter(Boolean);
      sets = legacy.length === 2 ? [legacy[0], legacy[0], legacy[1], legacy[1]] : legacy;
    }
    while (sets.length < 4) sets.push("");
    if (sets.length % 2) sets.push("");
    return sets;
  }

  function timedExerciseOptions(exercise) {
    if (!exercise || !/sec|second/i.test(exercise.prescription || "")) return [];
    var values = (exercise.prescription.match(/\d+/g) || []).map(Number).filter(function (value) { return value >= 10 && value <= 180; });
    if (!values.length) return [30];
    var low = Math.min.apply(Math, values), high = Math.max.apply(Math, values);
    return low === high ? [low] : [low, Math.round((low + high) / 2), high].filter(function (value, index, list) { return list.indexOf(value) === index; });
  }

  function renderTimedExerciseTimer(plan, exercise, id) {
    if (plan.type !== "Strength") return "";
    var options = timedExerciseOptions(exercise);
    if (!options.length) return "";
    var timer = state.exerciseTimer && state.exerciseTimer.id === id ? state.exerciseTimer : null;
    var selected = timer ? timer.duration : options[0];
    var remaining = timer ? timer.remaining : selected;
    return '<div class="exercise-timer"><div><span class="timer-label">Stopwatch</span><strong data-timer-display="' + id + '">' + formatTimer(remaining) + '</strong></div><select data-timer-duration="' + id + '" aria-label="Timer length for ' + esc(exercise.name) + '">' + options.map(function (seconds) { return '<option value="' + seconds + '" ' + (selected === seconds ? "selected" : "") + '>' + seconds + ' sec</option>'; }).join("") + '</select><button type="button" class="primary" data-timer-start="' + id + '">' + (timer && timer.running ? "Pause" : timer && timer.remaining > 0 && timer.remaining < timer.duration ? "Resume" : "Start") + '</button><button type="button" class="ghost" data-timer-reset="' + id + '">Reset</button></div>';
  }

  function formatTimer(seconds) {
    seconds = Math.max(0, Math.ceil(number(seconds)));
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function renderCardioGuide(day, plan) {
    var duration = cardioDuration(plan);
    var active = day.cardio && day.cardio.status === "active";
    var complete = day.cardio && day.cardio.status === "complete";
    var html = plan.expressSegments ? '<div class="cardio-mode"><button type="button" data-cardio-mode="full" class="' + (state.cardioMode === "full" ? "active" : "") + '">Full · 60 min</button><button type="button" data-cardio-mode="express" class="' + (state.cardioMode === "express" ? "active" : "") + '">Express · 30 min</button></div>' : '';
    html += '<div class="cardio-timeline">';
    cardioSegmentsFor(plan).forEach(function (segment) {
      html += '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>Incline ' + segment.incline + ' · speed ' + segment.speed.toFixed(1) + ' mph</strong><span>' + esc(segment.cue) + '</span></div></div>';
    });
    html += '</div><div class="cardio-controls"><button class="primary" id="start-cardio" ' + (active ? "disabled" : "") + '>' + (active ? "Session alerts active" : complete ? "Start another " + duration + "-minute session" : "Start " + duration + "-minute session") + '</button>';
    if (active) html += '<button class="secondary" id="cancel-cardio">Cancel alerts</button>';
    html += '</div><p class="notification-status">' + (complete ? "Session complete · " + number(day.cardio.durationMinutes || duration) + " minutes logged automatically." : state.notificationEnabled ? "You can switch to YouTube—push alerts will tell you every incline and speed change." : "Enable notifications first so alerts can reach you while YouTube is open.") + '</p>';
    var treadmillRef = day.photos && day.photos.treadmill;
    html += '<div class="treadmill-result"><strong>Workout result</strong>';
    if (treadmillRef) html += '<div class="treadmill-photo ' + (state.revealedPhoto === state.selectedDate + ":treadmill" ? "revealed" : "") + '" data-photo-container="treadmill"><img alt="Treadmill results" data-photo-ref="' + esc(photoRefValue(treadmillRef)) + '"><span class="photo-load-status" data-photo-status>Loading photo…</span><button type="button" class="treadmill-reveal" data-reveal-photo="treadmill">' + (state.revealedPhoto === state.selectedDate + ":treadmill" ? "Hide result" : "Reveal result") + '</button><button type="button" class="photo-retry" data-retry-photo="treadmill" hidden>Retry photo</button><button type="button" class="treadmill-remove" data-remove-photo="treadmill" aria-label="Remove treadmill result">×</button></div>';
    else html += '<button type="button" class="secondary" data-add-photo="treadmill">Upload treadmill results photo</button>';
    if (day.cardio && day.cardio.result) {
      var result = day.cardio.result;
      html += '<div class="treadmill-fields"><label>Minutes<input data-cardio-result="durationMinutes" type="number" step="0.1" value="' + esc(result.durationMinutes == null ? "" : result.durationMinutes) + '"></label><label>Distance, mi<input data-cardio-result="distanceMiles" type="number" step="0.01" value="' + esc(result.distanceMiles == null ? "" : result.distanceMiles) + '"></label><label>Screen calories<input data-cardio-result="calories" type="number" step="1" value="' + esc(result.calories == null ? "" : result.calories) + '"></label><label>Avg speed<input data-cardio-result="averageSpeedMph" type="number" step="0.1" value="' + esc(result.averageSpeedMph == null ? "" : result.averageSpeedMph) + '"></label><label>Incline shown<input data-cardio-result="incline" type="number" step="0.1" value="' + esc(result.incline == null ? "" : result.incline) + '"></label></div><small>Proposed from the photo—review and correct every value.</small>';
    } else html += '<small>Saved privately with this workout. A clear screen photo can propose reviewable results.</small>';
    html += '</div>';
    return html;
  }

  function renderMeals(day, t) {
    var html = '<section class="card"><div class="card-head"><div><h2>Meals</h2><p>' + Math.round(t.protein) + ' g protein and ' + Math.round(t.calories) + ' calories logged</p></div></div>';
    html += '<div class="meal-actions"><button id="open-meal" class="primary">Log what I ate</button><button id="open-advice" class="secondary">Help me decide</button><button id="open-manual-meal" class="secondary">Enter macros manually</button></div>';
    if (!day.meals.length) html += '<div class="empty">No meals logged yet</div>';
    day.meals.forEach(function (meal, index) {
      var quantity = number(meal.quantity) || 1;
      html += '<div class="meal ' + (meal.photo ? "has-photo" : "") + '">';
      if (meal.photo) html += '<div class="meal-photo ' + (state.revealedPhoto === state.selectedDate + ":meal:" + index ? "revealed" : "") + '"><img alt="Private photo for ' + esc(meal.name || "meal") + '" data-photo-ref="' + esc(photoRefValue(meal.photo)) + '"><button type="button" data-reveal-meal-photo="' + index + '">' + (state.revealedPhoto === state.selectedDate + ":meal:" + index ? "Hide" : "Reveal") + '</button></div>';
      html += '<button type="button" class="meal-summary" data-edit-meal="' + index + '"><strong>' + esc(meal.name || "Meal") + '</strong><small>' + Math.round(number(meal.protein)) + ' g protein · ' + Math.round(number(meal.calories)) + ' cal</small><span>' + (meal.photo ? 'Private photo saved · ' : '') + 'Edit details</span></button>' +
        '<div class="quantity-stepper" aria-label="Quantity for ' + esc(meal.name || "meal") + '"><button type="button" data-meal-quantity="-1" data-meal-index="' + index + '" aria-label="Decrease quantity">−</button><input type="number" min="0.25" max="50" step="0.25" value="' + esc(quantity) + '" data-meal-quantity-input="' + index + '" aria-label="Quantity"><button type="button" data-meal-quantity="1" data-meal-index="' + index + '" aria-label="Increase quantity">+</button></div>' +
        '<button type="button" class="remove-meal" data-remove-meal="' + index + '" aria-label="Remove ' + esc(meal.name || "meal") + '">×</button></div>';
    });
    html += renderNutritionDetails(t, day.meals.length);
    html += '</section>';
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
    return '<details class="favorites-panel" ' + (state.favoritesOpen ? "open" : "") + '><summary>Add from favorites</summary><div class="favorite-picker"><select id="favorite-category-filter" aria-label="Favorite category">' + categoryOptions + '</select><select id="favorite-meal-select" aria-label="Favorite meal">' + favoriteOptions + '</select></div>' +
      '<div class="favorite-picker-actions"><button id="add-favorite-meal" class="primary" ' + (filtered.length ? '' : 'disabled') + '>Add usual portion</button><button id="adjust-favorite-meal" class="secondary" ' + (filtered.length ? '' : 'disabled') + '>Adjust portion first</button></div>' +
      '<details class="favorite-manager" ' + (state.favoriteManagerOpen ? "open" : "") + '><summary>Manage favorites</summary>' + manager + '<p class="notification-status">Changes save automatically.</p></details></details>';
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
    var weights = dates.filter(function (iso) { return number(state.data.days[iso].weight) > 0; });
    var latest = weights.length ? number(state.data.days[weights[weights.length - 1]].weight) : 0;
    var first = weights.length ? number(state.data.days[weights[0]].weight) : 0;
    var change = latest && first ? latest - first : 0;
    var html = header("Progress", "Trend over noise");
    html += '<section class="card"><div class="grid two"><div><p class="eyebrow">Latest weight</p><div class="stat">' + (latest ? latest.toFixed(1) : "No data") + (latest ? ' <small>lb</small>' : '') + '</div></div><div><p class="eyebrow">Change shown</p><div class="stat">' + (weights.length > 1 ? (change > 0 ? "+" : "") + change.toFixed(1) : "No trend") + (weights.length > 1 ? ' <small>lb</small>' : '') + '</div></div></div></section>';
    html += '<section class="card"><div class="card-head"><div><h2>Recent morning weights</h2><p>Use the weekly average to judge progress</p></div></div><div class="weight-list">';
    weights.slice(-8).forEach(function (iso) { html += '<div class="weight-chip"><small>' + esc(formatDate(iso, { month: "short", day: "numeric" })) + '</small><strong>' + number(state.data.days[iso].weight).toFixed(1) + '</strong></div>'; });
    if (!weights.length) html += '<div class="empty">Your weight trend will appear here.</div>';
    html += '</div></section>';
    html += renderProgressChart();
    html += renderGoalProgress();
    return html;
  }

  function progressWindow() {
    var dates = Object.keys(state.data.days || {}).sort();
    var days = state.progressRange === "all" ? Math.max(1, Math.round((new Date(TODAY) - new Date(dates[0] || state.data.profile.startDate)) / 86400000) + 1) : Number(state.progressRange);
    return { start: state.progressRange === "all" ? (dates[0] || state.data.profile.startDate) : addDays(TODAY, 1 - days), end: TODAY, days: days };
  }

  function progressExercises() {
    var seen = {}, out = [];
    DAYS.forEach(function (key) { if (PLAN[key].type !== "Strength") return; exercisesForPlan(PLAN[key]).forEach(function (exercise) {
      var id = exerciseId(exercise.name);
      if (!seen[id]) { seen[id] = true; out.push({ id: id, name: exercise.name }); }
    }); });
    return out;
  }

  function progressSeries(metric, exerciseIdValue, start, end) {
    var points = [];
    for (var iso = start; iso <= end; iso = addDays(iso, 1)) {
      var day = state.data.days[iso];
      if (metric === "weight") { if (day && number(day.weight)) points.push({ iso: iso, value: number(day.weight) }); continue; }
      if (metric === "exercise") {
        var log = day && day.exercises && day.exercises[exerciseIdValue];
        if (log) {
          var exerciseValue = number(log.load);
          if (!exerciseValue && Array.isArray(log.sets)) exerciseValue = log.sets.reduce(function (sum, item) { return sum + number(item); }, 0);
          if (exerciseValue) points.push({ iso: iso, value: exerciseValue });
        }
        continue;
      }
      if (!day) continue;
      if (metric === "workouts") {
        var plan = planForDate(iso);
        if (plan.type === "Strength" || plan.type === "Cardio") points.push({ iso: iso, value: sessionComplete(day, plan) ? 100 : 0 });
      } else {
        var totalsForDay = totals(day);
        points.push({ iso: iso, value: metric === "water" ? number(day.water) : number(totalsForDay[metric]) });
      }
    }
    return points;
  }

  function chartTarget(metric) {
    if (metric === "protein") return number(state.data.targets.protein);
    if (metric === "calories") return number(state.data.targets.calories);
    if (metric === "water") return number(state.data.targets.water);
    if (metric === "workouts") return 100;
    return 0;
  }

  function weeklyAverages(points) {
    var groups = {};
    points.forEach(function (point) { var week = startOfWeek(point.iso); if (!groups[week]) groups[week] = []; groups[week].push(point.value); });
    return Object.keys(groups).sort().map(function (week) { return { iso: week, value: groups[week].reduce(function (sum, value) { return sum + value; }, 0) / groups[week].length }; });
  }

  function metricUnit(metric) { return metric === "weight" || metric === "exercise" ? "lb" : metric === "protein" ? "g" : metric === "calories" ? "cal" : metric === "water" ? "glasses" : "%"; }

  function formatMetricValue(metric, value) {
    var rounded = metric === "weight" || metric === "exercise" ? Math.round(value * 10) / 10 : Math.round(value);
    return rounded + " " + metricUnit(metric);
  }

  function renderSvgChart(points, target, metric) {
    if (!points.length) return '<div class="empty chart-empty">No data in this timeframe yet.</div>';
    var width = 640, height = 250, padLeft = 58, padRight = 34, padY = 24;
    var values = points.map(function (point) { return point.value; });
    var min = Math.min.apply(Math, values.concat(target ? [target] : []));
    var max = Math.max.apply(Math, values.concat(target ? [target] : []));
    if (min === max) { min = Math.max(0, min - 1); max += 1; }
    var x = function (index) { return padLeft + (points.length === 1 ? (width - padLeft - padRight) / 2 : index * (width - padLeft - padRight) / (points.length - 1)); };
    var y = function (value) { return padY + (max - value) * (height - padY * 2) / (max - min); };
    var path = points.map(function (point, index) { return (index ? "L" : "M") + x(index).toFixed(1) + " " + y(point.value).toFixed(1); }).join(" ");
    var grid = "";
    for (var tick = 0; tick <= 4; tick++) {
      var tickValue = min + (max - min) * tick / 4, tickY = y(tickValue);
      grid += '<line class="chart-grid" x1="' + padLeft + '" x2="' + (width - padRight) + '" y1="' + tickY.toFixed(1) + '" y2="' + tickY.toFixed(1) + '"></line><text class="chart-label chart-y-label" x="' + (padLeft - 8) + '" y="' + (tickY + 4).toFixed(1) + '" text-anchor="end">' + esc(metric === "weight" || metric === "exercise" ? tickValue.toFixed(1) : Math.round(tickValue)) + '</text>';
    }
    var targetLine = target ? '<line class="chart-target" x1="' + padLeft + '" x2="' + (width - padRight) + '" y1="' + y(target).toFixed(1) + '" y2="' + y(target).toFixed(1) + '"></line><text class="chart-label" x="' + (width - padRight) + '" y="' + (y(target) - 7).toFixed(1) + '" text-anchor="end">target ' + esc(target) + '</text>' : '';
    var dots = points.map(function (point, index) { return '<circle cx="' + x(index).toFixed(1) + '" cy="' + y(point.value).toFixed(1) + '" r="5" tabindex="0"><title>' + esc(formatDate(point.iso, { month: "short", day: "numeric" })) + ': ' + esc(formatMetricValue(metric, point.value)) + '</title></circle>'; }).join("");
    return '<div class="chart-wrap"><svg class="progress-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Progress chart with numeric scale in ' + esc(metricUnit(metric)) + '">' + grid + targetLine + '<path d="' + path + '"></path>' + dots + '<text class="chart-label" x="' + padLeft + '" y="' + (height - 3) + '">' + esc(formatDate(points[0].iso, { month: "short", day: "numeric" })) + '</text><text class="chart-label" x="' + (width - padRight) + '" y="' + (height - 3) + '" text-anchor="end">' + esc(formatDate(points[points.length - 1].iso, { month: "short", day: "numeric" })) + '</text></svg></div>';
  }

  function renderProgressChart() {
    var windowRange = progressWindow();
    var exercises = progressExercises();
    var options = [{ value: "weight", label: "Weight" }, { value: "exercise", label: "Exercise performance" }, { value: "workouts", label: "Workout completion" }, { value: "protein", label: "Protein" }, { value: "calories", label: "Calories" }, { value: "water", label: "Water" }];
    var points = progressSeries(state.progressMetric, state.progressExercise, windowRange.start, windowRange.end);
    var previous = state.progressRange === "all" ? [] : progressSeries(state.progressMetric, state.progressExercise, addDays(windowRange.start, -windowRange.days), addDays(windowRange.start, -1));
    if (state.progressRange === "all" || Number(state.progressRange) >= 90) { points = weeklyAverages(points); previous = weeklyAverages(previous); }
    var average = points.length ? points.reduce(function (sum, point) { return sum + point.value; }, 0) / points.length : 0;
    var previousAverage = previous.length ? previous.reduce(function (sum, point) { return sum + point.value; }, 0) / previous.length : 0;
    var difference = average - previousAverage;
    var summary = points.length ? '<div class="chart-summary"><div><span>Latest</span><strong>' + esc(formatMetricValue(state.progressMetric, points[points.length - 1].value)) + '</strong></div><div><span>Average</span><strong>' + esc(formatMetricValue(state.progressMetric, average)) + '</strong></div><div><span>Low</span><strong>' + esc(formatMetricValue(state.progressMetric, Math.min.apply(Math, points.map(function (point) { return point.value; })))) + '</strong></div><div><span>High</span><strong>' + esc(formatMetricValue(state.progressMetric, Math.max.apply(Math, points.map(function (point) { return point.value; })))) + '</strong></div></div>' : '';
    return '<section class="card progress-visual"><div class="card-head"><div><p class="eyebrow">Explore your data</p><h2>Progress graph</h2><p>' + (previousAverage ? (difference >= 0 ? "+" : "") + difference.toFixed(1) + ' versus the preceding period' : 'Choose a metric and timeframe') + '</p></div></div>' +
      '<div class="range-tabs">' + PROGRESS_RANGES.map(function (range) { var label = range === "all" ? "All" : range === 30 ? "1 mo" : range === 90 ? "3 mo" : range + " d"; return '<button type="button" data-progress-range="' + range + '" class="' + (String(state.progressRange) === String(range) ? "active" : "") + '">' + label + '</button>'; }).join("") + '</div>' +
      '<div class="progress-filters"><label class="field">Metric<select id="progress-metric">' + options.map(function (option) { return '<option value="' + option.value + '" ' + (state.progressMetric === option.value ? "selected" : "") + '>' + option.label + '</option>'; }).join("") + '</select></label>' +
      (state.progressMetric === "exercise" ? '<label class="field">Exercise<select id="progress-exercise">' + exercises.map(function (exercise) { return '<option value="' + exercise.id + '" ' + (state.progressExercise === exercise.id ? "selected" : "") + '>' + esc(exercise.name) + '</option>'; }).join("") + '</select></label>' : '') + '</div>' + summary + renderSvgChart(points, chartTarget(state.progressMetric), state.progressMetric) + '</section>';
  }

  function renderGoalProgress() {
    var stats = periodStats(state.data.profile.startDate || "2026-09-10", TODAY);
    var start = state.data.profile.baselineWeight;
    var latest = stats.latestWeight || start;
    var weightProgress = pct(start - latest, start - state.data.targets.checkpointWeight);
    return '<section class="card"><div class="card-head"><div><p class="eyebrow">December 31 goal</p><h2>Lean and visibly defined</h2><p>Progress from ' + esc(formatDate(state.data.profile.startDate, { month: "short", day: "numeric" })) + ' through today. Planned totals grow as workout days arrive.</p></div></div>' +
      metric("Weight checkpoint", weightProgress, latest.toFixed(1) + " / " + state.data.targets.checkpointWeight + " lb") +
      metric("Strength sessions through today", pct(stats.strengthDone, stats.strengthPlanned), stats.strengthDone + " of " + stats.strengthPlanned + " planned") +
      metric("Cardio sessions through today", pct(stats.cardioDone, stats.cardioPlanned), stats.cardioDone + " of " + stats.cardioPlanned + " planned") +
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
          html += '<div class="exercise"><div class="exercise-name">' + esc(exercise.name) + equipmentBadge(exercise) + '</div><div class="exercise-prescription">' + esc(exercise.prescription) + '</div>';
          if (exercise.equipment && exercise.equipment.type === "dumbbell") html += '<p class="exercise-tip">Starting point: ≈ ' + exercise.equipment.start + ' lb ' + (exercise.equipment.dumbbells === 2 ? "per dumbbell. " : "on one dumbbell. ") + esc(plateText(exercise.equipment.start, exercise.equipment.dumbbells)) + '</p>';
          html += '</div>';
        });
      });
      if (plan.cardioSegments) html += '<div class="cardio-timeline">' + plan.cardioSegments.map(function (segment) { return '<div class="cardio-step"><time>' + segment.start + '–' + segment.end + ' min</time><div><strong>Incline ' + segment.incline + ' · speed ' + segment.speed.toFixed(1) + ' mph</strong><span>' + esc(segment.cue) + '</span></div></div>'; }).join("") + '</div>';
      html += '</section>';
    });
    return html;
  }

  function renderCheckin() {
    var range = selectedCheckinRange(), summary = buildCheckin(range.start, range.end, range.inProgress), checkin = readWeeklyCheckin(range.start);
    return header("Weekly Check-In", "Current and previous weeks") +
      '<section class="card goals-card"><div class="card-head"><div><h2>Nutrition goals</h2><p>Starting targets stay steady until you approve a change.</p></div></div><div class="grid two"><label class="field">Daily calories<input id="calorie-target" type="number" inputmode="numeric" min="1200" max="4000" step="25" value="' + esc(state.data.targets.calories) + '"></label><label class="field">Daily protein, g<input id="protein-target" type="number" inputmode="numeric" min="50" max="300" step="5" value="' + esc(state.data.targets.protein) + '"></label></div><p class="notification-status">Calorie zone: ' + esc(state.data.targets.calorieMin) + '–' + esc(state.data.targets.calorieMax) + ' · Protein zone: ' + esc(state.data.targets.proteinMin) + '–' + esc(state.data.targets.proteinMax) + ' g</p></section>' +
      '<section class="card"><label class="field">Week<select id="checkin-week">' + renderCheckinWeekOptions(range.start) + '</select></label><div class="card-head"><div><h2>Weekly recovery</h2><p>' + esc(formatDate(range.start, { month: "short", day: "numeric" })) + ' to ' + esc(formatDate(range.end, { month: "short", day: "numeric" })) + (range.inProgress ? ' · In progress' : '') + '</p></div></div><div class="grid two"><label class="field">Hunger, 1–10<input data-weekly-checkin="hunger" type="number" min="1" max="10" value="' + esc(checkin.hunger || "") + '"></label><label class="field">Energy, 1–10<input data-weekly-checkin="energy" type="number" min="1" max="10" value="' + esc(checkin.energy || "") + '"></label><label class="field">Average sleep, hours<input data-weekly-checkin="sleep" type="number" min="0" max="14" step="0.25" value="' + esc(checkin.sleep || "") + '"></label><label class="field">Soreness, 1–10<input data-weekly-checkin="soreness" type="number" min="1" max="10" value="' + esc(checkin.soreness || "") + '"></label></div><label class="field">Recovery notes<textarea data-weekly-checkin="recoveryNotes" placeholder="Anything affecting recovery or performance">' + esc(checkin.recoveryNotes || "") + '</textarea></label></section>' +
      '<section class="card"><div class="card-head"><div><h2>Export selected week</h2><p>' + (range.inProgress ? 'Includes Sunday through today. Future days are left out.' : 'Includes the full Sunday–Saturday week.') + '</p></div></div>' +
      '<textarea id="checkin-output" class="checkin-output" readonly>' + esc(summary) + '</textarea>' +
      '<div class="row wrap"><button id="copy-checkin" class="primary">Copy selected week</button><button id="download-backup" class="secondary">Download private backup</button><button id="lock-tracker" class="secondary">Lock this device</button></div></section>' +
      renderNotificationCard() +
      '<section class="card"><div class="notice">Your weekly summary is only copied when you tap the button. Meal analysis sends only the meal photo and notes you choose, and does not expose your dashboard access code.</div></section>';
  }

  function selectedCheckinRange() {
    var currentStart = startOfWeek(TODAY);
    var selectedStart = state.checkinWeekStart && state.checkinWeekStart <= currentStart ? state.checkinWeekStart : currentStart;
    var inProgress = selectedStart === currentStart;
    return { start: selectedStart, end: inProgress ? TODAY : addDays(selectedStart, 6), inProgress: inProgress };
  }

  function checkinWeekStarts() {
    var currentStart = startOfWeek(TODAY);
    var dates = Object.keys(state.data.days || {}).concat(Object.keys(state.data.weeklyCheckins || {}), [state.data.profile.startDate || TODAY]);
    var earliest = dates.filter(Boolean).sort()[0] || TODAY;
    var firstStart = startOfWeek(earliest > TODAY ? TODAY : earliest);
    var starts = [];
    for (var iso = currentStart; iso >= firstStart; iso = addDays(iso, -7)) starts.push(iso);
    return starts;
  }

  function renderCheckinWeekOptions(selectedStart) {
    var currentStart = startOfWeek(TODAY);
    return checkinWeekStarts().map(function (start) {
      var current = start === currentStart;
      var end = current ? TODAY : addDays(start, 6);
      var label = current ? "This week · " : "";
      label += formatDate(start, { month: "short", day: "numeric" }) + "–" + formatDate(end, { month: "short", day: "numeric" });
      if (current) label += " · In progress";
      return '<option value="' + start + '" ' + (start === selectedStart ? "selected" : "") + '>' + esc(label) + '</option>';
    }).join("");
  }

  function weeklyCheckin(startIso) {
    state.data.weeklyCheckins = state.data.weeklyCheckins || {};
    if (!state.data.weeklyCheckins[startIso]) state.data.weeklyCheckins[startIso] = {};
    return state.data.weeklyCheckins[startIso];
  }

  function readWeeklyCheckin(startIso) {
    return state.data.weeklyCheckins && state.data.weeklyCheckins[startIso] || {};
  }

  function reminderSettings() { return state.data.preferences.reminders; }

  function renderNotificationCard() {
    var reminders = reminderSettings();
    var paused = reminders.pausedDate === TODAY;
    return '<section class="card notification-card"><div><p class="eyebrow">Smart phone alerts</p><h2>Only nudge me when I’m behind</h2><p class="notification-status">Water and protein reminders compare your logged progress with the time of day. Completed targets stay quiet. Cardio alerts continue while another app is open.</p></div>' +
      '<button id="enable-notifications" class="' + (state.notificationEnabled ? "secondary" : "primary") + '">' + (state.notificationEnabled ? "Notifications enabled" : "Enable notifications") + '</button><p id="notification-message" class="notification-status"></p>' +
      '<div class="reminder-types"><label><input type="checkbox" data-reminder-toggle="workout" ' + (reminders.workout ? "checked" : "") + '> Workout</label><label><input type="checkbox" data-reminder-toggle="water" ' + (reminders.water ? "checked" : "") + '> Water</label><label><input type="checkbox" data-reminder-toggle="protein" ' + (reminders.protein ? "checked" : "") + '> Protein</label><label><input type="checkbox" data-reminder-toggle="calories" ' + (reminders.calories ? "checked" : "") + '> Calories</label></div>' +
      '<details class="reminder-settings"><summary>Reminder schedule</summary><div class="grid two"><label class="field">Workout<input type="time" step="600" data-reminder-time="workoutTime" value="' + esc(reminders.workoutTime) + '"></label><label class="field">Morning water<input type="time" step="600" data-reminder-time="waterTimes.0" value="' + esc(reminders.waterTimes[0]) + '"></label><label class="field">Afternoon water<input type="time" step="600" data-reminder-time="waterTimes.1" value="' + esc(reminders.waterTimes[1]) + '"></label><label class="field">Midday protein<input type="time" step="600" data-reminder-time="proteinTimes.0" value="' + esc(reminders.proteinTimes[0]) + '"></label><label class="field">Evening protein<input type="time" step="600" data-reminder-time="proteinTimes.1" value="' + esc(reminders.proteinTimes[1]) + '"></label><label class="field">Calorie pace 1<input type="time" step="600" data-reminder-time="calorieTimes.0" value="' + esc(reminders.calorieTimes[0]) + '"></label><label class="field">Calorie pace 2<input type="time" step="600" data-reminder-time="calorieTimes.1" value="' + esc(reminders.calorieTimes[1]) + '"></label><label class="field">Calorie pace 3<input type="time" step="600" data-reminder-time="calorieTimes.2" value="' + esc(reminders.calorieTimes[2]) + '"></label><label class="field">Calories to reserve for dinner<input type="number" min="300" max="1200" step="50" data-reminder-number="dinnerReserve" value="' + esc(reminders.dinnerReserve) + '"></label><label class="field">Quiet hours start<input type="time" step="600" data-reminder-time="quietStart" value="' + esc(reminders.quietStart) + '"></label><label class="field">Quiet hours end<input type="time" step="600" data-reminder-time="quietEnd" value="' + esc(reminders.quietEnd) + '"></label></div></details>' +
      '<button type="button" id="pause-reminders" class="ghost">' + (paused ? "Resume today’s reminders" : "Pause reminders for today") + '</button></section>';
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
      if (t.protein >= state.data.targets.proteinMin && t.protein <= state.data.targets.proteinMax) result.proteinDays++;
      if (t.calories >= state.data.targets.calorieMin && t.calories <= state.data.targets.calorieMax) result.calorieDays++;
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

  function buildCheckin(startIso, endIso, inProgress) {
    var stats = periodStats(startIso, endIso);
    var average = stats.weights.length ? stats.weights.reduce(function (a, b) { return a + b; }, 0) / stats.weights.length : 0;
    var priorStats = periodStats(addDays(startIso, -7), addDays(startIso, -1));
    var priorAverage = priorStats.weights.length ? priorStats.weights.reduce(function (a, b) { return a + b; }, 0) / priorStats.weights.length : 0;
    var change = stats.weights.length > 1 ? stats.weights[stats.weights.length - 1] - stats.weights[0] : 0;
    var notes = [], nutrition = [], calorieTotal = 0, proteinTotal = 0, nutritionDays = 0;
    var training = [];
    for (var iso = startIso; iso <= endIso; iso = addDays(iso, 1)) {
      var day = state.data.days[iso];
      var t = day ? totals(day) : { calories: 0, protein: 0 };
      var hasNutrition = Boolean(day && day.meals && day.meals.length);
      if (hasNutrition) { calorieTotal += t.calories; proteinTotal += t.protein; nutritionDays++; }
      nutrition.push(formatDate(iso, { weekday: "short", month: "short", day: "numeric" }) + ": " + (hasNutrition ? Math.round(t.calories) + " calories · " + Math.round(t.protein) + " g protein" : "No nutrition data logged") + " · weight " + (day && number(day.weight) ? number(day.weight).toFixed(1) + " lb" : "not logged") + " · water " + (day ? number(day.water) : 0) + " glasses");
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
        var cardioResult = day.cardio && day.cardio.result;
        var resultLine = cardioResult ? "\n  Treadmill result: " + [cardioResult.durationMinutes != null ? cardioResult.durationMinutes + " min" : "", cardioResult.distanceMiles != null ? cardioResult.distanceMiles + " mi" : "", cardioResult.calories != null ? cardioResult.calories + " screen cal" : "", cardioResult.averageSpeedMph != null ? cardioResult.averageSpeedMph + " mph avg" : ""].filter(Boolean).join(" · ") : "";
        training.push(formatDate(iso, { weekday: "short", month: "short", day: "numeric" }) + " · " + plan.title + (day.workout.rating ? " · " + day.workout.rating : "") + "\n" + exerciseLines.join("\n") + resultLine);
      }
    }
    var checkin = readWeeklyCheckin(startIso);
    return [
      "VINNY WORKOUT 2.0 WEEKLY CHECK-IN" + (inProgress ? " · IN PROGRESS" : ""),
      formatDate(startIso, { month: "short", day: "numeric" }) + " to " + formatDate(endIso, { month: "short", day: "numeric", year: "numeric" }),
      "",
      "Morning weights: " + (stats.weights.length ? stats.weights.map(function (w) { return w.toFixed(1); }).join(", ") + " lb" : "none logged"),
      "Weekly average: " + (average ? average.toFixed(1) + " lb" : "not available"),
      "Week-over-week average change: " + (average && priorAverage ? ((average - priorAverage) > 0 ? "+" : "") + (average - priorAverage).toFixed(1) + " lb" : "not available"),
      "First to latest change: " + (stats.weights.length > 1 ? (change > 0 ? "+" : "") + change.toFixed(1) + " lb" : "not available"),
      "Strength sessions: " + stats.strengthDone + " completed",
      "Cardio sessions: " + stats.cardioDone + " completed",
      "Protein target days: " + stats.proteinDays,
      "Calorie target days: " + stats.calorieDays,
      "",
      "Daily summary:",
      nutrition.join("\n"),
      "Weekly nutrition totals: " + (nutritionDays ? Math.round(calorieTotal) + " calories · " + Math.round(proteinTotal) + " g protein" : "not available"),
      "Logged-day averages: " + (nutritionDays ? Math.round(calorieTotal / nutritionDays) + " calories · " + Math.round(proteinTotal / nutritionDays) + " g protein" : "not available"),
      "Current target zones: " + state.data.targets.calorieMin + "–" + state.data.targets.calorieMax + " calories · " + state.data.targets.proteinMin + "–" + state.data.targets.proteinMax + " g protein",
      "",
      "Recovery check-in:",
      "Hunger: " + (checkin.hunger || "not entered") + (checkin.hunger ? "/10" : ""),
      "Energy: " + (checkin.energy || "not entered") + (checkin.energy ? "/10" : ""),
      "Average sleep: " + (checkin.sleep || "not entered") + (checkin.sleep ? " hours" : ""),
      "Soreness: " + (checkin.soreness || "not entered") + (checkin.soreness ? "/10" : ""),
      "Recovery notes: " + (checkin.recoveryNotes || "none entered"),
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
    document.querySelectorAll("[data-progress-range]").forEach(function (button) { button.addEventListener("click", function () { state.progressRange = button.dataset.progressRange === "all" ? "all" : Number(button.dataset.progressRange); render(); }); });
    var progressMetric = document.getElementById("progress-metric");
    if (progressMetric) progressMetric.addEventListener("change", function () { state.progressMetric = progressMetric.value; render(); });
    var progressExercise = document.getElementById("progress-exercise");
    if (progressExercise) progressExercise.addEventListener("change", function () { state.progressExercise = progressExercise.value; render(); });
    var calorieTarget = document.getElementById("calorie-target");
    if (calorieTarget) calorieTarget.addEventListener("change", function () { var value = clamp(number(calorieTarget.value), 1200, 4000); state.data.targets.calories = value; state.data.targets.calorieMin = value - 100; state.data.targets.calorieMax = value + 100; queueSave(true); });
    var proteinTarget = document.getElementById("protein-target");
    if (proteinTarget) proteinTarget.addEventListener("change", function () { var value = clamp(number(proteinTarget.value), 50, 300); state.data.targets.protein = value; state.data.targets.proteinMin = Math.max(0, value - 5); state.data.targets.proteinMax = value + 10; queueSave(true); });
    if (state.view !== "today") {
      var checkinWeek = document.getElementById("checkin-week");
      if (checkinWeek) checkinWeek.addEventListener("change", function () { state.checkinWeekStart = checkinWeek.value; render(); });
      var copy = document.getElementById("copy-checkin");
      if (copy) copy.addEventListener("click", copyCheckin);
      var backup = document.getElementById("download-backup");
      if (backup) backup.addEventListener("click", downloadBackup);
      var lock = document.getElementById("lock-tracker");
      if (lock) lock.addEventListener("click", lockTracker);
      var enableNotifications = document.getElementById("enable-notifications");
      if (enableNotifications) enableNotifications.addEventListener("click", enablePushNotifications);
      document.querySelectorAll("[data-reminder-toggle]").forEach(function (input) { input.addEventListener("change", function () { reminderSettings()[input.dataset.reminderToggle] = input.checked; queueSave(false); }); });
      document.querySelectorAll("[data-reminder-time]").forEach(function (input) { input.addEventListener("change", function () {
        var parts = input.dataset.reminderTime.split(".");
        var value = normalizedReminderTime(input.value);
        input.value = value;
        if (parts.length === 2) reminderSettings()[parts[0]][Number(parts[1])] = value;
        else reminderSettings()[parts[0]] = value;
        queueSave(false);
      }); });
      document.querySelectorAll("[data-reminder-number]").forEach(function (input) { input.addEventListener("change", function () { reminderSettings()[input.dataset.reminderNumber] = clamp(number(input.value), 300, 1200); queueSave(false); }); });
      var pauseReminders = document.getElementById("pause-reminders");
      if (pauseReminders) pauseReminders.addEventListener("click", function () { reminderSettings().pausedDate = reminderSettings().pausedDate === TODAY ? "" : TODAY; queueSave(true); });
      document.querySelectorAll("[data-weekly-checkin]").forEach(function (input) { input.addEventListener("change", function () { var range = selectedCheckinRange(); weeklyCheckin(range.start)[input.dataset.weeklyCheckin] = input.value.trim(); queueSave(true); }); });
      return;
    }

    ["weight", "water"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", function (event) { getDay(state.selectedDate)[id] = event.target.value; queueSave(); });
    });
    document.querySelectorAll("[data-water-step]").forEach(function (button) { button.addEventListener("click", function () { var day = getDay(state.selectedDate); day.water = clamp(number(day.water) + Number(button.dataset.waterStep), 0, 30); queueSave(true); }); });
    document.getElementById("day-note").addEventListener("change", function (event) { getDay(state.selectedDate).workout.notes = event.target.value; queueSave(); });
    document.getElementById("session-rating").addEventListener("change", function (event) { getDay(state.selectedDate).workout.rating = event.target.value; queueSave(); });
    document.querySelectorAll("[data-exercise-done]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseDone, "done", input.checked); }); });
    document.querySelectorAll("[data-exercise-load]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseLoad, "load", input.value); }); });
    document.querySelectorAll("[data-exercise-reps]").forEach(function (input) { input.addEventListener("change", function () { updateExercise(input.dataset.exerciseReps, "reps", input.value); }); });
    document.querySelectorAll("[data-exercise-set]").forEach(function (input) { input.addEventListener("change", function () { updateExerciseSet(input.dataset.exerciseSet, Number(input.dataset.setIndex), input.value); }); });
    document.querySelectorAll("[data-add-set]").forEach(function (button) { button.addEventListener("click", function () { addExerciseSet(button.dataset.addSet); }); });
    document.querySelectorAll("[data-add-side-plank-set]").forEach(function (button) { button.addEventListener("click", function () { addSidePlankSet(button.dataset.addSidePlankSet); }); });
    document.querySelectorAll("[data-load-feel]").forEach(function (button) { button.addEventListener("click", function () { updateExercise(button.dataset.loadFeel, "loadFeel", button.dataset.feel); }); });
    document.querySelectorAll("[data-timer-start]").forEach(function (button) { button.addEventListener("click", function () { toggleExerciseTimer(button.dataset.timerStart); }); });
    document.querySelectorAll("[data-timer-reset]").forEach(function (button) { button.addEventListener("click", function () { resetExerciseTimer(button.dataset.timerReset); }); });
    document.querySelectorAll("[data-timer-duration]").forEach(function (select) { select.addEventListener("change", function () { setExerciseTimerDuration(select.dataset.timerDuration, Number(select.value)); }); });
    document.querySelectorAll("[data-add-photo]").forEach(function (button) { button.addEventListener("click", function () { openPhotoDialog(button.dataset.addPhoto); }); });
    document.querySelectorAll("[data-reveal-photo]").forEach(function (button) { button.addEventListener("click", function () { togglePhotoReveal(button.dataset.revealPhoto); }); });
    document.querySelectorAll("[data-remove-photo]").forEach(function (button) { button.addEventListener("click", function () { removePhoto(button.dataset.removePhoto); }); });
    document.querySelectorAll("[data-retry-photo]").forEach(function (button) { button.addEventListener("click", function () { retryPhoto(button); }); });
    document.querySelectorAll("[data-remove-meal]").forEach(function (button) { button.addEventListener("click", function () { getDay(state.selectedDate).meals.splice(Number(button.dataset.removeMeal), 1); queueSave(true); }); });
    document.querySelectorAll("[data-edit-meal]").forEach(function (button) { button.addEventListener("click", function () { var index = Number(button.dataset.editMeal); openMealDialog(true, getDay(state.selectedDate).meals[index], { date: state.selectedDate, index: index }); }); });
    document.querySelectorAll("[data-meal-quantity]").forEach(function (button) { button.addEventListener("click", function () { var index = Number(button.dataset.mealIndex), meal = getDay(state.selectedDate).meals[index]; setMealQuantity(index, (number(meal.quantity) || 1) + Number(button.dataset.mealQuantity)); }); });
    document.querySelectorAll("[data-meal-quantity-input]").forEach(function (input) { input.addEventListener("change", function () { setMealQuantity(Number(input.dataset.mealQuantityInput), input.value); }); });
    document.querySelectorAll("[data-reveal-meal-photo]").forEach(function (button) { button.addEventListener("click", function () { var key = state.selectedDate + ":meal:" + button.dataset.revealMealPhoto; state.revealedPhoto = state.revealedPhoto === key ? null : key; render(); }); });
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
    document.querySelectorAll("[data-cardio-mode]").forEach(function (button) { button.addEventListener("click", function () { state.cardioMode = button.dataset.cardioMode; render(); }); });
    document.querySelectorAll("[data-cardio-result]").forEach(function (input) { input.addEventListener("change", function () { var day = getDay(state.selectedDate); day.cardio.result = day.cardio.result || {}; day.cardio.result[input.dataset.cardioResult] = optionalNumber(input.value); queueSave(false); }); });
  }

  function updateExercise(id, field, value) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    day.exercises[id][field] = value;
    if (field === "done") delete day.exercises[id].autoCompleted;
    var planned = exercisesForPlan(planForDate(state.selectedDate));
    if (field === "done" && value && !day.exercises[id].load) {
      var exercise = planned.find(function (item) { return exerciseId(item.name) === id; });
      if (exercise && exercise.equipment && exercise.equipment.type === "dumbbell") day.exercises[id].load = recommendedLoad(exercise, id);
      if (exercise && exercise.equipment && exercise.equipment.type === "bodyweight") day.exercises[id].load = exercise.equipment.start;
    }
    var wasComplete = day.workout.completed;
    day.workout.completed = planned.every(function (exercise) { return day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; });
    if (field === "done" && value) showExerciseFeedback(id, planned, day, wasComplete);
    queueSave(field === "done" || field === "load" || field === "loadFeel");
  }

  function updateExerciseSet(id, index, value) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    var exercise = exercisesForPlan(planForDate(state.selectedDate)).find(function (item) { return exerciseId(item.name) === id; });
    var sets = exercise && exercise.name === "Side Plank" ? sidePlankSets(day.exercises[id]) : exerciseSets(day.exercises[id], exercise || { prescription: "1 set" });
    sets[index] = value;
    day.exercises[id].sets = sets;
    day.exercises[id].reps = sets.filter(function (item) { return item !== ""; }).join(", ");
    var requiredEntries = exercise && exercise.name === "Side Plank" ? 4 : prescribedSetCount(exercise || { prescription: "1 set" });
    var prescribedSetsComplete = sets.slice(0, requiredEntries).length === requiredEntries && sets.slice(0, requiredEntries).every(function (item) {
      return String(item == null ? "" : item).trim() !== "" && number(item) > 0;
    });
    var completionChanged = false;
    if (prescribedSetsComplete && !day.exercises[id].done) {
      day.exercises[id].done = true;
      day.exercises[id].autoCompleted = true;
      completionChanged = true;
    } else if (!prescribedSetsComplete && day.exercises[id].done && day.exercises[id].autoCompleted) {
      day.exercises[id].done = false;
      delete day.exercises[id].autoCompleted;
      completionChanged = true;
    }
    var planned = exercisesForPlan(planForDate(state.selectedDate));
    var wasWorkoutComplete = day.workout.completed;
    day.workout.completed = planned.every(function (plannedExercise) { return day.exercises[exerciseId(plannedExercise.name)] && day.exercises[exerciseId(plannedExercise.name)].done; });
    if (completionChanged && day.exercises[id].done) showExerciseFeedback(id, planned, day, wasWorkoutComplete);
    queueSave(completionChanged);
  }

  function showExerciseFeedback(id, planned, day, wasWorkoutComplete) {
    var done = planned.filter(function (exercise) { return day.exercises[exerciseId(exercise.name)] && day.exercises[exerciseId(exercise.name)].done; }).length;
    if (day.workout.completed && !wasWorkoutComplete) showFeedback("Workout complete—great job. You finished all " + planned.length + " exercises.", "success");
    else showFeedback("Exercise " + done + " of " + planned.length + " complete—keep going.", "success");
  }

  function setExerciseTimerDuration(id, seconds) {
    stopExerciseTimerInterval();
    releaseTimerWakeLock();
    state.exerciseTimer = { id: id, duration: seconds, remaining: seconds, endAt: 0, running: false, interval: null };
    render();
  }

  function toggleExerciseTimer(id) {
    var select = document.querySelector('[data-timer-duration="' + id + '"]');
    var seconds = select ? Number(select.value) : 30;
    if (!state.exerciseTimer || state.exerciseTimer.id !== id) state.exerciseTimer = { id: id, duration: seconds, remaining: seconds, endAt: 0, running: false, interval: null };
    var timer = state.exerciseTimer;
    if (timer.running) {
      timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      stopExerciseTimerInterval();
      timer.running = false;
      releaseTimerWakeLock();
      render();
      return;
    }
    if (timer.remaining <= 0) timer.remaining = timer.duration;
    timer.running = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.interval = setInterval(tickExerciseTimer, 250);
    acquireTimerWakeLock();
    render();
  }

  function tickExerciseTimer() {
    var timer = state.exerciseTimer;
    if (!timer || !timer.running) return;
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    var display = document.querySelector('[data-timer-display="' + timer.id + '"]');
    if (display) display.textContent = formatTimer(timer.remaining);
    if (timer.remaining > 0) return;
    var id = timer.id, duration = timer.duration;
    stopExerciseTimerInterval();
    timer.running = false;
    releaseTimerWakeLock();
    if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
    logCompletedTimedSet(id, duration);
  }

  function logCompletedTimedSet(id, seconds) {
    var day = getDay(state.selectedDate);
    var exercise = exercisesForPlan(planForDate(state.selectedDate)).find(function (item) { return exerciseId(item.name) === id; });
    var log = day.exercises[id] || {};
    var sets = exercise && exercise.name === "Side Plank" ? sidePlankSets(log) : exerciseSets(log, exercise || { prescription: "1 set" });
    var required = exercise && exercise.name === "Side Plank" ? sets.length : prescribedSetCount(exercise || { prescription: "1 set" });
    var index = -1;
    for (var i = 0; i < required; i++) if (!String(sets[i] == null ? "" : sets[i]).trim()) { index = i; break; }
    if (index >= 0) updateExerciseSet(id, index, seconds);
    else showFeedback("Timer complete—this exercise is already fully logged.", "success");
  }

  function resetExerciseTimer(id) {
    var timer = state.exerciseTimer;
    if (!timer || timer.id !== id) return;
    stopExerciseTimerInterval();
    timer.running = false;
    timer.remaining = timer.duration;
    releaseTimerWakeLock();
    render();
  }

  function stopExerciseTimerInterval() {
    if (state.exerciseTimer && state.exerciseTimer.interval) clearInterval(state.exerciseTimer.interval);
    if (state.exerciseTimer) state.exerciseTimer.interval = null;
  }

  async function acquireTimerWakeLock() {
    if (!state.exerciseTimer || !state.exerciseTimer.running || document.hidden || state.timerWakeLock) return;
    if (!("wakeLock" in navigator)) { showFeedback("Your phone does not support keeping the screen awake automatically. Keep the dashboard visible during the timer.", "warning"); return; }
    try {
      state.timerWakeLock = await navigator.wakeLock.request("screen");
      state.timerWakeLock.addEventListener("release", function () { state.timerWakeLock = null; });
    } catch (error) { showFeedback("Screen wake protection could not start. Keep the dashboard visible during the timer.", "warning"); }
  }

  async function releaseTimerWakeLock() {
    var lock = state.timerWakeLock;
    state.timerWakeLock = null;
    if (lock) try { await lock.release(); } catch (ignore) {}
  }

  function addExerciseSet(id) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    var exercise = exercisesForPlan(planForDate(state.selectedDate)).find(function (item) { return exerciseId(item.name) === id; });
    var sets = exerciseSets(day.exercises[id], exercise || { prescription: "1 set" });
    sets.push("");
    day.exercises[id].sets = sets;
    render();
  }

  function addSidePlankSet(id) {
    var day = getDay(state.selectedDate);
    if (!day.exercises[id]) day.exercises[id] = {};
    var sets = sidePlankSets(day.exercises[id]);
    sets.push("", "");
    day.exercises[id].sets = sets;
    day.exercises[id].reps = sets.filter(function (item) { return item !== ""; }).join(", ");
    queueSave(true);
  }

  function togglePhotoReveal(side) {
    var key = state.selectedDate + ":" + side;
    state.revealedPhoto = state.revealedPhoto === key ? null : key;
    render();
  }

  function mealFromNutrition(source, fallbackNotes) {
    var meal = {
      name: source.name || "Meal", protein: number(source.protein), calories: number(source.calories), carbs: number(source.carbs), fat: number(source.fat),
      fiber: optionalNumber(source.fiber), saturatedFat: optionalNumber(source.saturatedFat), addedSugar: optionalNumber(source.addedSugar), sodium: optionalNumber(source.sodium),
      notes: source.notes || fallbackNotes || "", category: MEAL_CATEGORIES.includes(source.category) ? source.category : "",
      estimateConfidence: source.estimateConfidence || source.confidence || "saved favorite", estimateAssumptions: source.estimateAssumptions || source.assumptions || "",
      nutritionBasis: source.nutritionBasis || "Saved favorite", includedItems: source.includedItems || "", quantity: 1
    };
    meal.perServing = nutritionSnapshot(meal, 1);
    return meal;
  }

  function nutritionSnapshot(meal, divisor) {
    var result = {}, amount = Math.max(0.25, number(divisor) || 1);
    NUTRITION_FIELDS.forEach(function (field) { result[field] = meal[field] == null ? null : number(meal[field]) / amount; });
    return result;
  }

  function setMealQuantity(index, quantity) {
    var day = getDay(state.selectedDate), meal = day.meals[index];
    if (!meal) return;
    var oldQuantity = Math.max(0.25, number(meal.quantity) || 1);
    var next = clamp(Math.round(number(quantity) * 4) / 4, 0.25, 50);
    meal.perServing = meal.perServing || nutritionSnapshot(meal, oldQuantity);
    meal.quantity = next;
    NUTRITION_FIELDS.forEach(function (field) { meal[field] = meal.perServing[field] == null ? null : Math.round(meal.perServing[field] * next * 10) / 10; });
    queueSave(true);
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
    document.getElementById("meal-dialog").close();
    collapseFavoritePicker();
    showMealFeedback(getDay(state.selectedDate), favorite.name || "Meal");
    queueSave(true);
  }

  function collapseFavoritePicker() {
    state.favoritesOpen = false;
    state.favoriteManagerOpen = false;
  }

  function bindFavoritePickerEvents() {
    document.querySelectorAll("#meal-favorites-slot .favorites-panel, #meal-favorites-slot .favorite-manager").forEach(function (details) { details.addEventListener("toggle", function () { if (details.classList.contains("favorites-panel")) state.favoritesOpen = details.open; else state.favoriteManagerOpen = details.open; }); });
    var favoriteFilter = document.getElementById("favorite-category-filter");
    if (favoriteFilter) favoriteFilter.addEventListener("change", function () { state.favoriteFilter = favoriteFilter.value; state.favoritesOpen = true; document.getElementById("meal-favorites-slot").innerHTML = renderFavoritePicker(); bindFavoritePickerEvents(); });
    var addFavorite = document.getElementById("add-favorite-meal");
    if (addFavorite) addFavorite.addEventListener("click", function () { useSelectedFavorite(false); });
    var adjustFavorite = document.getElementById("adjust-favorite-meal");
    if (adjustFavorite) adjustFavorite.addEventListener("click", function () { useSelectedFavorite(true); });
    document.querySelectorAll("#meal-favorites-slot [data-favorite-name]").forEach(function (input) { input.addEventListener("change", function () { updateFavorite(input.dataset.favoriteName, "name", input.value.trim() || "Favorite meal"); }); });
    document.querySelectorAll("#meal-favorites-slot [data-favorite-category]").forEach(function (select) { select.addEventListener("change", function () { updateFavorite(select.dataset.favoriteCategory, "category", select.value); }); });
    document.querySelectorAll("#meal-favorites-slot [data-remove-favorite]").forEach(function (button) { button.addEventListener("click", function () { removeFavorite(button.dataset.removeFavorite); document.getElementById("meal-favorites-slot").innerHTML = renderFavoritePicker(); bindFavoritePickerEvents(); }); });
  }

  function updateFavorite(id, field, value) {
    var favorite = favoriteById(id);
    if (!favorite) return;
    favorite[field] = field === "category" ? validCategory(value) : value;
    favorite.updatedAt = new Date().toISOString();
    queueSave(false);
  }

  function removeFavorite(id) {
    var favorite = favoriteById(id);
    if (!favorite || !confirm("Remove " + favorite.name + " from favorites?")) return;
    state.data.favorites = state.data.favorites.filter(function (item) { return item.id !== id; });
    queueSave(true);
  }

  function openMealDialog(manual, source, editing) {
    state.mealEstimate = null;
    state.activePendingMealId = null;
    state.editingMeal = editing || null;
    if (!source) state.adjustingFavoriteId = null;
    state.adviceImage = source && source.adviceImage || "";
    clearMealPhotoPreview();
    document.getElementById("meal-favorites-slot").innerHTML = editing ? "" : renderFavoritePicker();
    bindFavoritePickerEvents();
    document.getElementById("meal-notes").value = source && source.notes || "";
    clearPhotoInputs("meal-photo", "meal-photo-camera");
    document.getElementById("keep-meal-photo").checked = Boolean(source && source.photo);
    var existingPhoto = document.getElementById("meal-existing-photo");
    existingPhoto.hidden = !(source && source.photo);
    existingPhoto.innerHTML = source && source.photo ? '<img alt="Saved private meal photo" data-photo-ref="' + esc(photoRefValue(source.photo)) + '"><span>Saved private photo</span>' : '';
    document.getElementById("duplicate-meal-edit").hidden = !editing;
    document.getElementById("meal-date").value = editing && editing.date || state.selectedDate;
    document.getElementById("save-meal-favorite").checked = false;
    document.getElementById("favorite-category-wrap").hidden = true;
    document.getElementById("meal-error").textContent = "";
    document.getElementById("meal-result").hidden = !manual;
    if (source) showMealResult(source);
    else if (manual) showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", fiber: null, saturatedFat: null, addedSugar: null, sodium: null, category: defaultMealCategory(), confidence: "Manual entry", nutritionBasis: "Manual", assumptions: "Enter the package, restaurant, or measured values you trust." });
    openDashboardDialog(document.getElementById("meal-dialog"));
    document.getElementById("meal-close").focus({ preventScroll: true });
    hydratePhotos();
  }

  function duplicateEditingMeal() {
    var editing = state.editingMeal;
    if (!editing) return;
    var source = state.data.days[editing.date] && state.data.days[editing.date].meals[editing.index];
    if (!source) return;
    var copy = JSON.parse(JSON.stringify(source));
    copy.name = (copy.name || "Meal") + " copy";
    delete copy.photo;
    getDay(editing.date).meals.push(copy);
    document.getElementById("meal-dialog").close();
    state.editingMeal = null;
    queueSave(true);
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
    clearPhotoInputs("advice-photo", "advice-photo-camera");
    renderAdviceConversation();
    openDashboardDialog(document.getElementById("advice-dialog"));
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
    var file = selectedPhotoFile("advice-photo", "advice-photo-camera");
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
      clearPhotoInputs("advice-photo", "advice-photo-camera");
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
    clearPhotoInputs("advice-photo", "advice-photo-camera");
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
    var file = selectedPhotoFile("meal-photo", "meal-photo-camera");
    if (!notes && !file) { document.getElementById("meal-error").textContent = "Add a photo, notes, or both."; return; }
    var button = document.getElementById("analyze-meal");
    button.disabled = true;
    button.textContent = "Estimating…";
    if (file) document.getElementById("meal-photo-status").textContent = "Photo received—uploading and analyzing…";
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
        var photoStatus = document.getElementById("meal-photo-status");
        if (photoStatus && (pending.photoId || pending.localImage)) photoStatus.textContent = "Photo uploaded and analyzed successfully.";
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
      showFeedback("Your meal photo was saved safely and will be analyzed automatically.", "warning");
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
    state.editingMeal = null;
    state.mealEstimate = pending.result;
    clearMealPhotoPreview();
    document.getElementById("meal-favorites-slot").innerHTML = renderFavoritePicker();
    bindFavoritePickerEvents();
    document.getElementById("meal-notes").value = pending.notes || "";
    clearPhotoInputs("meal-photo", "meal-photo-camera");
    document.getElementById("meal-date").value = pending.date || state.selectedDate;
    document.getElementById("keep-meal-photo").checked = Boolean(pending.keepPhoto);
    document.getElementById("save-meal-favorite").checked = false;
    document.getElementById("favorite-category-wrap").hidden = true;
    document.getElementById("meal-error").textContent = "";
    if (pending.photoId || pending.localImage) {
      document.getElementById("meal-photo-preview").hidden = false;
      document.getElementById("meal-photo-preview").classList.add("status-only");
      document.getElementById("meal-photo-status").textContent = "Photo uploaded and analyzed successfully.";
    }
    state.adjustingFavoriteId = null;
    state.adviceImage = "";
    showMealResult(pending.result);
    openDashboardDialog(document.getElementById("meal-dialog"));
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
    var editing = state.editingMeal;
    var existingMeal = editing && state.data.days[editing.date] && state.data.days[editing.date].meals[editing.index];
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
    meal.quantity = Math.max(0.25, number(existingMeal && existingMeal.quantity) || 1);
    meal.perServing = nutritionSnapshot(meal, meal.quantity);
    var file = selectedPhotoFile("meal-photo", "meal-photo-camera");
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
    } else if (existingMeal && existingMeal.photo && document.getElementById("keep-meal-photo").checked) {
      meal.photo = existingMeal.photo;
    }
    var mealDate = pending ? pending.date : (document.getElementById("meal-date").value || state.selectedDate);
    var wantsFavorite = document.getElementById("save-meal-favorite").checked;
    var selectedCategory = wantsFavorite && document.querySelector('input[name="favorite-category"]:checked');
    if (wantsFavorite && !selectedCategory) { document.getElementById("meal-error").textContent = "Choose a favorite category before saving."; return; }
    if (editing && existingMeal) {
      if (editing.date === mealDate) state.data.days[editing.date].meals.splice(editing.index, 1, meal);
      else { state.data.days[editing.date].meals.splice(editing.index, 1); getDay(mealDate).meals.push(meal); }
    } else {
      getDay(mealDate).meals.push(meal);
    }
    if (wantsFavorite) {
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
    if (existingMeal && existingMeal.photo && existingMeal.photo !== meal.photo && typeof existingMeal.photo === "object" && existingMeal.photo.id && !localMode) {
      try { await apiFetch("/photos/" + encodeURIComponent(existingMeal.photo.id), { method: "DELETE" }); } catch (ignore) {}
    }
    state.activePendingMealId = null;
    state.editingMeal = null;
    state.adjustingFavoriteId = null;
    state.adviceImage = "";
    document.getElementById("meal-dialog").close();
    collapseFavoritePicker();
    clearMealPhotoPreview();
    showMealFeedback(getDay(mealDate), meal.name);
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
    document.getElementById("photo-title").textContent = side === "treadmill" ? "Add treadmill results photo" : "Add " + side + " photo";
    document.getElementById("photo-help").textContent = side === "treadmill" ? "Photograph the full treadmill screen. Keep every extracted value reviewable before adding it to your notes." : "Use the same lighting, distance, posture, and clothing each time.";
    document.getElementById("photo-error").textContent = "";
    clearPhotoInputs("photo-input", "photo-camera-input");
    document.getElementById("photo-camera-input").setAttribute("capture", side === "back" ? "user" : "environment");
    document.getElementById("photo-selection").textContent = side === "back" ? "Take photo opens the selfie camera" : "Take photo opens the rear camera";
    openDashboardDialog(document.getElementById("photo-dialog"));
  }

  async function savePhoto() {
    var file = selectedPhotoFile("photo-input", "photo-camera-input");
    if (!file) { document.getElementById("photo-error").textContent = "Take a photo or choose one from your library."; return; }
    var button = document.getElementById("photo-submit");
    button.disabled = true;
    button.textContent = "Saving...";
    try {
      var blob = await compressImage(file);
      var ref;
      if (localMode) {
        ref = await blobToDataUrl(blob);
      } else {
        var id = state.selectedDate + "-" + state.pendingPhotoSide + "-" + crypto.randomUUID() + ".jpg";
        await uploadPhoto(id, blob);
        ref = { id: id };
      }
      getDay(state.selectedDate).photos[state.pendingPhotoSide] = ref;
      if (state.pendingPhotoSide === "treadmill" && !localMode) {
        try {
          var response = await apiFetch("/treadmill/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(typeof ref === "object" ? { photoId: ref.id } : { image: ref }) });
          getDay(state.selectedDate).cardio.result = await response.json();
        } catch (ignore) { getDay(state.selectedDate).cardio.result = null; }
      }
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
      var container = img.closest("[data-photo-container]");
      var markLoaded = function () { if (container) { container.classList.add("photo-loaded"); container.classList.remove("photo-failed"); var status = container.querySelector("[data-photo-status]"); if (status) status.textContent = "Photo ready"; } };
      if (ref.indexOf("data:") === 0) { img.src = ref; markLoaded(); return; }
      if (ref.indexOf("r2:") === 0) {
        if (state.photoUrls.has(ref)) { img.src = state.photoUrls.get(ref); markLoaded(); return; }
        try {
          var pending = state.photoRequests.get(ref);
          if (!pending) {
            pending = (async function () {
              var response = await apiFetch("/photos/" + encodeURIComponent(ref.slice(3)), { method: "GET" }, true);
              var blob = await response.blob();
              var url = URL.createObjectURL(blob);
              state.photoUrls.set(ref, url);
              return url;
            })();
            state.photoRequests.set(ref, pending);
            pending.then(function () { state.photoRequests.delete(ref); }, function () { state.photoRequests.delete(ref); });
          }
          img.src = await pending;
          markLoaded();
        } catch (error) {
          img.alt = "Photo unavailable";
          if (container) { container.classList.add("photo-failed"); var status = container.querySelector("[data-photo-status]"); if (status) status.textContent = "Photo could not load."; var retry = container.querySelector("[data-retry-photo]"); if (retry) retry.hidden = false; }
        }
      }
    }));
  }

  function retryPhoto(button) {
    var container = button.closest("[data-photo-container]");
    var img = container && container.querySelector("img[data-photo-ref]");
    if (!img) return;
    var ref = img.dataset.photoRef;
    if (state.photoUrls.has(ref)) URL.revokeObjectURL(state.photoUrls.get(ref));
    state.photoUrls.delete(ref);
    state.photoRequests.delete(ref);
    container.classList.remove("photo-failed", "photo-loaded");
    button.hidden = true;
    container.querySelector("[data-photo-status]").textContent = "Loading photo…";
    hydratePhotos();
  }

  function clearPhotoUrls() {
    state.photoUrls.forEach(function (url) { URL.revokeObjectURL(url); });
    state.photoUrls.clear();
    state.photoRequests.clear();
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
      var segments = cardioSegmentsFor(plan);
      var alerts = segments.slice(1).map(function (segment) {
        return { atMinutes: segment.start, title: "Minute " + segment.start + " · Incline " + segment.incline + " · Speed " + segment.speed.toFixed(1) + " mph", body: segment.cue };
      });
      alerts.push({ atMinutes: duration, title: duration + " minutes complete", body: "Nice work, Vinny. Cooldown finished—log your adjustments and how the session felt." });
      var first = segments[0];
      var startAlert = { title: "Time to rock 🤘🏻", body: "Incline " + first.incline + " · Speed " + first.speed.toFixed(1) + " mph" };
      var response = await apiFetch("/notifications/cardio/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: state.selectedDate, title: plan.title, durationMinutes: duration, alerts: alerts, startAlert: startAlert }) });
      var result = await response.json();
      var day = getDay(state.selectedDate);
      day.cardio = { sessionId: result.id, startedAt: result.startedAt, status: "active", durationMinutes: duration, completedAt: "", result: day.cardio && day.cardio.result || null };
      startCardioStatusPolling();
      queueSave(true);
    } catch (error) { alert(error.message || "Cardio alerts could not be started."); }
  }

  async function cancelCardioSession() {
    var day = getDay(state.selectedDate);
    try { if (day.cardio && day.cardio.sessionId) await apiFetch("/notifications/cardio/" + encodeURIComponent(day.cardio.sessionId), { method: "DELETE" }); } catch (ignore) {}
    day.cardio = { sessionId: "", startedAt: "", status: "cancelled", durationMinutes: 0, completedAt: "", result: day.cardio && day.cardio.result || null };
    queueSave(true);
  }

  function completeCardioSession(date, sessionId, durationMinutes) {
    date = date || state.selectedDate;
    var day = getDay(date);
    if (sessionId && day.cardio && day.cardio.sessionId && day.cardio.sessionId !== sessionId) return false;
    if (day.cardio && day.cardio.status === "complete") return true;
    var plan = planForDate(date);
    if (!plan || plan.type !== "Cardio") return false;
    var duration = number(durationMinutes) || number(day.cardio && day.cardio.durationMinutes) || cardioDuration(plan);
    exercisesForPlan(plan).forEach(function (exercise) {
      var id = exerciseId(exercise.name);
      day.exercises[id] = Object.assign({}, day.exercises[id] || {}, { reps: duration, done: true, autoCompleted: true });
    });
    day.workout.completed = true;
    day.cardio = Object.assign({}, day.cardio || {}, { status: "complete", durationMinutes: duration, completedAt: new Date().toISOString() });
    clearInterval(state.cardioPollTimer);
    state.cardioPollTimer = null;
    showFeedback("Cardio complete—" + duration + " minutes logged automatically. Great work.", "success");
    queueSave(date === state.selectedDate);
    return true;
  }

  async function syncCardioCompletion() {
    var activeDates = Object.keys(state.data.days || {}).filter(function (date) { var day = state.data.days[date]; return day && day.cardio && day.cardio.status === "active"; });
    for (var i = 0; i < activeDates.length; i++) {
      var date = activeDates[i], day = state.data.days[date];
      var elapsed = Date.now() - new Date(day.cardio.startedAt).getTime();
      var duration = number(day.cardio.durationMinutes) || cardioDuration(planForDate(date));
      if (Number.isFinite(elapsed) && elapsed >= duration * 60 * 1000) { completeCardioSession(date, day.cardio.sessionId, duration); continue; }
      if (!day.cardio.sessionId || localMode) continue;
      try {
        var response = await apiFetch("/notifications/cardio/" + encodeURIComponent(day.cardio.sessionId), { method: "GET" });
        var result = await response.json();
        if (result.status === "complete") completeCardioSession(date, result.id, result.durationMinutes);
      } catch (ignore) {}
    }
  }

  function startCardioStatusPolling() {
    clearInterval(state.cardioPollTimer);
    state.cardioPollTimer = setInterval(function () { if (!document.hidden) syncCardioCompletion(); }, 15000);
    syncCardioCompletion();
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
      startCardioStatusPolling();
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
    if (number(data.targets.calories) === 1700) data.targets.calories = 1850;
    if (number(data.targets.protein) === 150) data.targets.protein = 140;
    data.targets.calorieMin = number(data.targets.calorieMin) === 1600 ? 1750 : number(data.targets.calorieMin) || data.targets.calories - 100;
    data.targets.calorieMax = number(data.targets.calorieMax) === 1800 ? 1950 : number(data.targets.calorieMax) || data.targets.calories + 100;
    data.targets.proteinMin = number(data.targets.proteinMin) === 145 ? 135 : number(data.targets.proteinMin) || data.targets.protein - 5;
    data.targets.proteinMax = number(data.targets.proteinMax) === 160 ? 150 : number(data.targets.proteinMax) || data.targets.protein + 10;
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
    data.weeklyCheckins = data.weeklyCheckins || {};
    delete data.targets.steps;
    data.preferences = Object.assign({ notifications: true }, data.preferences || {});
    data.preferences.reminders = Object.assign({}, defaultData().preferences.reminders, data.preferences.reminders || {});
    data.preferences.reminders.waterTimes = Array.isArray(data.preferences.reminders.waterTimes) ? data.preferences.reminders.waterTimes.slice(0, 2) : defaultData().preferences.reminders.waterTimes.slice();
    data.preferences.reminders.proteinTimes = Array.isArray(data.preferences.reminders.proteinTimes) ? data.preferences.reminders.proteinTimes.slice(0, 2) : defaultData().preferences.reminders.proteinTimes.slice();
    data.preferences.reminders.calorieTimes = Array.isArray(data.preferences.reminders.calorieTimes) ? data.preferences.reminders.calorieTimes.slice(0, 3) : defaultData().preferences.reminders.calorieTimes.slice();
    while (data.preferences.reminders.waterTimes.length < 2) data.preferences.reminders.waterTimes.push(defaultData().preferences.reminders.waterTimes[data.preferences.reminders.waterTimes.length]);
    while (data.preferences.reminders.proteinTimes.length < 2) data.preferences.reminders.proteinTimes.push(defaultData().preferences.reminders.proteinTimes[data.preferences.reminders.proteinTimes.length]);
    while (data.preferences.reminders.calorieTimes.length < 3) data.preferences.reminders.calorieTimes.push(defaultData().preferences.reminders.calorieTimes[data.preferences.reminders.calorieTimes.length]);
    delete data.reward;
    data.meta = Object.assign({}, data.meta || {}, { planVersion: "workout-2.7-2026-09-16" });
    Object.keys(data.days || {}).forEach(function (iso) {
      var day = data.days[iso];
      day.meals = Array.isArray(day.meals) ? day.meals : [];
      day.meals.forEach(function (meal) { meal.quantity = Math.max(0.25, number(meal.quantity) || 1); meal.perServing = meal.perServing || nutritionSnapshot(meal, meal.quantity); });
      day.exercises = day.exercises || {};
      if (day.exercises["single-leg-romanian-deadlift"] && !day.exercises["supported-kickstand-romanian-deadlift"]) day.exercises["supported-kickstand-romanian-deadlift"] = day.exercises["single-leg-romanian-deadlift"];
      Object.keys(day.exercises).forEach(function (id) {
        var log = day.exercises[id];
        if (!Array.isArray(log.sets) && log.reps) log.sets = String(log.reps).split(/[,/]+/).map(function (value) { return value.trim(); }).filter(Boolean);
      });
      day.workout = Object.assign({ completed: false, rating: "", notes: "" }, day.workout || {});
      day.cardio = Object.assign({ sessionId: "", startedAt: "", status: "", durationMinutes: 0, completedAt: "", result: null }, day.cardio || {});
      day.photos = Object.assign({ front: null, side: null, back: null, treadmill: null }, day.photos || {});
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
    if (!dialog.open) openDashboardDialog(dialog);
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
      startCardioStatusPolling();
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
    clearPhotoUrls();
    state.data = defaultData();
    state.sync = "Locked";
    render();
    showAccessDialog();
  }

  document.querySelectorAll("[data-pick-file]").forEach(function (button) { button.addEventListener("click", function () { document.getElementById(button.dataset.pickFile).click(); }); });
  [["photo-input", "photo-camera-input"], ["meal-photo", "meal-photo-camera"], ["advice-photo", "advice-photo-camera"]].forEach(function (pair) {
    pair.forEach(function (id, index) {
      document.getElementById(id).addEventListener("change", function (event) {
        if (event.target.files && event.target.files[0]) document.getElementById(pair[1 - index]).value = "";
        if (pair[0] === "photo-input" && event.target.files && event.target.files[0]) document.getElementById("photo-selection").textContent = "Selected: " + event.target.files[0].name;
        if (pair[0] === "meal-photo" && event.target.files && event.target.files[0]) showMealPhotoPreview(event.target.files[0]);
      });
    });
  });

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
  document.getElementById("photo-cancel").addEventListener("click", function () { document.getElementById("photo-dialog").close(); clearPhotoInputs("photo-input", "photo-camera-input"); document.getElementById("photo-error").textContent = ""; });
  document.getElementById("analyze-meal").addEventListener("click", analyzeMeal);
  document.getElementById("manual-meal").addEventListener("click", function () { showMealResult({ name: "Meal", calories: "", protein: "", carbs: "", fat: "", fiber: null, saturatedFat: null, addedSugar: null, sodium: null, category: defaultMealCategory(), confidence: "Manual entry", nutritionBasis: "Manual", assumptions: "Enter the package, restaurant, or measured values you trust." }); });
  document.getElementById("save-meal-favorite").addEventListener("change", function (event) { document.getElementById("favorite-category-wrap").hidden = !event.target.checked; });
  document.getElementById("meal-cancel").addEventListener("click", function () { document.getElementById("meal-dialog").close(); clearMealPhotoPreview(); });
  document.getElementById("duplicate-meal-edit").addEventListener("click", duplicateEditingMeal);
  document.getElementById("save-meal").addEventListener("click", saveMeal);
  document.getElementById("ask-meal-advice").addEventListener("click", askMealAdvice);
  document.getElementById("clear-meal-advice").addEventListener("click", clearMealAdvice);
  document.getElementById("log-advice-meal").addEventListener("click", reviewAdviceMeal);
  document.querySelectorAll("dialog").forEach(function (dialog) { dialog.addEventListener("close", releaseDialogScrollLock); });
  document.addEventListener("touchstart", handleDialogTouchStart, { passive: true, capture: true });
  document.addEventListener("touchmove", handleDialogTouchMove, { passive: false, capture: true });
  document.getElementById("toast").addEventListener("click", function (event) { clearTimeout(state.toastTimer); event.currentTarget.hidden = true; });
  document.addEventListener("visibilitychange", function () { if (document.hidden && state.revealedPhoto) { state.revealedPhoto = null; render(); } if (!document.hidden) { syncCardioCompletion(); if (state.exerciseTimer && state.exerciseTimer.running) acquireTimerWakeLock(); } });
  window.addEventListener("pagehide", function () { state.revealedPhoto = null; releaseTimerWakeLock(); });
  if ("serviceWorker" in navigator && !localMode) navigator.serviceWorker.register("./sw.js").then(async function (registration) { state.serviceWorker = registration; await refreshNotificationState(); render(); }).catch(function () {});
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", function (event) { var data = event.data || {}; if (data.type === "cardio-complete") completeCardioSession(data.date, data.sessionId, data.durationMinutes); });
  loadData();
})();
