/**
 * CatSprite — custom inline SVG chibi cats. No clipart, no emoji.
 * Each cat tier has a distinct, recognizable visual identity per spec.
 */

import type { CSSProperties } from 'react';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';

interface CatSpriteProps {
  catType: CatTypeId;
  size?: number;
  /** Visual stage 0/1/2 for growth: seedling, sapling, ready */
  stage?: 0 | 1 | 2;
  wiggle?: boolean;
  /** Render with a glow ring (ready state) */
  glow?: boolean;
}

export function CatSprite({
  catType,
  size = 120,
  stage = 2,
  wiggle = true,
  glow = false,
}: CatSpriteProps) {
  const cat = CAT_TYPES[catType];
  if (!cat) return null;

  if (stage === 0) {
    return (
      <Seedling color={cat.palette.body} accent={cat.palette.accent} size={size} />
    );
  }
  if (stage === 1) {
    return (
      <Sapling color={cat.palette.body} accent={cat.palette.accent} size={size} />
    );
  }

  const classNames = ['cat-sprite'];
  if (wiggle) classNames.push('cat-wiggle');
  if (glow) classNames.push('cat-glow');

  const style: CSSProperties = {
    width: size,
    height: size,
    ['--glow-color' as string]: cat.palette.glow,
    ['--accent-color' as string]: cat.palette.accent,
  };

  return (
    <div className={classNames.join(' ')} style={style}>
      <CatBodySvg catType={catType} />
    </div>
  );
}

function Seedling({
  color,
  accent,
  size,
}: {
  color: string;
  accent: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="cat-sprite"
    >
      <ellipse cx="60" cy="92" rx="22" ry="6" fill="#7d5a44" opacity="0.35" />
      <path
        d="M 60 88 Q 56 70 52 64 Q 50 60 54 60 Q 58 62 60 70"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="58" cy="60" rx="9" ry="6" fill={color} />
      <ellipse cx="62" cy="56" rx="6" ry="5" fill={color} opacity="0.7" />
    </svg>
  );
}

function Sapling({
  color,
  accent,
  size,
}: {
  color: string;
  accent: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="cat-sprite"
    >
      <ellipse cx="60" cy="92" rx="26" ry="7" fill="#7d5a44" opacity="0.35" />
      <path
        d="M 60 86 Q 60 70 60 56"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="60" cy="62" rx="22" ry="18" fill={color} />
      <path d="M 46 50 L 50 38 L 56 48 Z" fill={color} />
      <path d="M 74 50 L 70 38 L 64 48 Z" fill={color} />
      <circle cx="54" cy="62" r="2.2" fill="#3a2d4f" />
      <circle cx="66" cy="62" r="2.2" fill="#3a2d4f" />
    </svg>
  );
}

function CatBodySvg({ catType }: { catType: CatTypeId }) {
  const cat = CAT_TYPES[catType];
  const { body, accent, shadow, glow } = cat.palette;
  const idSafe = catType;

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id={`bg-${idSafe}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={body} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
        {catType === 'regnbagskatt' && (
          <linearGradient id="stripe-regnbagskatt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8fa3" />
            <stop offset="25%" stopColor="#ffd56b" />
            <stop offset="50%" stopColor="#a8d8b9" />
            <stop offset="75%" stopColor="#a8c5ff" />
            <stop offset="100%" stopColor="#d1b0ff" />
          </linearGradient>
        )}
      </defs>

      <ellipse cx="60" cy="106" rx="32" ry="5" fill="#3a2d4f" opacity="0.18" />

      <path
        d={
          catType === 'rymkatt'
            ? 'M 92 70 Q 110 55 100 38 Q 92 28 86 36'
            : 'M 86 70 Q 100 65 102 48 Q 100 40 94 42'
        }
        stroke={accent}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      <ellipse cx="60" cy="72" rx="34" ry="28" fill={`url(#bg-${idSafe})`} />
      <ellipse cx="60" cy="80" rx="22" ry="14" fill={body} opacity="0.6" />
      <ellipse cx="60" cy="46" rx="28" ry="26" fill={`url(#bg-${idSafe})`} />

      <path d="M 38 30 L 42 12 L 54 26 Z" fill={shadow} />
      <path d="M 82 30 L 78 12 L 66 26 Z" fill={shadow} />
      <path d="M 42 25 L 44 16 L 50 24 Z" fill={accent} />
      <path d="M 78 25 L 76 16 L 70 24 Z" fill={accent} />

      <ellipse cx="48" cy="50" rx="6" ry="8" fill="#1f1a39" />
      <ellipse cx="72" cy="50" rx="6" ry="8" fill="#1f1a39" />
      <circle cx="50" cy="47" r="2" fill="white" />
      <circle cx="74" cy="47" r="2" fill="white" />
      <circle cx="47" cy="53" r="1" fill="white" opacity="0.7" />
      <circle cx="71" cy="53" r="1" fill="white" opacity="0.7" />

      <path d="M 58 60 Q 60 63 62 60 Q 60 64 58 60 Z" fill={accent} />
      <path
        d="M 56 64 Q 60 68 64 64"
        stroke={shadow}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {renderCatBadge(catType, accent, glow)}
    </svg>
  );
}

function renderCatBadge(catType: CatTypeId, accent: string, glow: string) {
  switch (catType) {
    case 'graskatt':
      return (
        <g>
          <circle cx="60" cy="24" r="3" fill="#7BA67C" />
          <circle cx="56" cy="20" r="3" fill="#7BA67C" />
          <circle cx="64" cy="20" r="3" fill="#7BA67C" />
          <path d="M 60 26 L 60 32" stroke="#7BA67C" strokeWidth="1.5" />
        </g>
      );
    case 'morotskatt':
      return (
        <g>
          <path
            d="M 58 18 L 60 8 L 62 18 M 56 16 L 56 8 M 64 16 L 64 8"
            stroke="#7BA67C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      );
    case 'blabarskatt':
      return (
        <g>
          <circle cx="96" cy="44" r="3.5" fill="#4A5F9A" />
          <circle cx="100" cy="48" r="3" fill="#6F87C8" />
          <circle cx="98" cy="40" r="2.5" fill="#4A5F9A" />
        </g>
      );
    case 'jordgubbskatt':
      return (
        <g>
          {[
            [45, 70],
            [55, 78],
            [65, 72],
            [75, 80],
            [50, 86],
            [70, 88],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.4" fill="#FFEC9C" />
          ))}
        </g>
      );
    case 'citruskatt':
      return (
        <g>
          <path
            d="M 36 80 Q 60 90 84 80"
            stroke={accent}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="60" cy="84" r="3" fill={accent} />
        </g>
      );
    case 'regnbagskatt':
      return (
        <g>
          <path
            d="M 32 60 Q 60 50 88 60"
            stroke="url(#stripe-regnbagskatt)"
            strokeWidth="5"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M 36 68 Q 60 58 84 68"
            stroke="url(#stripe-regnbagskatt)"
            strokeWidth="3"
            fill="none"
            opacity="0.55"
          />
        </g>
      );
    case 'stjarnkatt':
      return (
        <g>
          {[
            [44, 64],
            [56, 70],
            [62, 62],
            [72, 72],
            [80, 64],
            [70, 84],
            [50, 84],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#FFE082" />
          ))}
          <line x1="44" y1="64" x2="56" y2="70" stroke="#FFE082" strokeWidth="0.6" opacity="0.5" />
          <line x1="56" y1="70" x2="62" y2="62" stroke="#FFE082" strokeWidth="0.6" opacity="0.5" />
          <line x1="62" y1="62" x2="72" y2="72" stroke="#FFE082" strokeWidth="0.6" opacity="0.5" />
          <line x1="72" y1="72" x2="80" y2="64" stroke="#FFE082" strokeWidth="0.6" opacity="0.5" />
          <ellipse cx="60" cy="14" rx="20" ry="3" fill="none" stroke="#FFE082" strokeWidth="1.2" opacity="0.8" />
        </g>
      );
    case 'rymkatt':
      return (
        <g>
          <circle cx="50" cy="74" r="6" fill={glow} opacity="0.5" />
          <circle cx="68" cy="68" r="4" fill="#F8BBD0" opacity="0.4" />
          <circle cx="72" cy="80" r="3" fill="#C99DF2" opacity="0.6" />
          <circle cx="42" cy="80" r="2" fill="white" opacity="0.7" />
          <circle cx="100" cy="20" r="5" fill="#C99DF2" />
          <circle cx="100" cy="20" r="2" fill="#F8BBD0" opacity="0.6" />
          <path d="M 24 30 L 26 26 L 28 30 L 32 32 L 28 34 L 26 38 L 24 34 L 20 32 Z" fill="white" opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}
