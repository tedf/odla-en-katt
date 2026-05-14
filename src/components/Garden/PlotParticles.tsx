/**
 * PlotParticles — per-plot ambient particles that match the growing
 * cat's species. Pure CSS animation; no canvas. Renders 6–8 absolutely
 * positioned dots inside the plot card while the plot is growing.
 */

import type { CSSProperties } from 'react';
import { CAT_TYPES, type CatTypeId } from '../../domain/catTypes';

interface PlotParticlesProps {
  catTypeId: CatTypeId;
}

interface ParticleStyle {
  variant: string;
  count: number;
  baseSize: number;
}

/**
 * Different cat species emit visually different particles. Variants map
 * to CSS class suffixes (e.g., `plot-particle--ember`).
 */
function styleFor(catTypeId: CatTypeId): ParticleStyle {
  switch (catTypeId) {
    case 'graskatt':
    case 'bamboukatt':
      return { variant: 'grass', count: 7, baseSize: 5 };
    case 'morotskatt':
      return { variant: 'spark', count: 7, baseSize: 4 };
    case 'blabarskatt':
    case 'lavendercat':
      return { variant: 'blob', count: 6, baseSize: 6 };
    case 'jordgubbskatt':
    case 'honeycat':
      return { variant: 'spark', count: 7, baseSize: 5 };
    case 'kokosnotkatt':
    case 'citruskatt':
      return { variant: 'spark', count: 7, baseSize: 4 };
    case 'isbjornkatt':
      return { variant: 'snow', count: 8, baseSize: 4 };
    case 'vulkankatt':
    case 'drakkatt':
    case 'phoenixcat':
      return { variant: 'ember', count: 8, baseSize: 5 };
    case 'crystalcat':
      return { variant: 'diamond', count: 7, baseSize: 5 };
    case 'ghostcat':
      return { variant: 'wisp', count: 7, baseSize: 6 };
    case 'regnbagskatt':
      return { variant: 'rainbow', count: 7, baseSize: 5 };
    case 'tidekatt':
      return { variant: 'droplet', count: 7, baseSize: 5 };
    case 'stjarnkatt':
    case 'enhornigskatt':
      return { variant: 'star', count: 7, baseSize: 5 };
    case 'thundercat':
      return { variant: 'spark', count: 7, baseSize: 5 };
    case 'rymkatt':
      return { variant: 'cosmic', count: 8, baseSize: 5 };
    case 'cosmiccat':
      return { variant: 'cosmic', count: 8, baseSize: 6 };
    default:
      return { variant: 'spark', count: 6, baseSize: 4 };
  }
}

export function PlotParticles({ catTypeId }: PlotParticlesProps) {
  const cat = CAT_TYPES[catTypeId];
  if (!cat) return null;
  const { variant, count, baseSize } = styleFor(catTypeId);
  const hasShootingStar = catTypeId === 'rymkatt' || catTypeId === 'cosmiccat';

  return (
    <div className="plot-particles" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const style: CSSProperties & Record<string, string> = {
          ['--particle-color']: cat.palette.accent,
          ['--particle-glow']: cat.palette.glow,
          ['--particle-body']: cat.palette.body,
          ['--particle-delay']: `${(i * 0.32).toFixed(2)}s`,
          ['--particle-x']: `${10 + i * (80 / count)}%`,
          ['--particle-size']: `${baseSize}px`,
          ['--particle-drift-x']: `${(i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 3)}px`,
        };
        return (
          <span
            key={i}
            className={`plot-particle plot-particle--${variant}`}
            style={style}
          />
        );
      })}
      {hasShootingStar && (
        <span className="plot-shooting-star" aria-hidden="true" />
      )}
    </div>
  );
}
