const STAR_COUNT = 88;
const MIN_STAR_DISTANCE = 0.006;
const MAX_PLACEMENT_ATTEMPTS = 6000;
const MID_STAR_INDEXES = new Set([8, 26, 41, 55, 64, 70, 77, 86]);
const BRIGHT_STAR_INDEXES = new Set([19, 47, 83]);
const TWINKLE_STAR_INDEXES = new Set([4, 20, 34, 46, 68, 81]);

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function starDistance(a, b) {
  const x = (a.x - b.x) * (5 / 3);
  const y = a.y - b.y;
  return Math.hypot(x, y);
}

function createStarPositions(random) {
  const positions = [];
  let attempts = 0;

  while (positions.length < STAR_COUNT && attempts < MAX_PLACEMENT_ATTEMPTS) {
    attempts += 1;

    const candidate = {
      x: 0.018 + random() * 0.964,
      y: 0.024 + random() * 0.952,
    };

    // Keep the identity column quieter without carving out an obvious rectangle.
    const crossesCopyField = candidate.x < 0.47 && candidate.y > 0.13 && candidate.y < 0.86;
    if (crossesCopyField && random() < 0.44) continue;

    // Reject only near-overlapping cores. The loose threshold intentionally
    // preserves the clusters and empty pockets produced by uniform randomness.
    const hasRoom = positions.every(
      (position) => starDistance(position, candidate) >= MIN_STAR_DISTANCE,
    );

    if (hasRoom) positions.push(candidate);
  }

  return positions;
}

function createStars() {
  const random = mulberry32(0x127667);

  return createStarPositions(random).map((position, index) => {
    const isMid = MID_STAR_INDEXES.has(index);
    const isBright = BRIGHT_STAR_INDEXES.has(index);
    const isTwinkling = TWINKLE_STAR_INDEXES.has(index);
    const isCool = random() > 0.66;
    let size = 0.64 + random() * 0.34;
    let opacity = 0.5 + random() * 0.3;

    if (isMid) {
      size = 1 + random() * 0.16;
      opacity = 0.7 + random() * 0.16;
    }

    if (isBright) {
      size = 1.18 + random() * 0.1;
      opacity = 0.9 + random() * 0.06;
    }

    return {
      id: `star-${index}`,
      x: position.x * 100,
      y: position.y * 100,
      size,
      opacity,
      color: isCool ? "164 191 215" : "226 237 247",
      isBright,
      isTwinkling,
      haloSize: 5 + random() * 2,
      twinkleLowOpacity: isTwinkling ? Math.max(0.36, opacity - 0.16) : null,
      twinkleDuration: 9 + random() * 6,
      twinkleDelay: -(random() * 15),
    };
  });
}

const STARS = createStars();

export default function StarField() {
  return (
    <div className="hero__starfield" aria-hidden="true">
      {STARS.map((star) => (
        <span
          key={star.id}
          className={[
            "hero__star",
            star.isBright ? "hero__star--bright" : "",
            star.isTwinkling ? "hero__star--twinkle" : "",
          ].filter(Boolean).join(" ")}
          style={{
            "--star-x": `${star.x.toFixed(3)}%`,
            "--star-y": `${star.y.toFixed(3)}%`,
            "--star-size": `${star.size.toFixed(2)}px`,
            "--star-opacity": star.opacity.toFixed(3),
            "--star-color": star.color,
            "--star-halo-size": `${star.haloSize.toFixed(2)}px`,
            "--star-twinkle-low": star.twinkleLowOpacity?.toFixed(3),
            "--star-twinkle-duration": `${star.twinkleDuration.toFixed(2)}s`,
            "--star-twinkle-delay": `${star.twinkleDelay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
