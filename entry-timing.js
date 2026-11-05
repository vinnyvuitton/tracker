/* Entry timestamps describe logging/editing, never inferred meal or exercise times. */
(function (root) {
  'use strict';
  function fingerprint(value) {
    return JSON.stringify(value, function (key, item) { return ['logTiming', 'entryTiming', 'setTiming'].includes(key) ? undefined : item; });
  }
  function zone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (_) { return 'UTC'; } }
  function occurred(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null;
    return { date: date, time: time, timeZone: 'America/Chicago', source: 'user' };
  }
  function visit(data, fn) {
    function record(value, active) { if (value && typeof value === 'object') fn(value, 'record', value, active, function (timing) { value.logTiming = timing; }, value.logTiming); }
    Object.keys(data.days || {}).forEach(function (date) {
      var day = data.days[date];
      ['weight', 'weightTiming', 'water', 'waist', 'steps', 'cannabis', 'cannabisNote'].forEach(function (key) {
        var value = day[key], active = key === 'weightTiming' ? !!day.weight : key === 'waist' ? !!(value && (value.first || value.second)) : value != null && value !== '' && value !== 0;
        fn(day, key, value, active, function (timing) { (day.entryTiming || (day.entryTiming = {}))[key] = timing; }, day.entryTiming && day.entryTiming[key]);
      });
      Object.keys(day.photos || {}).forEach(function (key) { fn(day, 'photo:' + key, day.photos[key], !!day.photos[key], function (timing) { (day.entryTiming || (day.entryTiming = {}))['photo:' + key] = timing; }, day.entryTiming && day.entryTiming['photo:' + key]); });
      (day.meals || []).forEach(function (meal) { record(meal, true); });
      Object.keys(day.exercises || {}).forEach(function (id) {
        var log = day.exercises[id];
        record(log, !!(log.done || log.load || log.reps || log.loadFeel || (log.sets || []).some(function (x) { return x !== '' && x != null; })));
        (log.sets || []).forEach(function (value, index) { fn(log, 'set:' + index, value, value !== '' && value != null, function (timing) { (log.setTiming || (log.setTiming = {}))[index] = timing; }, log.setTiming && log.setTiming[index]); });
      });
      record(day.workout, !!(day.workout && (day.workout.completed || day.workout.rating || day.workout.notes || day.workout.occurredAt)));
      record(day.cardio, !!(day.cardio && (day.cardio.sessionId || day.cardio.status || day.cardio.result)));
      (day.extraActivities || []).forEach(function (activity) { record(activity, true); });
    });
    ['weeklyCheckins', 'midweekCheckins'].forEach(function (key) { Object.values(data[key] || {}).forEach(function (entry) { record(entry, Object.keys(entry).some(function (k) { return !['logTiming','asOf'].includes(k) && entry[k] !== '' && entry[k] != null; })); }); });
  }
  function createTracker(data) {
    var known = new WeakMap();
    function store(target, key, value, active) { var slots = known.get(target); if (!slots) { slots = new Map(); known.set(target, slots); } slots.set(key, { fingerprint: fingerprint(value), active: active }); }
    function capture(payload) { known = new WeakMap(); visit(payload, function (target, key, value, active) { store(target, key, value, active); }); }
    function stamp(payload, now, timeZone) {
      var at = now || new Date().toISOString(), tz = timeZone || zone();
      visit(payload, function (target, key, value, active, assign, timing) {
        var before = known.get(target) && known.get(target).get(key), current = fingerprint(value);
        if ((!before || before.fingerprint !== current) && (active || before && before.active)) {
          assign(Object.assign({}, timing || {}, { loggedAt: timing && timing.loggedAt || (before && before.active ? null : at), updatedAt: at, loggedTimeZone: timing && timing.loggedTimeZone || (before && before.active ? null : tz), updatedTimeZone: tz, source: 'device-clock' }));
        }
        store(target, key, value, active);
      });
    }
    function inherit(previous, next) {
      if (!previous) return;
      if (previous.logTiming) next.logTiming = Object.assign({}, previous.logTiming);
      var before = known.get(previous); if (before) known.set(next, new Map(before));
    }
    capture(data || {});
    return { capture: capture, stamp: stamp, inherit: inherit };
  }
  root.WorkoutEntryTiming = { createTracker: createTracker, occurred: occurred };
})(typeof globalThis !== 'undefined' ? globalThis : this);
