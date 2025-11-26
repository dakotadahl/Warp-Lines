# Scroll Transition Effect Overview

## How the Scroll Transition Effect Works

This document explains the scroll transition effect in `Homepage/line-field.html`, covering the logic, animation timing, and interactive inputs.

---

## 1. Scroll Progress Calculation (Lines 159-162)

The scroll progress is the core driver of the convergence animation:

```javascript
window.addEventListener('scroll', function() {
  var rawProgress = Math.min(window.scrollY / (CONFIG.scrollConvergeDistance * height / 100), 1);
  scrollProgress = Math.pow(rawProgress, 20);
});
```

**Key Points:**
- **`rawProgress`**: Normalized scroll position (0 to 1) based on `scrollConvergeDistance` (150% of viewport height)
- **`scrollProgress`**: Uses `Math.pow(rawProgress, 20)` to create a very steep exponential curve
- **Effect**: Most convergence happens in the final portion of the scroll, creating a dramatic "snap" effect

---

## 2. Convergence Logic (Lines 84-93)

Each point on each line converges toward a vanishing point:

```javascript
const verticalProgress = rest.y / height;  // How far down the point is (0-1)
const horizontalDist = Math.abs(rest.x - vanishingPoint.x) / (width / 2);
const staggerDelay = horizontalDist * 0.4;  // Lines further from center start later
const staggeredProgress = Math.max(0, (scrollProgress - staggerDelay) / (1 - staggerDelay));
```

**Staggered Animation:**
- Lines further from center have higher `staggerDelay` (up to 0.4)
- `staggeredProgress` delays convergence for outer lines, creating a wave effect
- This prevents all lines from converging simultaneously

**Convergence Calculation:**
```javascript
const curveFactor = Math.pow(verticalProgress, 1.2);  // Bottom points converge more
const convergeFactor = staggeredProgress * curveFactor;
const convergedX = rest.x + (vanishingPoint.x - rest.x) * Math.min(convergeFactor * 2, 1);
const convergedY = rest.y + (vanishingPoint.y - rest.y) * Math.min(yConvergeFactor * 2, 1);
```

**Key Components:**
- **`curveFactor`**: Higher for bottom points (exponent 1.2 creates slight curve)
- **`convergeFactor * 2`**: Multiplier speeds up convergence (capped at 1.0)
- **Interpolation formula**: `start + (target - start) * amount` ensures smooth movement toward vanishing point

---

## 3. Animation Timing and Easing (Lines 119-121)

Points smoothly ease toward their target positions:

```javascript
const diffX = targetX - point.x, diffY = targetY - point.y;
const easeFactor = 0.002 + Math.min(Math.sqrt(diffX * diffX + diffY * diffY) / 800, 0.02);
point.x += diffX * easeFactor; point.y += diffY * easeFactor;
```

**Easing Characteristics:**
- **Dynamic easing**: `easeFactor` increases with distance (0.002 to 0.02)
- **Smooth interpolation**: Points move a small fraction of distance each frame
- **Frame rate**: Uses `requestAnimationFrame` for smooth 60fps updates

---

## 4. Interactive Inputs

### Mouse/Touch Tracking (Lines 75-78, 155-158)

```javascript
mouse.x += (targetMouse.x - mouse.x) * 0.12;  // Smooth mouse following
velocity.x += (mouse.x - prevMouse.x - velocity.x) * CONFIG.velocitySmoothing;
```

- **`targetMouse`**: Raw cursor position from events
- **`mouse`**: Smoothed position (lerp factor 0.12)
- **`velocity`**: Smoothed velocity for drag effects

### Ambient Effects (Lines 96-102)

```javascript
const noiseVal = noise(line.normalizedX * 3 + time * CONFIG.noiseTimeScale, ...);
const driftBase = Math.sin(line.normalizedX * Math.PI * 6 + time * CONFIG.driftSpeed * 1000) * CONFIG.driftAmplitude;
const ambientX = (noiseVal * CONFIG.noiseAmplitude + driftBase) * ambientScale * dirX * effectFade;
```

- **Perlin noise**: Adds organic, natural movement
- **Drift**: Sine wave creates subtle wave motion
- **Fades out**: As `scrollProgress` increases (`effectFade = 1 - scrollProgress`)

### Drag/Wake Effects (Lines 104-116)

```javascript
if (dist < CONFIG.wakeLength && velMag > 0.3 && effectFade > 0.01) {
  // Calculate drag strength based on velocity and distance
  dragOffsetX = blendedX * strength; dragOffsetY = blendedY * strength * 0.4;
}
```

- **Active when**: Cursor within `wakeLength` (120px) and moving (`velMag > 0.3`)
- **Strength**: Based on velocity magnitude and distance falloff
- **Fades out**: With scroll progress

---

## 5. Visual Effects

### Glow Effect (Lines 142-149)

```javascript
if (scrollProgress > 0.1) {
  const glowIntensity = Math.pow(scrollProgress, 2);
  const glowRadius = 150 + scrollProgress * 100;
  // Radial gradient at vanishing point
}
```

- **Appears**: When `scrollProgress > 0.1`
- **Intensity**: Quadratic curve (`scrollProgress^2`)
- **Radius**: Grows from 150px to 250px
- **Visual**: Radial gradient centered at vanishing point

---

## Summary

**Scroll Progress:**
- Exponential curve (`pow(20)`) concentrates convergence at the end
- Creates dramatic "snap" effect

**Staggered Timing:**
- Outer lines start converging later
- Creates wave-like animation

**Vertical Bias:**
- Bottom points converge more aggressively
- Creates perspective effect

**Smooth Easing:**
- Dynamic easing based on distance
- Ensures smooth, natural movement

**Interactive Elements:**
- Mouse/touch adds ambient noise and drag effects
- Effects fade out as scrolling progresses

**Visual Feedback:**
- Glow intensifies as convergence progresses
- Provides visual cue for scroll state

The overall effect creates a smooth, staggered convergence toward a vanishing point, with interactive elements that fade as scrolling progresses.

