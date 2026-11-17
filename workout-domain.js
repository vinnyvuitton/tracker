(function (root) {
  "use strict";

  var FIRST_WEEKLY_WEIGH_IN = "2026-11-18";
  var RACE_GOAL = Object.freeze({
    name: "Shamrock Shuffle 8K",
    date: "2027-03-21",
    dateLabel: "Sunday March 21, 2027",
    location: "Grant Park, Chicago",
    distance: "8K",
    timeLimitMinutes: 75,
    timeLimit: "1:15",
    paceLimit: "15 min per mile",
    objective: "Finish and get the medal.",
    url: "https://www.shamrockshuffle.com/register/8k-run/"
  });

  function numeric(value) {
    if (typeof value !== "number" && typeof value !== "string" || typeof value === "string" && !value.trim()) return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function plainText(value) {
    return String(value == null ? "" : value).replace(/[–—]|--/g, ", ");
  }

  function raceGoal(goal) {
    return Object.assign({}, RACE_GOAL, {
      nextStep: plainText(goal && goal.nextStep || "Follow the current gradual run/walk plan, using pain-free recovery to guide progression.")
    });
  }

  function migrateNutritionTargets(targets) {
    targets = targets || {};
    var changes = {};
    if (numeric(targets.calories) === 1850 && numeric(targets.calorieMin) === 1750 && numeric(targets.calorieMax) === 1950) {
      changes.calories = 1800;
      changes.calorieMin = 1700;
      changes.calorieMax = 1900;
    }
    if (numeric(targets.protein) === 140 && numeric(targets.proteinMin) === 135 && numeric(targets.proteinMax) === 150) {
      changes.protein = 150;
      changes.proteinMin = 140;
      changes.proteinMax = 160;
    }
    return Object.keys(changes).length ? Object.assign({}, targets, changes) : targets;
  }

  function inclineValid(value) {
    if (value == null || typeof value === "string" && !value.trim()) return true;
    var amount = numeric(value);
    return amount != null && amount >= 0 && amount <= 15;
  }

  function cardioIssues(result) {
    if (!result) return [];
    var warnings = [];
    if (!inclineValid(result.incline)) warnings.push("Incline must be 0 to 15. The original saved value needs checking.");
    var duration = numeric(result.durationMinutes), distance = numeric(result.distanceMiles);
    if (duration != null && duration <= 0 && distance > 0) warnings.push("Elapsed time is zero but distance is positive. Confirm the elapsed time.");
    if (/00:00/.test(result.notes || "")) warnings.push("The screen time includes 00:00. Confirm elapsed time rather than remaining time.");
    if (Array.isArray(result.validationWarnings)) {
      result.validationWarnings.forEach(function (warning) {
        if ([
          "Elapsed time could not be read. Leave it blank until confirmed.",
          "Zero screen time contradicts positive distance. Confirm elapsed time.",
          "No positive elapsed time was read.",
          "Incline was outside 0 to 15 and was rejected."
        ].includes(warning) && !warnings.includes(warning)) warnings.push(warning);
      });
    }
    return warnings;
  }

  function normalizeCardioOcr(parsed) {
    parsed = parsed || {};
    var warnings = [];
    var duration = numeric(parsed.durationMinutes);
    var distance = numeric(parsed.distanceMiles);
    var ambiguous = /(?:time|elapsed).*(?:unclear|unreadable|not visible|not legible)/i.test(parsed.notes || "");
    if (parsed.elapsedTimeReadable === false || parsed.displayedTimeType && parsed.displayedTimeType !== "elapsed" || ambiguous) {
      duration = null;
      warnings.push("Elapsed time could not be read. Leave it blank until confirmed.");
    }
    if (duration != null && duration <= 0) {
      duration = null;
      warnings.push(distance > 0 ? "Zero screen time contradicts positive distance. Confirm elapsed time." : "No positive elapsed time was read.");
    }
    var incline = numeric(parsed.incline);
    if (!inclineValid(parsed.incline)) {
      incline = null;
      warnings.push("Incline was outside 0 to 15 and was rejected.");
    }
    function nonnegative(value) { var n = numeric(value); return n != null && n >= 0 ? n : null; }
    return {
      durationMinutes: duration != null && duration > 0 ? duration : null,
      distanceMiles: nonnegative(parsed.distanceMiles),
      calories: nonnegative(parsed.calories),
      averageSpeedMph: nonnegative(parsed.averageSpeedMph),
      incline: incline,
      notes: plainText(parsed.notes || "").slice(0, 300),
      validationWarnings: warnings
    };
  }

  function cardioDurations(segments, recorded) {
    segments = segments || [];
    var last = segments[segments.length - 1];
    var total = last ? numeric(last.end) : null;
    var cooldown = last && (last.automatic || /cool.?down/i.test(last.cue || "")) ? last.end - last.start : 0;
    return {
      plannedWorkMinutes: total == null ? null : total - cooldown,
      plannedCooldownMinutes: total == null ? null : cooldown,
      plannedTotalMinutes: total,
      recordedTotalMinutes: numeric(recorded && recorded.durationMinutes)
    };
  }

  function nutritionTotals(meals) {
    meals = Array.isArray(meals) ? meals : [];
    var fields = ["calories", "protein", "carbs", "fat", "fiber", "addedSugar"];
    var result = { knownEntries: {}, partial: {} };
    fields.forEach(function (field) {
      var values = meals.map(function (meal) { return numeric(meal[field]); }).filter(function (value) { return value != null && value >= 0; });
      result[field] = values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) : null;
      result.knownEntries[field] = values.length;
      result.partial[field] = values.length < meals.length;
    });
    return result;
  }

  function morningTiming(day, date, coaching) {
    var correction = coaching && coaching.weightTimingCorrections && coaching.weightTimingCorrections[date];
    if (day && day.weightTimingNoteReview) return day.weightTiming || "unspecified";
    return (typeof correction === "string" ? correction : correction && correction.timing) || day && day.weightTiming || "unspecified";
  }

  function addDays(date, amount) {
    var value = new Date(date + "T12:00:00Z");
    value.setUTCDate(value.getUTCDate() + amount);
    return value.toISOString().slice(0, 10);
  }

  function weeklyProgress(days, week, coaching, through) {
    var date = addDays(week, 3);
    var entry = date <= through && days && days[date] && days[date].weeklyWeighIn;
    if (date >= FIRST_WEEKLY_WEIGH_IN) {
      return {date: date, source: "Wednesday weigh-in", value: numeric(entry && entry.weight), visceralFat: numeric(entry && entry.visceralFat)};
    }
    var values = [];
    for (var dayDate = week; dayDate <= addDays(week, 6) && dayDate <= through; dayDate = addDays(dayDate, 1)) {
      var day = days && days[dayDate], weight = numeric(day && day.weight);
      if (weight > 0 && morningTiming(day, dayDate, coaching) === "morning") values.push(weight);
    }
    return {date: date, source: "Daily average", value: values.length >= 2 ? Math.round(values.reduce(function (a, b) { return a + b; }, 0) / values.length * 10) / 10 : null, sampleSize: values.length};
  }

  root.WorkoutDomain = Object.freeze({
    numeric: numeric, plainText: plainText, raceGoal: raceGoal,
    migrateNutritionTargets: migrateNutritionTargets, inclineValid: inclineValid,
    cardioIssues: cardioIssues, normalizeCardioOcr: normalizeCardioOcr,
    cardioDurations: cardioDurations, nutritionTotals: nutritionTotals,
    morningTiming: morningTiming, weeklyProgress: weeklyProgress
  });
})(globalThis);
