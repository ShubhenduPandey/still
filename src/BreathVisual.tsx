import React, { useId } from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, RadialGradient, Stop, Rect, ClipPath, G } from 'react-native-svg';
import type { Phase, Visual } from './breathing';
import type { Palette } from './theme';

type Props = { visual: Visual; fill: number; progress: number; phase: Phase; hold: number; colors: Palette; size?: number };
const lungs = 'M 137 71 C 124 57 111 69 97 91 C 72 118 57 157 59 191 C 60 216 92 215 119 201 C 135 193 140 178 140 151 L 140 85 Q 140 76 137 71 Z M 163 71 C 176 57 189 69 203 91 C 228 118 243 157 241 191 C 240 216 208 215 181 201 C 165 193 160 178 160 151 L 160 85 Q 160 76 163 71 Z';
export function BreathVisual({ visual, fill, progress, phase, hold, colors: c, size = 300 }: Props) {
  const id = useId().replace(/:/g, '');
  const gradient = `${id}gradient`, clip = `${id}clip`, mist = `${id}mist`;
  const smooth = fill * fill * (3 - 2 * fill);
  const r = 62 + smooth * 37;
  const points = [[150, 247], [50, 74], [250, 74], [150, 247]];
  const side = phase === 'inhale' ? 0 : phase === 'hold' ? 1 : 2;
  const a = points[side], b = points[side + 1];
  const angle = -Math.PI / 2 + Math.PI * ((phase === 'inhale' ? 0 : 1) + progress);
  const dot = hold > 0 ? [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress] : [150 + 102 * Math.cos(angle), 150 + 102 * Math.sin(angle)];
  const y = 240 - smooth * 180;
  return <Svg width={size} height={size} viewBox="0 0 300 300" accessible={false}>
    <Defs>
      <LinearGradient id={gradient} x1="0" y1="0" x2="0.8" y2="1"><Stop offset="0" stopColor={c.glow}/><Stop offset="1" stopColor={c.accent}/></LinearGradient>
      <RadialGradient id={mist}><Stop offset="0" stopColor={c.glow} stopOpacity="0.35"/><Stop offset="1" stopColor={c.glow} stopOpacity="0"/></RadialGradient>
      <ClipPath id={clip}>{visual === 'Lungs' ? <Path d={lungs}/> : <Circle cx="150" cy="150" r="102"/>}</ClipPath>
    </Defs>
    <Circle cx="150" cy="150" r="148" fill={`url(#${mist})`}/>
    {visual === 'Orb' && <>
      <Circle cx="150" cy="150" r="119" stroke={c.line} strokeWidth="1" fill="none"/>
      <Circle cx="150" cy="150" r={r + 12} fill={c.glow} opacity="0.12"/>
      <Circle cx="150" cy="150" r={r} fill={`url(#${gradient})`} opacity="0.8"/>
      <Circle cx="150" cy="150" r={r - 9} stroke={c.card} strokeOpacity="0.2" fill="none"/>
    </>}
    {visual === 'Tide' && <>
      <Circle cx="150" cy="150" r="102" fill={c.soft} stroke={c.line}/>
      <G clipPath={`url(#${clip})`}>
        <Path d={`M 20 ${y} Q 85 ${y - 20} 150 ${y} T 280 ${y} V 300 H 20 Z`} fill={c.glow} opacity="0.45"/>
        <Path d={`M 20 ${y + 7} Q 85 ${y + 27} 150 ${y + 7} T 280 ${y + 7} V 300 H 20 Z`} fill={`url(#${gradient})`} opacity="0.85"/>
      </G>
      <Circle cx="150" cy="150" r="114" fill="none" stroke={c.line}/>
    </>}
    {visual === 'Timer' && <>
      <Circle cx="150" cy="150" r="104" fill="none" stroke={c.line} strokeWidth="2"/>
      <Circle cx="150" cy="150" r="104" fill="none" stroke={c.accent} strokeWidth="3" strokeDasharray={`${progress * 653.45} 653.45`} rotation="-90" origin="150,150" strokeLinecap="round"/>
    </>}
    {visual === 'Path' && <>
      {hold > 0 ? <>
        <Path d="M150 247 L50 74 L250 74 Z" stroke={c.line} fill="none" strokeWidth="2" strokeLinejoin="round"/>
        <Path d={`M${a[0]} ${a[1]} L${dot[0]} ${dot[1]}`} stroke={c.accent} strokeWidth="3" strokeLinecap="round"/>
      </> : <>
        <Circle cx="150" cy="150" r="102" stroke={c.line} fill="none" strokeWidth="2"/>
        <Circle cx="150" cy="150" r="102" stroke={c.accent} fill="none" strokeWidth="3" strokeDasharray={`${progress * Math.PI * 102} ${Math.PI * 204}`} rotation={phase === 'inhale' ? -90 : 90} origin="150,150"/>
      </>}
      <Circle cx={dot[0]} cy={dot[1]} r="13" fill={c.glow} opacity="0.2"/>
      <Circle cx={dot[0]} cy={dot[1]} r="5" fill={c.accent}/>
    </>}
    {visual === 'Lungs' && <>
      <Path d={lungs} fill={c.soft} stroke={c.glow} strokeWidth="1.5"/>
      <G clipPath={`url(#${clip})`}><Rect x="45" y={216 - smooth * 160} width="210" height="180" fill={`url(#${gradient})`} opacity="0.85"/></G>
      <Path d="M150 48 V109 M150 99 Q143 115 117 130 M150 99 Q157 115 183 130 M117 130 L101 154 M117 130 L120 165 M183 130 L199 154 M183 130 L180 165" fill="none" stroke={c.ink} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round"/>
    </>}
  </Svg>;
}
