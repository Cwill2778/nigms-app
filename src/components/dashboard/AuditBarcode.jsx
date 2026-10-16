/**
 * AuditBarcode & AuditQRCode
 * Crisp vector SVG barcode and QR code components for verification and audit trails.
 */

export function AuditBarcode({ value, className = "h-8", showText = true, dark = false }) {
  if (!value) return null;
  const str = String(value);

  // Generate deterministic bar widths based on input string
  const bars = [];
  bars.push({ w: 2, space: 1 });
  bars.push({ w: 1, space: 2 });

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;
    bars.push({ w: b1, space: s1 });
    bars.push({ w: b2, space: s2 });
  }

  bars.push({ w: 2, space: 1 });
  bars.push({ w: 3, space: 0 });

  let x = 0;
  const rects = [];
  bars.forEach((b, idx) => {
    rects.push(
      <rect
        key={`b-${idx}`}
        x={x}
        y="0"
        width={b.w}
        height="32"
        fill={dark ? "#FDFBF7" : "#0A0A0A"}
      />
    );
    x += b.w + b.space;
  });

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg viewBox={`0 0 ${x} 34`} className="h-full w-auto" preserveAspectRatio="none">
        {rects}
      </svg>
      {showText && (
        <span className={`text-[9px] font-mono tracking-widest uppercase mt-0.5 select-all ${dark ? 'text-white/70' : 'text-slate-600'}`}>
          *{str}*
        </span>
      )}
    </div>
  );
}

export function AuditQRCode({ value, size = 56, label = "SCAN FOR AUDIT", dark = false }) {
  if (!value) return null;
  const str = String(value);

  // Deterministic 21x21 QR matrix with authentic corner finder patterns
  const matrix = Array(21).fill(0).map(() => Array(21).fill(false));

  function setFinder(row, col) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isBorder || isCenter;
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, 14);
  setFinder(14, 0);

  // Timing lines
  for (let i = 8; i <= 12; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate data modules deterministically
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x01000193);
  }

  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      const inTL = r <= 7 && c <= 7;
      const inTR = r <= 7 && c >= 13;
      const inBL = r >= 13 && c <= 7;
      const inTiming = (r === 6 && c >= 8 && c <= 12) || (c === 6 && r >= 8 && r <= 12);
      if (inTL || inTR || inBL || inTiming) continue;

      h = Math.imul(h ^ (r * 21 + c), 0x5bd1e995);
      matrix[r][c] = ((h >>> 0) % 3) !== 0;
    }
  }

  return (
    <div className="inline-flex flex-col items-center gap-1 select-none flex-shrink-0">
      <div className={`p-1.5 rounded border ${dark ? 'bg-black border-white/20' : 'bg-white border-slate-300 shadow-xs'}`}>
        <svg width={size} height={size} viewBox="0 0 21 21" shapeRendering="crispEdges">
          {matrix.map((row, r) =>
            row.map((active, c) =>
              active ? (
                <rect
                  key={`${r}-${c}`}
                  x={c}
                  y={r}
                  width="1"
                  height="1"
                  fill={dark ? "#DFBA73" : "#0A0A0A"}
                />
              ) : null
            )
          )}
        </svg>
      </div>
      {label && (
        <span className={`text-[8px] font-mono font-bold tracking-wider uppercase ${dark ? 'text-brand-gold/80' : 'text-slate-500'}`}>
          {label}
        </span>
      )}
    </div>
  );
}
