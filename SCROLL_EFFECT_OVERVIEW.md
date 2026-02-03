# Scroll Transition Effect Overview

## How the Scroll Transition Effect Works

This document explains the scroll transition effect in `src/Homepage/index-gsap.html`, covering the logic, animation timing, and interactive inputs.

> **Note:** As of January 2026, the animation system uses GSAP for all animations. The scroll-triggered convergence can be added using GSAP's ScrollTrigger plugin.

---

## 1. Architecture Overview

The line field animation is built on GSAP (GreenSock Animation Platform):

```javascript
// GSAP is loaded via CDN
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

// Ticker-based render loop
gsap.ticker.add(render);
gsap.ticker.fps(60);
```

---

## 2. Point Animation System

Each point has multiple offset properties animated by GSAP:

```javascript
const point = { 
  x: canvasX,              // Current rendered position
  y,
  targetX: canvasX,        // Target position
  targetY: y,
  ambientOffsetX: 0,       // GSAP-animated ambient drift
  ambientOffsetY: 0,
  dragOffsetX: 0,          // GSAP-animated drag effect
  dragOffsetY: 0
};
```

---

## 3. Ambient Animations (GSAP Timelines)

Ambient movement is handled by repeating GSAP tweens:

```javascript
// Horizontal drift
gsap.to(point, {
  ambientOffsetX: CONFIG.driftAmplitude,
  duration: 4 + Math.random() * 2,
  ease: "sine.inOut",
  yoyo: true,
  repeat: -1,
  delay: lineIndex * 0.005 + pointIndex * 0.002
});

// Vertical flow
gsap.to(point, {
  ambientOffsetY: CONFIG.verticalFlow * 0.5,
  duration: 5.2,
  ease: "sine.inOut",
  yoyo: true,
  repeat: -1
});
```

**Key Features:**
- **Yoyo**: Animates back and forth continuously
- **Staggered delays**: Creates wave-like motion across lines
- **Organic noise**: Perlin noise still adds natural variation

---

## 4. Drag/Wake Effects (GSAP Tweens)

When the cursor moves near points, drag effects are applied:

```javascript
// Drag effect with elastic return
gsap.to(point, {
  dragOffsetX: targetDragX,
  dragOffsetY: targetDragY,
  duration: 0.3,
  ease: "power2.out",
  onComplete: () => {
    gsap.to(point, {
      dragOffsetX: 0,
      dragOffsetY: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)"  // Springy return
    });
  }
});
```

**Drag Calculation:**
```javascript
if (distSquared < CONFIG.wakeLengthSquared && hasVelocity) {
  const dist = Math.sqrt(distSquared);
  const distFalloff = Math.pow(1 - dist / CONFIG.wakeLength, 2);
  const strength = (baseStrength * velFactor + velMag * dragStrength) * distFalloff;
  
  // GSAP animates to target offset, then springs back
}
```

---

## 5. Interactive Inputs

### Mouse/Touch Tracking

```javascript
function handleMouseMove(e) {
  targetMouse.x = e.clientX;
  targetMouse.y = e.clientY;
}

// Smooth interpolation in render loop
mouse.x += (targetMouse.x - mouse.x) * 0.12;
mouse.y += (targetMouse.y - mouse.y) * 0.12;
```

### Mouse Leave Animation

```javascript
function handleMouseLeave() {
  gsap.to(targetMouse, {
    x: -1000,
    y: -1000,
    duration: 0.3,
    ease: "power2.out"
  });
}
```

---

## 6. Adding Scroll-Triggered Convergence

To add scroll-driven line convergence, use ScrollTrigger:

```javascript
// Example: Scroll-triggered convergence (not yet implemented)
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "+=150%",
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress;
    updateConvergence(progress);
  }
});

function updateConvergence(scrollProgress) {
  // Apply exponential easing for dramatic snap
  const easedProgress = Math.pow(scrollProgress, 20);
  
  lines.forEach((line, lineIndex) => {
    const horizontalDist = Math.abs(line.normalizedX - 0.5) * 2;
    const staggerDelay = horizontalDist * 0.4;
    const staggeredProgress = Math.max(0, (easedProgress - staggerDelay) / (1 - staggerDelay));
    
    line.points.forEach((point, pointIndex) => {
      const rest = line.restPoints[pointIndex];
      const verticalProgress = rest.normalizedY;
      const curveFactor = Math.pow(verticalProgress, 1.2);
      const convergeFactor = staggeredProgress * curveFactor;
      
      // Animate toward vanishing point
      gsap.to(point, {
        targetX: rest.x + (vanishingPoint.x - rest.x) * convergeFactor,
        targetY: rest.y + (vanishingPoint.y - rest.y) * convergeFactor,
        duration: 0.1,
        ease: "none"
      });
    });
  });
}
```

---

## 7. Visual Effects

### Ambient Noise

Perlin noise adds organic movement even with GSAP:

```javascript
const noiseVal = noise(
  normalizedX * 3 + time * CONFIG.noiseTimeScale,
  rest.normalizedY * 2 + timeNoiseY
);

ambientX += noiseVal * CONFIG.noiseAmplitude * ambientScale;
```

### Wave Influence

Neighboring lines influence each other:

```javascript
if (prevLine && nextLine) {
  neighborInfluenceX = ((prevPoint.x - rest.x) + (nextPoint.x - rest.x)) * CONFIG.waveInfluence * 0.5;
}
```

---

## Summary

**GSAP-Powered Animation:**
- Ticker-based render loop (60fps)
- Timeline animations for ambient effects
- Tween-based drag effects with elastic return

**Interactive Elements:**
- Mouse/touch tracking with interpolation
- Velocity-based drag strength
- Neighboring line wave influence

**Future Scroll Convergence:**
- ScrollTrigger ready for implementation
- Exponential easing for dramatic "snap" effect
- Staggered timing for outer lines
- Vertical bias for perspective

---

**Last Updated:** January 2026  
**Animation Engine:** GSAP 3.12.5
