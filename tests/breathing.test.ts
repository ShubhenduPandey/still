import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, frameAt, sanitizeSettings, formatTime } from '../src/breathing.ts';
test('zero hold goes directly from inhale to exhale and starts a new cycle', () => {
  assert.equal(frameAt(3999, defaults).phase, 'inhale');
  assert.equal(frameAt(4000, defaults).phase, 'exhale');
  assert.equal(frameAt(4000, defaults).fill, 1);
  assert.equal(frameAt(9999, defaults).remaining, 1);
  assert.deepEqual(frameAt(10000, defaults), { phase: 'inhale', progress: 0, cycle: 1, remaining: 4, fill: 0 });
});
test('hold is full and uses its configured duration', () => {
  const settings = { ...defaults, hold: 3 };
  assert.equal(frameAt(4000, settings).phase, 'hold');
  assert.equal(frameAt(6500, settings).fill, 1);
  assert.equal(frameAt(6999, settings).remaining, 1);
  assert.equal(frameAt(7000, settings).phase, 'exhale');
  assert.equal(frameAt(13000, settings).cycle, 1);
});
test('timing is based on elapsed time even after skipped frames', () => {
  assert.equal(frameAt(123456, defaults).cycle, 12);
  assert.equal(frameAt(123456, defaults).phase, 'inhale');
  assert.equal(frameAt(123456, defaults).remaining, 1);
  assert.equal(frameAt(7000, defaults).fill, 0.5);
});
test('stored settings reject invalid values and clamp timing boundaries', () => {
  assert.deepEqual(sanitizeSettings(null), defaults);
  assert.deepEqual(sanitizeSettings({ hold: -7, inhale: 0, exhale: Infinity, minutes: 90, visual: 'bad', theme: 'bad' }), { ...defaults, inhale: 1, minutes: 30 });
  assert.equal(sanitizeSettings({ hold: 2.7 }).hold, 3);
});
test('remaining time rounds up and never displays a negative value', () => {
  assert.equal(formatTime(59999), '1:00');
  assert.equal(formatTime(1), '0:01');
  assert.equal(formatTime(-5), '0:00');
});
