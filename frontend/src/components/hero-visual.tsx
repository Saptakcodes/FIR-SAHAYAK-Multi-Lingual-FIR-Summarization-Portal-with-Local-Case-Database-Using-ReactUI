/**
 * HeroVisual — animated FIR review illustration.
 *
 * A case file is scanned, three fields check themselves off,
 * the magnifier pulses, and a VERIFIED stamp settles in.
 * Runs on a single 6-second loop. Navy + cream + gold palette.
 *
 * All class names are namespaced with `fs-` to avoid collisions.
 */
export function HeroVisual() {
  return (
    <>
      <style>{`
        .fs-visual-wrap{
          --fs-visual-size: 420px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 560px;
        }
        .fs-glow{
          position: absolute;
          width: calc(var(--fs-visual-size) * 1.24);
          height: calc(var(--fs-visual-size) * 1.24);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,161,91,0.16) 0%, rgba(200,161,91,0.06) 45%, rgba(200,161,91,0) 72%);
          animation: fs-pulse 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes fs-pulse{
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.045); opacity: .85; }
        }
        .fs-illustration{
          position: relative;
          width: var(--fs-visual-size);
          animation: fs-float 7s ease-in-out infinite;
        }
        @keyframes fs-float{
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }

        .fs-beam{ animation: fsBeam 6s ease-in-out infinite; }
        @keyframes fsBeam{
          0%   { opacity:0; transform: translateY(-10px); }
          4%   { opacity:1; }
          48%  { opacity:1; transform: translateY(210px); }
          53%  { opacity:0; transform: translateY(210px); }
          54%  { opacity:0; transform: translateY(-10px); }
          100% { opacity:0; transform: translateY(-10px); }
        }

        .fs-check-fill, .fs-check-mark{
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
        }
        #row1 .fs-check-fill, #row1 .fs-check-mark{ animation: fsCheck1 6s ease-in-out infinite; }
        #row2 .fs-check-fill, #row2 .fs-check-mark{ animation: fsCheck2 6s ease-in-out infinite; }
        #row3 .fs-check-fill, #row3 .fs-check-mark{ animation: fsCheck3 6s ease-in-out infinite; }

        @keyframes fsCheck1{
          0%,18%  { opacity:0; transform: scale(.4); }
          22%     { opacity:1; transform: scale(1.15); }
          26%     { transform: scale(1); }
          90%     { opacity:1; transform: scale(1); }
          95%,100%{ opacity:0; transform: scale(.4); }
        }
        @keyframes fsCheck2{
          0%,25%  { opacity:0; transform: scale(.4); }
          29%     { opacity:1; transform: scale(1.15); }
          33%     { transform: scale(1); }
          90%     { opacity:1; transform: scale(1); }
          95%,100%{ opacity:0; transform: scale(.4); }
        }
        @keyframes fsCheck3{
          0%,31%  { opacity:0; transform: scale(.4); }
          35%     { opacity:1; transform: scale(1.15); }
          39%     { transform: scale(1); }
          90%     { opacity:1; transform: scale(1); }
          95%,100%{ opacity:0; transform: scale(.4); }
        }

        .fs-lens{
          transform-box: fill-box;
          transform-origin: center;
          animation: fsLens 6s ease-in-out infinite;
        }
        @keyframes fsLens{
          0%,50%  { transform: scale(1); }
          58%     { transform: scale(1.08); }
          66%     { transform: scale(1); }
          100%    { transform: scale(1); }
        }

        .fs-stamp{
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: fsStamp 6s ease-in-out infinite;
        }
        @keyframes fsStamp{
          0%,60%  { opacity:0; transform: rotate(-14deg) scale(.5) translateY(-8px); }
          68%     { opacity:1; transform: rotate(-14deg) scale(1.08) translateY(0px); }
          74%     { transform: rotate(-14deg) scale(1) translateY(0px); }
          92%     { opacity:1; transform: rotate(-14deg) scale(1) translateY(0px); }
          97%,100%{ opacity:0; transform: rotate(-14deg) scale(.5) translateY(-8px); }
        }

        @media (prefers-reduced-motion: reduce){
          .fs-glow, .fs-illustration, .fs-beam, .fs-check-fill, .fs-check-mark, .fs-lens, .fs-stamp{
            animation: none;
          }
        }
      `}</style>

      <div className="fs-visual-wrap">
        <div className="fs-glow"></div>
        <div className="fs-illustration">
          <svg
            viewBox="0 0 420 480"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Illustration of a case file being scanned, checked off, and verified"
          >
            <defs>
              <clipPath id="docClip">
                <rect x="116" y="92" width="188" height="248" rx="7" />
              </clipPath>
              <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8c98a" stopOpacity="0" />
                <stop offset="50%" stopColor="#dcae64" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#e8c98a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ecd7a8" />
                <stop offset="100%" stopColor="#b3833f" />
              </linearGradient>
              <linearGradient id="shieldWash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fffdf8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e9dfc7" stopOpacity="0.35" />
              </linearGradient>
              <radialGradient id="lensGlass" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#fbf9f4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fbf9f4" stopOpacity="0.05" />
              </radialGradient>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#16283f" strokeWidth="1" />
              </pattern>
              <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#16283f" floodOpacity="0.18" />
              </filter>
              <filter id="tinyShadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#16283f" floodOpacity="0.22" />
              </filter>
            </defs>

            <ellipse cx="212" cy="420" rx="118" ry="11" fill="#16283f" opacity="0.08" />

            <g filter="url(#softShadow)">
              <path
                d="M212 34 L324 74 V198 C324 280 278 340 212 370 C146 340 100 280 100 198 V74 Z"
                fill="url(#shieldWash)"
                stroke="#16283f"
                strokeWidth="2.4"
              />
            </g>
            <path
              d="M212 34 L324 74 V198 C324 280 278 340 212 370 C146 340 100 280 100 198 V74 Z"
              fill="url(#hatch)"
              opacity="0.05"
            />
            <path
              d="M212 54 L306 88 V196 C306 266 266 318 212 344 C158 318 118 266 118 196 V88 Z"
              fill="none"
              stroke="#16283f"
              strokeWidth="1"
              strokeOpacity="0.22"
            />
            <circle cx="212" cy="34" r="4.2" fill="url(#goldGrad)" stroke="#16283f" strokeWidth="1" />

            <g transform="rotate(-7 212 220)">
              <rect x="124" y="98" width="172" height="228" rx="7" fill="#f7f3ea" stroke="#16283f" strokeWidth="2" />
            </g>

            <g filter="url(#tinyShadow)">
              <path
                d="M116 99 C116 95.1 119.1 92 123 92 H281 L304 115 V333 C304 336.9 300.9 340 297 340 H123 C119.1 340 116 336.9 116 333 Z"
                fill="#fdfbf6"
                stroke="#16283f"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M281 92 L281 111 C281 113.2 282.8 115 285 115 L304 115 Z"
                fill="#eee6d2"
                stroke="#16283f"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </g>

            <g transform="translate(150,86) rotate(-8)" fill="none" stroke="#16283f" strokeWidth="2.4" strokeLinecap="round">
              <path d="M0 0 C0 -10 16 -10 16 0 V26 C16 33 6 33 6 26 V6" />
            </g>

            <line x1="138" y1="128" x2="238" y2="128" stroke="#16283f" strokeWidth="3" strokeLinecap="round" />
            <text
              x="138"
              y="146"
              fontFamily="'Courier New', monospace"
              fontSize="9.5"
              letterSpacing="0.5"
              fill="#16283f"
              fillOpacity="0.55"
            >
              FIR NO. 2024-0568
            </text>

            <g className="fs-row" id="row1" transform="translate(138,178)">
              <circle className="fs-check-ring" cx="6" cy="0" r="7.2" fill="none" stroke="#16283f" strokeWidth="1.6" />
              <circle className="fs-check-fill" cx="6" cy="0" r="7.2" fill="url(#goldGrad)" stroke="#16283f" strokeWidth="1.4" />
              <path className="fs-check-mark" d="M3 0l2 2 4-4" stroke="#16283f" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="22" y1="0" x2="150" y2="0" stroke="#16283f" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
            </g>
            <g className="fs-row" id="row2" transform="translate(138,206)">
              <circle className="fs-check-ring" cx="6" cy="0" r="7.2" fill="none" stroke="#16283f" strokeWidth="1.6" />
              <circle className="fs-check-fill" cx="6" cy="0" r="7.2" fill="url(#goldGrad)" stroke="#16283f" strokeWidth="1.4" />
              <path className="fs-check-mark" d="M3 0l2 2 4-4" stroke="#16283f" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="22" y1="0" x2="124" y2="0" stroke="#16283f" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
            </g>
            <g className="fs-row" id="row3" transform="translate(138,234)">
              <circle className="fs-check-ring" cx="6" cy="0" r="7.2" fill="none" stroke="#16283f" strokeWidth="1.6" />
              <circle className="fs-check-fill" cx="6" cy="0" r="7.2" fill="url(#goldGrad)" stroke="#16283f" strokeWidth="1.4" />
              <path className="fs-check-mark" d="M3 0l2 2 4-4" stroke="#16283f" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="22" y1="0" x2="142" y2="0" stroke="#16283f" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
            </g>
            <g stroke="#16283f" strokeLinecap="round">
              <g transform="translate(138,262)">
                <circle cx="6" cy="0" r="7.2" fill="none" strokeWidth="1.6" strokeOpacity="0.3" />
                <line x1="22" y1="0" x2="108" y2="0" strokeWidth="2" strokeOpacity="0.22" />
              </g>
              <g transform="translate(138,290)">
                <circle cx="6" cy="0" r="7.2" fill="none" strokeWidth="1.6" strokeOpacity="0.3" />
                <line x1="22" y1="0" x2="132" y2="0" strokeWidth="2" strokeOpacity="0.22" />
              </g>
            </g>

            <g clipPath="url(#docClip)">
              <rect className="fs-beam" x="116" y="90" width="188" height="52" fill="url(#beamGrad)" />
            </g>

            <g transform="translate(150,300)">
              <g className="fs-stamp">
                <circle cx="0" cy="0" r="29" fill="none" stroke="#a9762f" strokeWidth="2.4" />
                <circle cx="0" cy="0" r="23.5" fill="none" stroke="#a9762f" strokeWidth="1" />
                <path
                  d="M-8 -7 l4.5 4.5 9-9"
                  stroke="#a9762f"
                  strokeWidth="2.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(0,-6)"
                />
                <text
                  x="0"
                  y="15"
                  fontFamily="Arial, sans-serif"
                  fontSize="6.4"
                  fill="#a9762f"
                  letterSpacing="1.1"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  VERIFIED
                </text>
              </g>
            </g>

            <g transform="translate(262,296)" filter="url(#tinyShadow)">
              <g className="fs-lens">
                <circle cx="0" cy="0" r="32" fill="url(#lensGlass)" stroke="#16283f" strokeWidth="3.4" />
                <circle cx="0" cy="0" r="32" fill="none" stroke="url(#goldGrad)" strokeWidth="1.6" strokeOpacity="0.9" />
                <line x1="-10" y1="-14" x2="-2" y2="-22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                <line x1="22.5" y1="22.5" x2="47" y2="47" stroke="#16283f" strokeWidth="7" strokeLinecap="round" />
                <line x1="22.5" y1="22.5" x2="47" y2="47" stroke="url(#goldGrad)" strokeWidth="2.4" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </>
  );
}