// NrXFitz — fist bump mark (100x100). `ink` draws the fists, `bg` cuts detail lines.
export function fistBump(ink = 'currentColor', bg = '#C8F135') {
  const fist = `
    <rect x="2" y="43" width="20" height="18" rx="4" fill="${ink}"/>
    <rect x="17" y="33" width="31" height="35" rx="10" fill="${ink}"/>
    <path d="M36 42.5h10M36 50.5h10M36 58.5h10" stroke="${bg}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M22 45c5-4 11-4 15 0" stroke="${bg}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path d="M18 61.5h4" stroke="${bg}" stroke-width="2.6" stroke-linecap="round"/>`;
  const burst = `<g stroke="${ink}" stroke-width="3.6" stroke-linecap="round">
    <path d="M50 25v-9M41 28l-4-7M59 28l4-7M50 75v9M41 72l-4 7M59 72l4 7"/></g>`;
  return `<g>${fist}</g><g transform="translate(100 0) scale(-1 1)">${fist}</g>${burst}`;
}
export const LOGO_SVG = (ink, bg) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${fistBump(ink, bg)}</svg>`;
