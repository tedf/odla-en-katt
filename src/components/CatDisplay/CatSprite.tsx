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
  // useId gives a unique ID per React instance, preventing gradient cross-contamination
  // when multiple cats of different types are rendered simultaneously in the DOM.
  const uid = Math.random().toString(36).slice(2, 8);
  const bgId = `bg-${catType}-${uid}`;
  const stripeId = `stripe-regnbagskatt-${uid}`;

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={body} />
          <stop offset="100%" stopColor={shadow} />
        </radialGradient>
        {catType === 'regnbagskatt' && (
          <linearGradient id={stripeId} x1="0%" y1="0%" x2="100%" y2="100%">
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

      <ellipse cx="60" cy="72" rx="34" ry="28" fill={`url(#${bgId})`} />
      <ellipse cx="60" cy="80" rx="22" ry="14" fill={body} opacity="0.6" />
      <ellipse cx="60" cy="46" rx="28" ry="26" fill={`url(#${bgId})`} />

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

      {renderCatBadge(catType, accent, glow, stripeId)}
    </svg>
  );
}

function renderCatBadge(catType: CatTypeId, accent: string, glow: string, stripeId: string) {
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
    case 'bamboukatt':
      return (
        <g>
          {/* Distinct dark panda eye patches over the eyes. */}
          <ellipse cx="48" cy="50" rx="9" ry="9" fill="#222428" opacity="0.85" />
          <ellipse cx="72" cy="50" rx="9" ry="9" fill="#222428" opacity="0.85" />
          {/* Bamboo stalk on belly. */}
          <rect x="56" y="74" width="8" height="14" rx="2" fill="#4ADE80" />
          <line x1="56" y1="80" x2="64" y2="80" stroke="#1B5C2D" strokeWidth="1.2" />
          <line x1="56" y1="84" x2="64" y2="84" stroke="#1B5C2D" strokeWidth="1.2" />
          {/* Two tiny bamboo leaves. */}
          <path d="M 64 74 Q 72 70 70 78" fill="#86EFAC" />
          <path d="M 56 74 Q 48 70 50 78" fill="#86EFAC" />
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
    case 'kokosnotkatt':
      return (
        <g>
          {/* Coconut shell pattern: dark fibrous oval on body. */}
          <ellipse cx="60" cy="80" rx="12" ry="8" fill="#3D2A0F" opacity="0.55" />
          <line x1="50" y1="80" x2="70" y2="80" stroke="#1F1208" strokeWidth="0.8" />
          <line x1="55" y1="74" x2="65" y2="86" stroke="#1F1208" strokeWidth="0.6" />
          <line x1="65" y1="74" x2="55" y2="86" stroke="#1F1208" strokeWidth="0.6" />
          {/* Palm leaf tuft above forehead. */}
          <path d="M 60 16 Q 52 8 46 14 Q 54 16 56 22 Z" fill="#65A30D" />
          <path d="M 60 16 Q 68 8 74 14 Q 66 16 64 22 Z" fill="#65A30D" />
          <path d="M 60 14 Q 60 6 60 4" stroke="#3F6E0D" strokeWidth="2" strokeLinecap="round" />
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
    case 'isbjornkatt':
      return (
        <g>
          {/* Snow flecks on body. */}
          {[
            [44, 74],
            [56, 80],
            [72, 76],
            [80, 84],
            [52, 88],
            [68, 86],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path
                d="M 0 -3 L 0 3 M -3 0 L 3 0 M -2 -2 L 2 2 M -2 2 L 2 -2"
                stroke="#93C5FD"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* Tiny iceberg crown */}
          <path d="M 50 14 L 60 4 L 70 14 Z" fill="#DCEDFF" opacity="0.85" />
          <path d="M 54 14 L 60 8 L 66 14 Z" fill="#93C5FD" opacity="0.7" />
        </g>
      );
    case 'vulkankatt':
      return (
        <g>
          {/* Lava cracks across the body. */}
          <path
            d="M 38 76 Q 50 70 60 76 Q 72 82 84 74"
            stroke="#FF8E3C"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 42 88 Q 52 82 64 88 Q 74 92 80 84"
            stroke="#FF3D00"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Ember sparks above head. */}
          <circle cx="46" cy="10" r="2" fill="#FFB97A" />
          <circle cx="60" cy="6" r="2.5" fill="#FF8E3C" />
          <circle cx="74" cy="10" r="2" fill="#FFB97A" />
          <path d="M 60 8 L 60 16" stroke="#FF3D00" strokeWidth="1.5" />
        </g>
      );
    case 'regnbagskatt':
      return (
        <g>
          <path
            d="M 32 60 Q 60 50 88 60"
            stroke={`url(#${stripeId})`}
            strokeWidth="5"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M 36 68 Q 60 58 84 68"
            stroke={`url(#${stripeId})`}
            strokeWidth="3"
            fill="none"
            opacity="0.55"
          />
        </g>
      );
    case 'drakkatt':
      return (
        <g>
          {/* Large wing — bright gold outline so it's visible on dark body */}
          <path
            d="M 86 40 Q 112 22 114 6 Q 96 14 88 32 Z"
            fill="#C77DFF"
            stroke="#FFB300"
            strokeWidth="1.8"
          />
          {/* Wing membrane lines */}
          <path
            d="M 88 32 L 104 16 M 90 38 L 108 24"
            stroke="#FFB300"
            strokeWidth="1.2"
            opacity="0.9"
          />
          {/* Spiky dorsal fin — enlarged, high contrast gold */}
          <path
            d="M 46 16 L 50 4 L 54 16 L 58 2 L 62 16 L 66 4 L 70 16 L 74 6 L 78 16"
            fill="#FFB300"
            stroke="#FF6B00"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Big fangs */}
          <path d="M 54 64 L 57 73 L 60 64 Z" fill="white" stroke="#ccc" strokeWidth="0.5" />
          <path d="M 60 64 L 63 73 L 66 64 Z" fill="white" stroke="#ccc" strokeWidth="0.5" />
          {/* Fire breath — larger, more visible */}
          <ellipse cx="60" cy="80" rx="5" ry="3" fill="#FF6B00" opacity="0.9" />
          <ellipse cx="60" cy="80" rx="3" ry="2" fill="#FFD700" opacity="0.95" />
          <circle cx="56" cy="77" r="2" fill="#FF4500" opacity="0.7" />
          <circle cx="64" cy="77" r="2" fill="#FF4500" opacity="0.7" />
          {/* Purple glow aura around body */}
          <ellipse cx="60" cy="58" rx="32" ry="30" fill="none" stroke="#C77DFF" strokeWidth="2" opacity="0.4" />
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
    case 'enhornigskatt':
      return (
        <g>
          {/* Spiral unicorn horn between the ears. */}
          <path
            d="M 60 16 L 56 2"
            stroke="#FFD700"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 60 14 L 58 8 M 60 10 L 57 5"
            stroke="#B45309"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {/* Pastel rainbow mane along the back. */}
          <path d="M 36 32 Q 38 22 46 24" stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 40 36 Q 44 28 52 30" stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 44 40 Q 50 32 58 34" stroke="#34D399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Tiny sparkles. */}
          <circle cx="86" cy="30" r="1.6" fill="#EC4899" />
          <circle cx="92" cy="44" r="1.2" fill="#A78BFA" />
          <circle cx="34" cy="56" r="1.4" fill="#FBBF24" />
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
    case 'lavendercat':
      return (
        <g>
          {/* Lavender flower crown spanning the head. */}
          <circle cx="48" cy="14" r="3" fill="#C39BD3" />
          <circle cx="54" cy="10" r="3" fill="#A569BD" />
          <circle cx="60" cy="8" r="3.2" fill="#9B59B6" />
          <circle cx="66" cy="10" r="3" fill="#A569BD" />
          <circle cx="72" cy="14" r="3" fill="#C39BD3" />
          {/* Tiny stems */}
          <path d="M 48 17 L 50 22 M 54 13 L 56 22 M 60 11 L 60 22 M 66 13 L 64 22 M 72 17 L 70 22"
            stroke="#5B2C6F" strokeWidth="0.9" strokeLinecap="round" />
          {/* Soft scent glow */}
          <circle cx="60" cy="60" r="14" fill="#D7BDE2" opacity="0.18" />
        </g>
      );
    case 'honeycat':
      return (
        <g>
          {/* Honeycomb pattern on belly: three hex cells. */}
          {[[50, 78], [60, 84], [70, 78]].map(([x, y], i) => (
            <path
              key={i}
              d={`M ${x! - 5} ${y} L ${x! - 2.5} ${y! - 4.5} L ${x! + 2.5} ${y! - 4.5} L ${x! + 5} ${y} L ${x! + 2.5} ${y! + 4.5} L ${x! - 2.5} ${y! + 4.5} Z`}
              fill="#FCEFA0"
              stroke="#D35400"
              strokeWidth="1"
            />
          ))}
          {/* Bee bumbling over head: striped body + wings. */}
          <g transform="translate(86 18)">
            <ellipse cx="0" cy="0" rx="5" ry="3.5" fill="#FFD56B" />
            <rect x="-3.5" y="-3.5" width="1.5" height="7" fill="#1B1B1B" />
            <rect x="-1" y="-3.5" width="1.5" height="7" fill="#1B1B1B" />
            <rect x="1.5" y="-3.5" width="1.5" height="7" fill="#1B1B1B" />
            <ellipse cx="-2" cy="-4" rx="3" ry="2" fill="white" opacity="0.85" />
            <ellipse cx="2" cy="-4" rx="3" ry="2" fill="white" opacity="0.85" />
            <circle cx="-4" cy="0" r="0.8" fill="#1B1B1B" />
          </g>
          {/* Trail */}
          <path d="M 76 16 Q 80 12 84 14" stroke="#1B1B1B" strokeWidth="0.6"
            strokeDasharray="1 2" fill="none" opacity="0.6" />
        </g>
      );
    case 'crystalcat':
      return (
        <g>
          {/* Geometric crystal shards rising from head. */}
          <path d="M 50 16 L 54 2 L 56 18 Z" fill="#E1F5FE" stroke="#2980B9" strokeWidth="1" />
          <path d="M 58 14 L 60 0 L 64 16 Z" fill="#AED6F1" stroke="#1A5276" strokeWidth="1" />
          <path d="M 64 18 L 70 6 L 72 18 Z" fill="#FDFEFE" stroke="#2980B9" strokeWidth="1" />
          {/* Inner refraction highlights */}
          <line x1="54" y1="4" x2="54" y2="14" stroke="#FFFFFF" strokeWidth="0.8" />
          <line x1="61" y1="4" x2="61" y2="14" stroke="#FFFFFF" strokeWidth="0.8" />
          <line x1="69" y1="10" x2="69" y2="16" stroke="#FFFFFF" strokeWidth="0.8" />
          {/* Faceted belly diamond */}
          <path d="M 60 70 L 70 80 L 60 90 L 50 80 Z" fill="#AED6F1" stroke="#2980B9" strokeWidth="0.9" opacity="0.85" />
          <path d="M 50 80 L 70 80" stroke="#FFFFFF" strokeWidth="0.6" />
        </g>
      );
    case 'ghostcat':
      return (
        <g>
          {/* Semi-transparent veil overlay. */}
          <ellipse cx="60" cy="50" rx="32" ry="30" fill="#FFFFFF" opacity="0.35" />
          {/* Dot eyes — flat black, hollow pupils. */}
          <circle cx="48" cy="50" r="2.4" fill="#222" />
          <circle cx="72" cy="50" r="2.4" fill="#222" />
          {/* Wiggly ghost tail along the lower body. */}
          <path
            d="M 36 92 Q 42 86 48 92 T 60 92 T 72 92 T 84 92"
            stroke="#ECF0F1"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 36 96 Q 42 92 48 96 T 60 96 T 72 96 T 84 96"
            stroke="#BDC3C7"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Spooky aura */}
          <ellipse cx="60" cy="58" rx="34" ry="32" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.3" />
        </g>
      );
    case 'phoenixcat':
      return (
        <g>
          {/* Flame wings flaring out from the sides. */}
          <path
            d="M 24 40 Q 8 48 14 64 Q 20 56 30 56 Q 22 50 24 40 Z"
            fill="#F39C12"
            stroke="#922B21"
            strokeWidth="1.2"
          />
          <path
            d="M 96 40 Q 112 48 106 64 Q 100 56 90 56 Q 98 50 96 40 Z"
            fill="#F39C12"
            stroke="#922B21"
            strokeWidth="1.2"
          />
          <path
            d="M 24 44 Q 14 50 18 60 M 96 44 Q 106 50 102 60"
            stroke="#F9E79F"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Burning crest on top of head. */}
          <path d="M 50 14 Q 52 2 56 12 Q 58 4 60 10 Q 62 2 66 12 Q 68 4 72 14 Z"
            fill="#F39C12" stroke="#E74C3C" strokeWidth="1" />
          <path d="M 54 10 Q 60 4 66 10" stroke="#F9E79F" strokeWidth="0.8" fill="none" />
          {/* Tail on fire — ember dots */}
          <circle cx="100" cy="56" r="2" fill="#F9E79F" />
          <circle cx="106" cy="50" r="1.6" fill="#FADBD8" opacity="0.85" />
          <circle cx="14" cy="56" r="2" fill="#F9E79F" />
        </g>
      );
    case 'tidekatt':
      return (
        <g>
          {/* Wave curls cresting along the back. */}
          <path
            d="M 30 38 Q 36 30 42 38 T 54 38 T 66 38 T 78 38 T 90 38"
            stroke="#85C1E9"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 30 42 Q 36 36 42 42 T 54 42 T 66 42 T 78 42 T 90 42"
            stroke="#FDFEFE"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Water droplets falling */}
          <path d="M 38 78 Q 38 84 40 86 Q 42 84 42 78 Z" fill="#5DADE2" />
          <path d="M 60 86 Q 60 92 62 94 Q 64 92 64 86 Z" fill="#85C1E9" />
          <path d="M 80 78 Q 80 84 82 86 Q 84 84 84 78 Z" fill="#5DADE2" />
          {/* Droplet highlight */}
          <circle cx="40" cy="81" r="0.8" fill="#FDFEFE" opacity="0.9" />
          <circle cx="62" cy="89" r="0.8" fill="#FDFEFE" opacity="0.9" />
        </g>
      );
    case 'thundercat':
      return (
        <g>
          {/* Storm cloud cluster crown */}
          <ellipse cx="50" cy="14" rx="9" ry="5" fill="#566573" />
          <ellipse cx="60" cy="10" rx="11" ry="6" fill="#34495E" />
          <ellipse cx="72" cy="14" rx="9" ry="5" fill="#566573" />
          {/* Large lightning bolt centered. */}
          <path
            d="M 60 16 L 54 30 L 60 30 L 56 44 L 68 28 L 62 28 L 66 16 Z"
            fill="#F4D03F"
            stroke="#1B2631"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Inner spark highlight */}
          <path d="M 60 22 L 58 28 L 61 28" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
          {/* Crackle on chest */}
          <path d="M 44 70 L 50 76 L 46 78 L 52 86" stroke="#F4D03F" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M 76 70 L 70 76 L 74 78 L 68 86" stroke="#F4D03F" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'cosmiccat':
      return (
        <g className="cosmic-cat-overlay">
          {/* Spiral galaxy painted on belly. */}
          <g transform="translate(60 80)" className="cosmic-galaxy">
            <circle cx="0" cy="0" r="13" fill="#1F0A3C" />
            <path
              d="M 0 -10 Q 9 -6 9 0 Q 9 6 0 7 Q -8 6 -8 0 Q -7 -4 -4 -4"
              stroke="#FF00FF"
              strokeWidth="1.5"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M 0 -7 Q 6 -4 6 0 Q 5 4 0 4"
              stroke="#DA70D6"
              strokeWidth="1"
              fill="none"
              opacity="0.8"
            />
            <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
            <circle cx="6" cy="-3" r="0.7" fill="#FFFFFF" />
            <circle cx="-5" cy="3" r="0.7" fill="#FFFFFF" />
            <circle cx="-3" cy="-6" r="0.6" fill="#FFFFFF" />
          </g>
          {/* Floating cosmic particles around the head (animated via CSS). */}
          <g className="cosmic-particles">
            <circle cx="24" cy="32" r="1.6" fill="#FF00FF" />
            <circle cx="32" cy="20" r="1.2" fill="#DA70D6" />
            <circle cx="46" cy="10" r="1.4" fill="#FFFFFF" />
            <circle cx="74" cy="10" r="1.2" fill="#FF00FF" />
            <circle cx="88" cy="20" r="1.6" fill="#DA70D6" />
            <circle cx="96" cy="32" r="1.2" fill="#FFFFFF" />
            <circle cx="20" cy="60" r="1.2" fill="#FF00FF" />
            <circle cx="100" cy="60" r="1.2" fill="#DA70D6" />
          </g>
          {/* Faint nebula veil over head */}
          <ellipse cx="60" cy="42" rx="32" ry="20" fill="#FF00FF" opacity="0.08" />
        </g>
      );
    default:
      return null;
  }
}
