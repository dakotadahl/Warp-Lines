# Why PNG Works with CDN but Breaks with Local JSON

## Summary

The PNG works correctly when using `data-us-project="VmyOwEsJx4suY5wPrhyY"` (CDN) but breaks when using `data-us-project-src="alluvium_home_hero.json"` (local JSON) due to **three critical mismatches** between the shader code and the actual image.

## Key Differences

### 1. **Image Source Path**

**CDN (Working):**
- `src: "https://assets.unicorn.studio/images/I6HHPx7fHUeZPANbA8IDUkbUtR43/flat%20lines@3x_v2.png"`
- Full HTTPS URL with proper CORS headers
- Image served from Unicorn Studio's CDN

**Local JSON (Broken):**
- `src: "flat-lines-3x-v2.png"`
- Relative path that must resolve correctly
- Image served from localhost:8000

**Status:** ✅ This works - the image loads successfully

---

### 2. **Image Dimensions Mismatch**

**CDN (Working):**
- `imageNaturalSize: {_x: 5056, _y: 8211}` (original size)
- Shader uses: `vec2(5056, 8211)` in `apply3DRotation()`
- **MATCH** ✅ - Shader dimensions match actual image dimensions

**Local JSON (Broken):**
- `imageNaturalSize: {_x: 2522, _y: 4096}` (resized to fit WebGL limits)
- Shader uses: `vec2(2522, 4096)` (we updated this)
- **MATCH** ✅ - But wait, let's check the actual file...

**Current Local Image File:**
- Actual dimensions: 2522 × 4096 (resized)
- JSON says: 2522 × 4096
- Shader says: vec2(2522, 4096)

**Status:** ✅ Should match now, but let's verify the original issue

---

### 3. **The Root Cause: Shader Hardcoded Dimensions**

The shader code has **hardcoded image dimensions** in the `apply3DRotation()` function:

```glsl
imageUV = apply3DRotation(imageUV, vec2(0.5), vec2(5056, 8211), ...);
//                                                      ^^^^^^  ^^^^^^
//                                              These are HARDCODED!
```

**Why This Breaks:**

1. When the image is resized from 5056×8211 to 2522×4096, the shader still calculates UV coordinates as if the image is 5056×8211
2. This causes the shader to sample texture coordinates outside the actual texture bounds (0.0-1.0 range)
3. When UV coordinates are out of bounds, the shader returns `vec4(0.0)` (transparent), making the image invisible

**The Fix:**
- Update the shader to use the new dimensions: `vec2(2522, 4096)`
- ✅ We did this, but there might be other issues

---

## Why CDN Works

1. **Original image size preserved**: CDN serves the original 5056×8211 image
2. **Shader matches image**: Shader expects 5056×8211, image is 5056×8211 ✅
3. **Proper CORS headers**: CDN images have correct CORS for WebGL texture loading
4. **No path resolution issues**: Full HTTPS URL works everywhere

---

## Why Local JSON Breaks

### Issue #1: Image Size Mismatch (Original Problem)
- We resized the image to 2522×4096 to fit WebGL texture limits
- But the shader still had `vec2(5056, 8211)` hardcoded
- **Fix:** Update shader to `vec2(2522, 4096)` ✅ (we did this)

### Issue #2: Path Resolution
- Local path `"flat-lines-3x-v2.png"` must resolve relative to JSON file location
- Unicorn Studio might resolve it differently than expected
- **Status:** Image loads (Network tab confirms), so this works ✅

### Issue #3: CORS for WebGL Textures
- WebGL has stricter CORS requirements than regular image loading
- Even if the image loads via fetch, WebGL texture creation might fail
- **Possible issue:** Local images might not have proper CORS headers

### Issue #4: Texture Loading Timing
- Unicorn Studio might load CDN images differently (pre-cached, optimized)
- Local images might load asynchronously, causing timing issues
- **Possible issue:** Texture created before image fully loads

---

## Recommended Solution

To make local JSON work correctly:

1. **Keep original image size** (if GPU supports it):
   - Don't resize the image
   - Keep shader dimensions as `vec2(5056, 8211)`
   - Use original CDN URL or ensure local image is exact same size

2. **OR update everything consistently**:
   - Resize image to 2522×4096 ✅
   - Update `imageNaturalSize` to 2522×4096 ✅
   - Update shader `vec2()` to 2522×4096 ✅
   - Ensure all three match exactly

3. **Use full URL for local image**:
   - Instead of `"flat-lines-3x-v2.png"`
   - Use `"http://localhost:8000/flat-lines-3x-v2.png"`
   - This ensures proper path resolution

4. **Check WebGL texture loading**:
   - Verify texture is actually created (check WebGL context)
   - Check for CORS errors in console
   - Ensure image loads before texture creation

---

## Current Status

✅ **Image loads**: Network tab confirms successful load
✅ **Dimensions match**: JSON, shader, and file all say 2522×4096
❓ **Still not visible**: Likely a CORS or texture binding issue

**Next steps to debug:**
1. Check browser console for WebGL errors
2. Verify texture is bound to correct sampler unit
3. Check if UV coordinates are being calculated correctly
4. Test with original-size image to rule out size issues
