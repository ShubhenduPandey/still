import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, BackHandler, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { BreathVisual } from './src/BreathVisual';
import { defaults, formatTime, frameAt, sanitizeSettings, visuals, type Settings } from './src/breathing';
import { palettes } from './src/theme';

const STORAGE_KEY = 'still.settings.v1';
const descriptions = { Orb: 'Expand into calm', Tide: 'Follow the gentle flow', Timer: 'A little less distraction', Path: 'Find your rhythm', Lungs: 'See each breath unfold' };
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
function Awake() { useKeepAwake(); return null; }
export default function App() { return <SafeAreaProvider><Still/></SafeAreaProvider>; }
function Still() {
  const { width } = useWindowDimensions();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<'home' | 'settings' | 'session' | 'complete'>('home');
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [previewMs, setPreviewMs] = useState(2000);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [notice, setNotice] = useState('');
  const clock = useRef({ started: 0, saved: 0 });
  const cueKey = useRef('');
  const active = useRef(false);
  const writes = useRef(Promise.resolve());
  const player = useAudioPlayer(require('./assets/chime.wav'));
  const c = palettes[settings.theme];
  const s = makeStyles(c);
  const total = settings.minutes * 60000;
  const frame = frameAt(screen === 'session' ? elapsed : previewMs, settings);
  const update = (patch: Partial<Settings>) => setSettings(old => sanitizeSettings({ ...old, ...patch }));
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => { if (alive && raw) setSettings(sanitizeSettings(JSON.parse(raw))); })
      .catch(() => { if (alive) setNotice('Preferences could not be loaded. Default settings are ready.'); })
      .finally(() => { if (alive) setLoaded(true); });
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReduceMotion(value); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { alive = false; motion.remove(); };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    writes.current = writes.current.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)))
      .catch(() => setNotice('Preferences could not be saved on this device. You can still breathe.'));
  }, [settings, loaded]);
  useEffect(() => {
    if (screen === 'session' || screen === 'complete' || reduceMotion) return;
    let id: number;
    let last = 0;
    const tick = (now: number) => { if (now - last > 32) { last = now; setPreviewMs(now); } id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [screen, reduceMotion]);
  useEffect(() => {
    if (!running) return;
    let id: number;
    const tick = () => {
      const next = Math.min(total, clock.current.saved + performance.now() - clock.current.started);
      setElapsed(next);
      if (next >= total) { active.current = false; clock.current.saved = total; setRunning(false); setScreen('complete'); player.pause(); }
      else id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running, total, player]);
  const pause = () => {
    if (!active.current) return;
    active.current = false;
    clock.current.saved = Math.min(total, clock.current.saved + performance.now() - clock.current.started);
    setElapsed(clock.current.saved); setRunning(false); player.pause();
  };
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active' && running) pause(); });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'session') { if (running) pause(); return true; }
      if (screen !== 'home') { setScreen('home'); return true; }
      return false;
    });
    return () => { subscription.remove(); back.remove(); };
  }, [running, screen, total]);
  useEffect(() => {
    if (!running) return;
    const key = `${frame.cycle}-${frame.phase}`;
    if (cueKey.current === key) return;
    cueKey.current = key;
    AccessibilityInfo.announceForAccessibility(`${frame.phase === 'inhale' ? 'Breathe in' : frame.phase === 'exhale' ? 'Breathe out' : 'Hold'}, ${settings[frame.phase]} seconds`);
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    if (settings.sound) player.seekTo(0).then(() => { if (active.current) player.play(); }).catch(() => setNotice('Sound is unavailable. The visual guide will continue.'));
  }, [frame.phase, frame.cycle, running, settings.sound, settings.haptics, player]);
  const start = () => { active.current = true; clock.current = { saved: 0, started: performance.now() }; cueKey.current = ''; setElapsed(0); setScreen('session'); setRunning(true); };
  const resume = () => { if (active.current) return; active.current = true; clock.current.started = performance.now(); setRunning(true); };
  const end = () => { active.current = false; setRunning(false); player.pause(); setScreen('home'); };
  const button = (label: string, action: () => void, secondary = false) => <Pressable accessibilityRole="button" onPress={action} style={({ pressed }) => [s.button, secondary && s.secondary, pressed && { opacity: 0.75 }]}><Text style={[s.buttonText, secondary && { color: c.ink }]}>{label}</Text></Pressable>;
  const eyebrow = (text: string) => <Text style={s.eyebrow}>{text}</Text>;
  const stepper = (key: 'inhale' | 'hold' | 'exhale' | 'minutes', label: string, min: number, max: number) => <View style={s.stepper} key={key}><Text style={s.body}>{label}</Text><View style={s.counter}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} disabled={settings[key] <= min} onPress={() => update({ [key]: settings[key] - 1 })} style={[s.stepButton, settings[key] <= min && { opacity: 0.3 }]}><Text style={s.stepText}>−</Text></Pressable>
    <Text style={s.counterText}>{settings[key]}{key === 'minutes' ? 'm' : 's'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} disabled={settings[key] >= max} onPress={() => update({ [key]: settings[key] + 1 })} style={[s.stepButton, settings[key] >= max && { opacity: 0.3 }]}><Text style={s.stepText}>+</Text></Pressable>
  </View></View>;
  const title = frame.phase === 'inhale' ? 'Breathe in' : frame.phase === 'hold' ? 'Hold softly' : 'Breathe out';
  const guide = (size: number) => <View style={{ width: size, height: size, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
    <BreathVisual visual={reduceMotion ? 'Timer' : settings.visual} colors={c} fill={frame.fill} progress={reduceMotion ? 0 : frame.progress} phase={frame.phase} hold={settings.hold} size={size}/>
    {(settings.visual === 'Timer' || settings.visual === 'Path' || reduceMotion) && <View pointerEvents="none" style={s.visualLabel}><Text style={s.timerNumber}>{frame.remaining}</Text><Text style={s.small}>{title}</Text></View>}
  </View>;
  return <SafeAreaView style={s.root}><StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'}/>{running && <Awake/>}
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}><View style={s.content}>
      <View style={s.header}><Text style={s.logo}>still<Text style={{ color: c.gold }}>.</Text></Text>
        {screen === 'home' ? <Pressable accessibilityRole="button" onPress={() => setScreen('settings')} style={s.headerButton}><Text style={s.small}>Preferences  ☷</Text></Pressable> : screen === 'settings' ? <Pressable accessibilityRole="button" onPress={() => setScreen('home')} style={s.headerButton}><Text style={s.small}>Done  ✓</Text></Pressable> : eyebrow('A MOMENT FOR YOU')}
      </View>
      {!!notice && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notice" onPress={() => setNotice('')}><Text style={s.notice}>{notice} ×</Text></Pressable>}
      {!loaded ? <Text style={s.body}>Finding your stillness…</Text> : screen === 'home' ? <>
        <View style={s.intro}>{eyebrow('SLOW DOWN. COME BACK TO YOU.')}<Text style={s.heading}>A little space.{'\n'}A deeper breath.</Text><Text style={s.subtitle}>Let everything else wait for a moment.</Text></View>
        <View style={s.hero}>{guide(250)}<View style={s.previewTag}><View style={s.liveDot}/><Text style={s.small}>{settings.visual === 'Timer' ? 'Minimal timer' : settings.visual} · live preview</Text></View></View>
        <View style={s.sectionHeading}>{eyebrow('YOUR BREATHING VISUAL')}<Text style={s.small}>Choose your calm</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.visualList}>
          {visuals.map(visual => <Pressable key={visual} accessibilityRole="button" accessibilityLabel={`Choose ${visual}`} accessibilityState={{ selected: settings.visual === visual }} onPress={() => update({ visual })} style={[s.visualCard, settings.visual === visual && s.selectedCard]}>
            <BreathVisual visual={visual} fill={settings.visual === visual ? frame.fill : 0.6} progress={settings.visual === visual ? frame.progress : 0.45} phase={settings.visual === visual ? frame.phase : 'inhale'} hold={settings.hold} colors={c} size={70}/>
            <Text style={[s.small, { color: c.ink }]}>{visual === 'Timer' ? 'Minimal' : visual}</Text><View style={[s.selectionDot, { backgroundColor: settings.visual === visual ? c.accent : 'transparent' }]}/>
          </Pressable>)}
        </ScrollView><Text style={s.visualDescription}>{descriptions[settings.visual]}</Text>
        <View style={s.card}><View style={s.sectionHeading}>{eyebrow('YOUR RHYTHM')}<Pressable accessibilityRole="button" onPress={() => setScreen('settings')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={s.link}>Adjust →</Text></Pressable></View>
          <View style={s.rhythm}>{(['inhale', 'hold', 'exhale'] as const).map((phase, index) => <React.Fragment key={phase}>{index > 0 && <Text style={s.rhythmDivider}>·</Text>}<View style={s.rhythmItem}><Text style={s.rhythmNumber}>{settings[phase]}<Text style={s.small}> s</Text></Text><Text style={s.small}>{phase === 'hold' && settings.hold === 0 ? 'Hold off' : phase[0].toUpperCase() + phase.slice(1)}</Text></View></React.Fragment>)}</View>
        </View>
        <View style={s.durationRow}>{eyebrow('SESSION LENGTH')}<View style={s.durationOptions}>{[1, 3, 5, 10].map(minutes => <Pressable key={minutes} accessibilityRole="button" accessibilityState={{ selected: settings.minutes === minutes }} accessibilityLabel={`${minutes} minute session`} onPress={() => update({ minutes })} style={[s.duration, settings.minutes === minutes && { backgroundColor: c.soft }]}><Text style={[s.small, { color: c.ink }]}>{minutes}m</Text></Pressable>)}</View></View>
        {button(`Begin · ${settings.minutes} min`, start)}<Text style={s.footer}>Nothing to achieve. Just a moment to breathe.</Text>
      </> : screen === 'settings' ? <>
        <Text style={s.heading}>Make it yours.</Text><Text style={s.subtitle}>A rhythm that feels right for you.</Text>
        <View style={s.settingsSection}>{eyebrow('BREATHING RHYTHM')}<View style={s.card}>{stepper('inhale', 'Inhale', 1, 20)}{stepper('hold', 'Hold', 0, 20)}{stepper('exhale', 'Exhale', 1, 20)}</View><Text style={s.helper}>Set hold to 0 to flow straight into your exhale.</Text></View>
        <View style={s.card}>{stepper('minutes', 'Session length', 1, 30)}</View>
        <View style={s.settingsSection}>{eyebrow('GENTLE GUIDANCE')}<View style={s.card}>
          {(['sound', 'haptics'] as const).map(key => <View style={s.stepper} key={key}><View style={{ flex: 1 }}><Text style={s.body}>{key === 'sound' ? 'Soft chime' : 'Gentle vibration'}</Text><Text style={s.helper}>At each change of breath</Text></View><Switch accessibilityLabel={key === 'sound' ? 'Soft chime' : 'Gentle vibration'} value={settings[key]} onValueChange={value => update({ [key]: value })} trackColor={{ false: c.line, true: c.accent }} thumbColor={c.card}/></View>)}
        </View></View>
        <View style={s.settingsSection}>{eyebrow('APPEARANCE')}<View style={s.themeRow}>{(['light', 'dark'] as const).map(theme => <Pressable key={theme} accessibilityRole="button" accessibilityState={{ selected: settings.theme === theme }} onPress={() => update({ theme })} style={[s.themeCard, settings.theme === theme && s.selectedCard]}><View style={[s.themeSample, { backgroundColor: palettes[theme].background }]}><View style={[s.themeOrb, { backgroundColor: palettes[theme].glow }]}/></View><Text style={s.body}>{theme === 'light' ? 'Morning light' : 'Evening quiet'}</Text></Pressable>)}</View></View>
        {button('Save & return', () => setScreen('home'))}<Text style={s.footer}>Your preferences stay on this device.</Text>
      </> : screen === 'session' ? <>
        <View style={s.sessionIntro}>{eyebrow(running ? 'FOLLOW YOUR BREATH' : 'TAKE YOUR TIME')}<Text style={s.heading}>{running ? title : 'A gentle pause.'}</Text><Text style={s.subtitle}>{running ? 'Easy and unhurried. Just like this.' : 'Continue whenever you’re ready.'}</Text></View>
        {guide(Math.min(290, width - 48))}<View style={s.countdown}><Text style={s.seconds}>{frame.remaining}<Text style={s.subtitle}> sec</Text></Text><Text style={s.small}>{running ? `${title} · ${settings[frame.phase]} seconds` : 'Your rhythm is waiting for you'}</Text></View>
        <View style={s.sessionProgress}><View style={[s.progressFill, { width: `${elapsed / total * 100}%` }]}/></View><View style={s.sectionHeading}><Text style={s.small}>{formatTime(total - elapsed)} remaining</Text><Text style={s.small}>{settings.minutes} minute session</Text></View>
        {button(running ? 'Pause' : 'Continue breathing', running ? pause : resume)}{button('End session', end, true)}<Text style={s.footer}>Breathe comfortably. There’s no need to force it.</Text>
      </> : <View style={s.complete}>{eyebrow('A MOMENT WELL SPENT')}<BreathVisual visual="Orb" fill={0.65} progress={1} phase="exhale" hold={0} colors={c} size={230}/><Text style={s.heading}>Carry this calm.</Text><Text style={s.subtitle}>You made a little space for yourself.</Text><Text style={s.completeMinutes}>{settings.minutes}<Text style={s.subtitle}> mindful {settings.minutes === 1 ? 'minute' : 'minutes'}</Text></Text>{button('Back to Still', () => setScreen('home'))}{button('Breathe again', start, true)}</View>}
    </View></ScrollView>
  </SafeAreaView>;
}

function makeStyles(c: typeof palettes.light) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background }, scroll: { flexGrow: 1, alignItems: 'center' }, content: { width: '100%', maxWidth: 520, paddingHorizontal: 24, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 22 }, logo: { fontFamily: serif, fontSize: 38, letterSpacing: -2, color: c.ink }, headerButton: { minHeight: 44, justifyContent: 'center', paddingLeft: 16 },
  eyebrow: { color: c.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1.8 }, intro: { paddingTop: 12 }, heading: { fontFamily: serif, color: c.ink, fontSize: 38, lineHeight: 45, letterSpacing: -1, marginTop: 12 }, subtitle: { color: c.muted, fontSize: 14, lineHeight: 22, marginTop: 10 },
  hero: { alignItems: 'center', marginTop: -1, marginBottom: 23 }, previewTag: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: -8 }, liveDot: { width: 5, height: 5, borderRadius: 4, backgroundColor: c.gold }, small: { color: c.muted, fontSize: 12, lineHeight: 18 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, visualList: { gap: 9, paddingTop: 13, paddingBottom: 2 }, visualCard: { width: 80, borderWidth: 1, borderColor: c.line, borderRadius: 18, alignItems: 'center', paddingBottom: 8 }, selectedCard: { borderColor: c.accent, backgroundColor: c.soft }, selectionDot: { width: 4, height: 4, borderRadius: 3, marginTop: 5 }, visualDescription: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.line, paddingHorizontal: 18, paddingVertical: 16 }, link: { color: c.accent, fontSize: 12 }, rhythm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 8 }, rhythmItem: { alignItems: 'center' }, rhythmNumber: { fontSize: 27, color: c.ink, fontFamily: serif }, rhythmDivider: { color: c.line, fontSize: 24 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16, flexWrap: 'wrap', gap: 8 }, durationOptions: { flexDirection: 'row', gap: 3 }, duration: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 24 }, button: { backgroundColor: c.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 8, width: '100%' }, buttonText: { color: c.buttonText, fontSize: 15, fontWeight: '500', letterSpacing: 0.5 }, secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.line }, footer: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 18, lineHeight: 18 },
  settingsSection: { gap: 13, marginTop: 27, marginBottom: 15 }, stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 58 }, body: { fontSize: 15, color: c.ink }, counter: { flexDirection: 'row', alignItems: 'center' }, stepButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: c.soft }, stepText: { fontSize: 21, color: c.ink }, counterText: { minWidth: 48, textAlign: 'center', color: c.ink, fontSize: 15, fontVariant: ['tabular-nums'] }, helper: { color: c.muted, fontSize: 11, marginTop: 5, lineHeight: 17 }, themeRow: { flexDirection: 'row', gap: 12 }, themeCard: { flex: 1, borderWidth: 1, borderColor: c.line, padding: 12, borderRadius: 18, gap: 12 }, themeSample: { height: 75, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, themeOrb: { width: 42, height: 42, borderRadius: 21 },
  sessionIntro: { alignItems: 'center', marginTop: 30, marginBottom: 20 }, visualLabel: { position: 'absolute', alignItems: 'center' }, timerNumber: { fontFamily: serif, fontSize: 48, color: c.ink, fontVariant: ['tabular-nums'] }, countdown: { alignItems: 'center', marginBottom: 35 }, seconds: { fontFamily: serif, fontSize: 38, color: c.ink, marginBottom: 8, fontVariant: ['tabular-nums'] }, sessionProgress: { height: 3, backgroundColor: c.line, borderRadius: 3, overflow: 'hidden', marginBottom: 12 }, progressFill: { height: 3, backgroundColor: c.accent }, complete: { alignItems: 'center', marginTop: 45 }, completeMinutes: { fontFamily: serif, color: c.ink, fontSize: 40, marginVertical: 36 }, notice: { color: c.ink, backgroundColor: c.soft, padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 12 },
}); }
