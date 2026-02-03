# Performance Audit & Improvement Plan
## Homepage line field (src/Homepage/index-gsap.html, Homepage/index-legacy.html)

**Date:** December 2024  
**File Size:** ~1,422 lines (all inline)  
**Estimated Impact:** High - This is a real-time animation application  
**Deployment Context:** Webflow Custom Code Section (embedded)

---

## 🌐 Webflow-Specific Considerations

**Important:** This code will be embedded in Webflow as a custom code section, which imposes specific constraints:

### Webflow Constraints:
- ✅ **Code must be inline** - Cannot use external CSS/JS files (Webflow custom code sections)
- ✅ **No build process** - Limited ability to use bundlers/minifiers (can minify before pasting)
- ✅ **No server control** - Cannot control compression, caching headers, etc.
- ✅ **Namespace isolation** - Must avoid conflicts with Webflow's scripts
- ✅ **Loading order** - Code executes within Webflow's page lifecycle
- ✅ **Size limits** - Webflow may have limits on custom code size
- ❌ **No service workers** - Cannot add service workers in custom code sections
- ❌ **Limited preload hints** - Cannot add `<head>` resources easily

### Webflow Performance Context:
- Webflow loads its own scripts (CMS, interactions, etc.)
- Page may have other animations/interactions running simultaneously
- Need to be mindful of Webflow's event system
- Should use `DOMContentLoaded` or ensure Webflow is ready

---

## 🔴 Critical Performance Issues

### 1. **Code Size & Minification (Webflow Constraint)**
**Issue:** All code is inline (required for Webflow), but it's not minified.
- **Impact:** Larger download size, slower parsing
- **Solution Priority:** HIGH
- **Estimated Improvement:** 20-30% reduction in parse time, smaller payload

**Webflow-Compatible Recommendations:**
- ✅ **Minify before pasting** - Use tools like Terser (JS) and cssnano (CSS) before adding to Webflow
- ✅ **Remove comments** - Strip all comments in production version
- ✅ **Remove console.log** - Critical for production (see issue #7)
- ✅ **Use IIFE wrapper** - Wrap code to avoid namespace conflicts: `(function(){ ... })();`
- ✅ **Compress whitespace** - Remove unnecessary whitespace
- ⚠️ **Note:** Webflow's CDN will gzip the HTML, but minification still helps with parse time

---

### 2. **Heavy Calculations in Animation Loop**
**Issue:** `updatePoints()` performs expensive calculations every frame:
- Nested loops: `lines.length × pointsPerLine` iterations (~280 lines × 60 points = 16,800 iterations/frame)
- Multiple `Math.sqrt()` calls per point (expensive)
- Noise function called twice per point
- Multiple DOM queries in render loop (`updateDevMode()`)

**Impact:** Can cause frame drops on lower-end devices
**Solution Priority:** HIGH

**Recommendations:**
- **Use `willReadFrequently: false`** for canvas context (already done ✓)
- **Batch DOM updates** - only update dev mode every N frames
- **Reduce noise calculations** - cache noise values, use lookup tables
- **Optimize distance calculations** - use squared distances where possible (already done ✓)
- **Consider Web Workers** for physics calculations (advanced)

---

### 3. **Event Listener Cleanup**
**Issue:** Event listeners should be cleaned up where possible:
- Use single targets where possible instead of duplicating on `window`, `document`, `body`
- Ensure any intervals/timeouts are cleared when no longer needed

**Impact:** Memory leaks, unnecessary CPU usage
**Solution Priority:** MEDIUM-HIGH

**Recommendations:**
- Consolidate event listeners to single target
- Use event delegation where possible
- Ensure all intervals/timeouts are cleared
- Use `AbortController` for better cleanup
- **Webflow-specific:** Use namespaced event handlers to avoid conflicts: `window.addEventListener('resize', myNamespace.handleResize)`
- **Webflow-specific:** Clean up on page navigation (Webflow uses SPA-like navigation)

---

### 4. **Canvas Rendering Optimizations Missing**
**Issue:** Canvas operations could be optimized further:
- `fillRect()` called every frame (necessary but could batch)
- `strokeStyle` and `lineWidth` set for every line (could batch)
- No frame rate limiting/throttling

**Impact:** Unnecessary GPU/CPU work
**Solution Priority:** MEDIUM

**Recommendations:**
- Batch canvas state changes (set strokeStyle once if all lines same color)
- Consider using `OffscreenCanvas` for heavy rendering (if browser support allows)
- Add frame rate limiting (cap at 60fps, reduce on low-end devices)
- Use `requestIdleCallback` for non-critical updates
- **Webflow-specific:** Pause animation when page is not visible (`document.hidden` or `visibilitychange` event)
- **Webflow-specific:** Reduce quality when Webflow interactions are active (detect via performance monitoring)

---

### 5. **Memory Management Concerns**
**Issue:** Potential memory leaks:
- Event listeners may not be removed in all code paths
- No cleanup on page unload

**Impact:** Memory usage grows over time
**Solution Priority:** MEDIUM

**Recommendations:**
- Add `beforeunload` handler to clean up listeners
- **Webflow-specific:** Add cleanup on Webflow page navigation (listen for `wf-page-loaded` or similar)
- Use `WeakMap` for event listener tracking
- Profile memory usage with Chrome DevTools
- **Webflow-specific:** Use IIFE to create isolated scope and prevent memory leaks from closures

---

## 🟡 Medium Priority Issues

### 6. **No Code Splitting / Conditional Loading**
**Issue:** All functionality loads immediately when the script runs.

**Impact:** Unnecessary JavaScript parsing/execution if only parts are needed
**Solution Priority:** MEDIUM

**Webflow-Compatible Recommendations:**
- ✅ **Feature flags** - Use early returns to skip unused code paths
- ⚠️ **Note:** Cannot use dynamic imports in Webflow, but can conditionally execute code blocks
- ✅ **Split logic** - Separate initialization from runtime (still inline, but organized)

---

### 7. **Console Logging in Production**
**Issue:** Extensive `console.log()` statements throughout code (50+ instances)

**Impact:** Performance overhead, exposes internal logic
**Solution Priority:** LOW-MEDIUM

**Recommendations:**
- ✅ **Remove all console.log** - Critical for Webflow production (50+ instances)
- ✅ **Use feature flag** - `const DEBUG = false; if (DEBUG) console.log(...)`
- ✅ **Minify removes dead code** - If using minifier, it can remove `if (false)` blocks
- ⚠️ **Webflow-specific:** Console logs can interfere with Webflow's own logging/debugging

---

### 8. **No Performance Monitoring**
**Issue:** No way to detect performance issues in production

**Impact:** Can't identify performance regressions
**Solution Priority:** LOW

**Recommendations:**
- Add FPS counter (dev mode only)
- Use `PerformanceObserver` to track frame times
- Log performance metrics to analytics

---

### 9. **Inefficient Noise Function**
**Issue:** Simplex noise implementation recalculates gradients every call

**Impact:** CPU-intensive calculations
**Solution Priority:** MEDIUM

**Recommendations:**
- Cache noise values for static coordinates
- Use WebGL shader for noise (if migrating to WebGL)
- Consider simpler noise function for real-time use

---

### 10. **No Adaptive Quality**
**Issue:** Same quality/performance regardless of device capabilities

**Impact:** Poor performance on low-end devices
**Solution Priority:** MEDIUM

**Recommendations:**
- Detect device capabilities (CPU cores, GPU, etc.)
- Reduce line count on low-end devices
- Reduce point count per line on low-end devices
- Lower frame rate cap on low-end devices

---

## 🟢 Low Priority / Nice to Have

### 11. **Webflow Integration & Namespace Conflicts**
**Issue:** Code may conflict with Webflow's global scope or event system

**Impact:** Potential bugs, performance issues from conflicts
**Solution Priority:** MEDIUM

**Recommendations:**
- ✅ **Use IIFE wrapper** - `(function(){ 'use strict'; ... })();` to isolate scope
- ✅ **Namespace variables** - Prefix with unique identifier: `const ALLUVIUM_CONFIG = {...}`
- ✅ **Check for conflicts** - Test that canvas ID doesn't conflict with Webflow elements
- ✅ **Wait for DOM** - Use `DOMContentLoaded` or ensure Webflow is ready before init
- ✅ **Avoid global pollution** - Don't add to `window` unless necessary

---

### 12. **No Deferred Initialization**
**Issue:** Animation starts immediately, even if page is still loading

**Impact:** Competes with Webflow's page load, slower initial render
**Solution Priority:** MEDIUM

**Webflow-Compatible Recommendations:**
- ✅ **Wait for page ready** - Initialize after Webflow page load: `window.addEventListener('wf-page-loaded', init)`
- ✅ **Use requestIdleCallback** - Start animation during idle time
- ✅ **Lazy start** - Only start animation when canvas is visible (IntersectionObserver)
- ✅ **Progressive enhancement** - Start with static state, then animate

---

### 13. **Webflow Page Navigation (SPA-like)**
**Issue:** Webflow uses AJAX navigation, code may not clean up properly

**Impact:** Memory leaks, multiple instances running
**Solution Priority:** MEDIUM

**Recommendations:**
- ✅ **Listen for navigation** - Clean up on `wf-page-loaded` or similar events
- ✅ **Check if already initialized** - Prevent double initialization
- ✅ **Cleanup function** - Create explicit cleanup and call on page unload
- ✅ **Singleton pattern** - Ensure only one instance exists

---

## 📊 Performance Metrics to Track

1. **First Contentful Paint (FCP)** - Target: < 1.5s
2. **Time to Interactive (TTI)** - Target: < 3.5s
3. **Frame Rate** - Target: 60fps (or adaptive)
4. **JavaScript Parse Time** - Target: < 100ms
5. **Memory Usage** - Monitor for leaks
6. **CPU Usage** - Should be < 30% on mid-range devices

---

## 🎯 Implementation Priority (Webflow-Optimized)

### Phase 1 (Quick Wins - 1-2 hours)
1. ✅ **Minify code** - Use Terser/cssnano before pasting into Webflow
2. ✅ **Remove all console.log** - Critical for production
3. ✅ **Add IIFE wrapper** - Isolate scope, prevent conflicts
4. ✅ **Batch DOM updates** - Throttle `updateDevMode()` calls
5. ✅ **Add namespace** - Prefix variables to avoid Webflow conflicts

### Phase 2 (Medium Impact - 2-4 hours)
6. ✅ **Optimize event listener management** - Consolidate, add cleanup
7. ✅ **Add frame rate limiting** - Cap at 60fps, adaptive on low-end
8. ✅ **Implement adaptive quality** - Reduce complexity on low-end devices
9. ✅ **Add Webflow integration** - Listen for page navigation, cleanup properly
10. ✅ **Pause when hidden** - Use `visibilitychange` to pause animation

### Phase 3 (Advanced - 4-8 hours)
11. ✅ **Optimize noise calculations** - Cache noise values
12. ✅ **Add performance monitoring** - Track FPS, detect issues
13. ✅ **Lazy initialization** - Start animation after page load/idle
14. ⚠️ **Web Workers** - Consider if browser support allows (may not work in all Webflow contexts)

---

## 🔧 Specific Code Optimizations (Webflow-Compatible)

### Webflow Integration Pattern
```javascript
// Wrap entire code in IIFE to isolate scope
(function() {
  'use strict';
  
  // Namespace all variables
  const ALLUVIUM = {
    canvas: null,
    ctx: null,
    // ... all code here
  };
  
  // Wait for Webflow to be ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Your initialization code
    ALLUVIUM.canvas = document.getElementById('canvas');
    // ...
  }
  
  // Initialize
  init();
  
  // Cleanup on Webflow page navigation (if needed)
  window.addEventListener('beforeunload', function() {
    // Cleanup code
  });
})();
```

### Optimization 1: Batch Canvas State Changes

### Optimization 1: Batch Canvas State Changes
```javascript
// Current: Sets strokeStyle for every line
function drawLine(points) {
  ctx.strokeStyle = strokeColor; // Set every time
  ctx.lineWidth = CONFIG.lineWidth;
  // ...
}

// Optimized: Set once before loop
function render(timestamp) {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = CONFIG.lineWidth;
  for (let i = 0; i < lines.length; i++) {
    drawLine(lines[i].points); // strokeStyle already set
  }
}
```

### Optimization 2: Throttle Dev Mode Updates
```javascript
let devModeFrameCount = 0;
function render(timestamp) {
  // ... existing code ...
  
  // Only update dev mode every 10 frames (6 times per second at 60fps)
  if (devModeFrameCount % 10 === 0) {
    updateDevMode();
  }
  devModeFrameCount++;
}
```

### Optimization 3: Reduce Math.sqrt Calls
```javascript
// Current: Multiple sqrt calls
const dist = Math.sqrt(distSquared);
const velMag = Math.sqrt(velMagSquared);

// Optimized: Cache sqrt results, use squared comparisons where possible
// (Already partially done, but can be improved further)
```

### Optimization 4: Frame Rate Limiting
```javascript
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function render(timestamp) {
  const elapsed = timestamp - lastFrameTime;
  
  if (elapsed >= frameInterval) {
    // ... existing render code ...
    lastFrameTime = timestamp - (elapsed % frameInterval);
  }
  
  requestAnimationFrame(render);
}
```

### Optimization 5: Webflow Page Visibility (Pause When Hidden)
```javascript
// Pause animation when page is hidden (saves CPU)
let isPaused = false;

document.addEventListener('visibilitychange', function() {
  isPaused = document.hidden;
  if (!isPaused) {
    // Resume animation
    requestAnimationFrame(render);
  }
});

function render(timestamp) {
  if (isPaused) return;
  // ... existing render code ...
  requestAnimationFrame(render);
}
```

---

## 📈 Expected Performance Improvements

| Optimization | Expected Improvement | Effort | Webflow Compatible |
|-------------|---------------------|--------|-------------------|
| Minify code | 20-30% parse time reduction | Low | ✅ Yes |
| Remove console.log | 2-5% runtime improvement | Low | ✅ Yes |
| IIFE wrapper | Prevents conflicts | Low | ✅ Yes |
| Batch DOM updates | 5-10% CPU reduction | Low | ✅ Yes |
| Optimize event listeners | 2-5% CPU reduction | Medium | ✅ Yes |
| Frame rate limiting | 10-20% CPU reduction | Low | ✅ Yes |
| Pause when hidden | 30-50% CPU when tab inactive | Low | ✅ Yes |
| Adaptive quality | 20-40% better on low-end | Medium | ✅ Yes |
| Noise optimization | 5-15% CPU reduction | Medium | ✅ Yes |
| Webflow integration | Prevents conflicts/leaks | Medium | ✅ Yes |
| **Total Potential** | **40-60% performance improvement** | - | ✅ All compatible |

---

## 🧪 Testing Recommendations

1. **Performance Testing:**
   - Use Chrome DevTools Performance tab
   - Test on low-end devices (throttle CPU in DevTools)
   - Monitor frame rate with FPS meter
   - Check memory usage over time

2. **Load Testing:**
   - Test initial page load time
   - Test with slow 3G connection
   - Test on various devices

3. **Memory Leak Testing:**
   - Run page for extended period
   - Monitor memory usage in DevTools
   - Check for growing arrays/objects

---

## 📝 Notes

- The code already has some good optimizations (squared distances, cached colors)
- Canvas context uses `alpha: false` which is good
- Consider migrating to WebGL for even better performance (major refactor)
- Current implementation is well-structured, making optimizations easier

### Webflow-Specific Notes:
- ✅ All optimizations are compatible with Webflow custom code sections
- ✅ Code must remain inline, but can be minified before pasting
- ✅ Use IIFE pattern to avoid namespace conflicts with Webflow
- ✅ Test thoroughly in Webflow preview and published site
- ✅ Monitor performance in Webflow's environment (may differ from standalone)
- ⚠️ Webflow's own scripts may impact performance - test with full page
- ⚠️ Webflow interactions may compete for resources - consider pausing animation during interactions

### Minification Tools for Webflow:
- **JavaScript:** [Terser](https://terser.org/) - `terser input.js -c -m -o output.js`
- **CSS:** [cssnano](https://cssnano.co/) - `cssnano input.css output.css`
- **Online:** [Minify.org](https://www.minifier.org/) or [JSCompress](https://jscompress.com/)
- **VS Code Extension:** "Minify" by HookyQR

### Webflow Deployment Checklist:
- [ ] Minify code before pasting into Webflow
- [ ] Remove all console.log statements
- [ ] Wrap code in IIFE
- [ ] Test in Webflow preview
- [ ] Test on published site
- [ ] Test on mobile devices
- [ ] Verify no conflicts with Webflow interactions
- [ ] Check performance in Webflow's environment

---

**Next Steps:**
1. Review this audit (especially Webflow-specific sections)
2. Prioritize optimizations based on your needs
3. Implement Phase 1 optimizations first (minify, remove logs, add IIFE)
4. Test in Webflow environment
5. Measure improvements
6. Continue with Phase 2 and 3
7. Final minified version ready for Webflow paste

