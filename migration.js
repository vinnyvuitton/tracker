(function (root) {
  "use strict";

  function finiteNumber(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function migrateData(raw, helpers) {
    if (raw && raw.schemaVersion === 2 && raw.days) return raw;
    var next = helpers.defaultData();
    if (!raw || typeof raw !== "object") return next;

    Object.keys(raw).forEach(function (weekKey) {
      var week = raw[weekKey];
      var timestamp = Number(weekKey);
      if (!Array.isArray(week) || !Number.isFinite(timestamp) || Math.abs(timestamp) < 1000000) return;
      var start = new Date(timestamp).toISOString().slice(0, 10);

      week.forEach(function (oldDay, index) {
        if (!oldDay || typeof oldDay !== "object") return;
        var iso = helpers.addDays(start, index);
        var day = helpers.defaultDay();
        day.weight = oldDay.weight || "";
        day.steps = oldDay.steps || "";
        day.water = finiteNumber(oldDay.water);
        day.meals = Array.isArray(oldDay.meals) ? oldDay.meals.map(function (meal) {
          return {
            name: meal.name || meal.input || "Meal",
            protein: finiteNumber(meal.protein),
            calories: finiteNumber(meal.calories),
            carbs: finiteNumber(meal.carbs),
            fat: finiteNumber(meal.fat),
            legacyPhoto: meal.photo || null,
            photoDescription: meal.photoDesc || null
          };
        }) : [];
        day.exercises = oldDay.exercises && typeof oldDay.exercises === "object" ? oldDay.exercises : {};
        day.workout = Object.assign(day.workout, oldDay.workout || {});
        day.photos.front = oldDay.photoFront || null;
        day.photos.side = oldDay.photoSide || null;
        day.photos.back = oldDay.photoBack || null;
        day.legacyPhotoDescriptions = {
          front: oldDay.photoFrontDesc || null,
          side: oldDay.photoSideDesc || null,
          back: oldDay.photoBackDesc || null,
          cardio: oldDay.cardioPhotoDesc || null
        };
        day.legacyCardioPhoto = oldDay.cardioPhoto || null;
        day.cannabis = oldDay.cannabis || "";
        day.cannabisNote = oldDay.cannabisNote || "";
        day.extraActivities = Array.isArray(oldDay.extraActivities) ? oldDay.extraActivities : [];
        next.days[iso] = mergeDays(next.days[iso], day);
      });
    });

    next.meta.migratedFrom = "legacy-week-arrays";
    next.meta.migratedAt = new Date().toISOString();
    return next;
  }

  function mergeDays(existing, incoming) {
    if (!existing) return incoming;
    if (dayScore(incoming) === 0) return existing;
    if (dayScore(existing) === 0) return incoming;

    var merged = Object.assign({}, existing, incoming);
    merged.weight = incoming.weight || existing.weight;
    merged.steps = incoming.steps || existing.steps;
    merged.water = Math.max(finiteNumber(existing.water), finiteNumber(incoming.water));
    merged.meals = mergeUnique(existing.meals || [], incoming.meals || []);
    merged.exercises = Object.assign({}, existing.exercises || {}, incoming.exercises || {});
    merged.workout = Object.assign({}, existing.workout || {}, incoming.workout || {});
    merged.photos = Object.assign({}, existing.photos || {}, incoming.photos || {});
    merged.photos.front = incoming.photos.front || existing.photos.front || null;
    merged.photos.side = incoming.photos.side || existing.photos.side || null;
    merged.photos.back = incoming.photos.back || existing.photos.back || null;
    merged.extraActivities = mergeUnique(existing.extraActivities || [], incoming.extraActivities || []);
    return merged;
  }

  function mergeUnique(left, right) {
    var seen = new Set();
    return left.concat(right).filter(function (item) {
      var key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function dayScore(day) {
    if (!day) return 0;
    var score = 0;
    if (day.weight) score++;
    if (day.steps) score++;
    if (day.water) score++;
    score += (day.meals || []).length;
    score += Object.keys(day.exercises || {}).length;
    score += Object.values(day.photos || {}).filter(Boolean).length;
    if (day.workout && (day.workout.completed || day.workout.rating || day.workout.notes || day.workout.notePhoto)) score++;
    if (day.cannabis || day.cannabisNote) score++;
    score += (day.extraActivities || []).length;
    return score;
  }

  root.WorkoutMigration = { migrateData: migrateData };
})(typeof globalThis !== "undefined" ? globalThis : window);
