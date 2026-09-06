export type Phase = 'inhale' | 'hold' | 'exhale';
export type Visual = 'Orb' | 'Tide' | 'Timer' | 'Path' | 'Lungs';
export type Settings = {
  inhale: number; hold: number; exhale: number; minutes: number;
  visual: Visual; theme: 'light' | 'dark'; sound: boolean; haptics: boolean;
};
export const defaults: Settings = {
  inhale: 4, hold: 0, exhale: 6, minutes: 3,
  visual: 'Lungs', theme: 'dark', sound: true, haptics: true,
};
export const visuals: Visual[] = ['Lungs', 'Orb', 'Tide', 'Timer', 'Path'];
export function sanitizeSettings(value: unknown): Settings {
  const v = value && typeof value === 'object' ? value as Partial<Settings> : {};
  const number = (key: 'inhale' | 'hold' | 'exhale' | 'minutes', min: number, max: number) =>
    typeof v[key] === 'number' && Number.isFinite(v[key])
      ? Math.max(min, Math.min(max, Math.round(v[key]!))) : defaults[key];
  return {
    inhale: number('inhale', 1, 20), hold: number('hold', 0, 20), exhale: number('exhale', 1, 20),
    minutes: number('minutes', 1, 30), visual: visuals.includes(v.visual!) ? v.visual! : defaults.visual,
    theme: v.theme === 'dark' || v.theme === 'light' ? v.theme : defaults.theme,
    sound: typeof v.sound === 'boolean' ? v.sound : true,
    haptics: typeof v.haptics === 'boolean' ? v.haptics : true,
  };
}
export function frameAt(elapsedMs: number, timings: Pick<Settings, Phase>) {
  const phases: Phase[] = timings.hold > 0 ? ['inhale', 'hold', 'exhale'] : ['inhale', 'exhale'];
  const cycleMs = (timings.inhale + timings.hold + timings.exhale) * 1000;
  const cycle = Math.floor(Math.max(0, elapsedMs) / cycleMs);
  let within = Math.max(0, elapsedMs) % cycleMs;
  for (const phase of phases) {
    const duration = timings[phase] * 1000;
    if (within < duration) {
      const progress = within / duration;
      return { phase, progress, cycle, remaining: Math.ceil((duration - within) / 1000),
        fill: phase === 'inhale' ? progress : phase === 'hold' ? 1 : 1 - progress };
    }
    within -= duration;
  }
  throw new Error('Breathing timings must have positive inhale and exhale durations.');
}
export function formatTime(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
