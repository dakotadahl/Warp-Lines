# Why Local JSON Breaks: Root Cause Analysis

## Summary

The image **loads successfully** (Network tab confirms 200 OK), but **doesn't render in WebGL** when using local JSON. The issue is **WebGL texture creation failing silently** due to CORS restrictions, even though the image file loads fine.

---

## The Problem: WebGL Texture CORS

### What Works (CDN)
1. ✅ Image loads from `https://assets.unicorn.studio/...`
2. ✅ Image has proper CORS headers from Unicorn Studio's CDN
3. ✅ WebGL can create texture from image (no CORS blocking)
4. ✅ Texture is bound and sampled correctly
5. ✅ **Image renders** ✅

### What Breaks (Local JSON)
1. ✅ Image loads from `http://localhost:8000/flat-lines-3x-v2.png`
2. ❌ **Image lacks proper CORS headers for WebGL**
3. ❌ WebGL texture creation fails (image becomes "tainted")
4. ❌ Texture is either not created or created as 1×1 transparent
5. ❌ **Image doesn't render** ❌

---

## Technical Details

### WebGL CORS Requirements

WebGL has **stricter CORS requirements** than regular image loading:

1. **Regular image loading** (for `<img>` tags):
   - Works fine from localhost
   - No CORS headers needed
   - Network tab shows 200 OK ✅

2. **WebGL texture loading** (for `texImage2D`):
   - Requires proper CORS headers
   - Without headers, image becomes "tainted"
   - Tainted images cannot be used in WebGL
   - **Fails silently** - no error in console

### Why It Fails Silently

When Unicorn Studio tries to create a WebGL texture from a local image:

```javascript
// Unicorn Studio's internal code (simplified)
const img = new Image();
img.src = 'flat-lines-3x-v2.png';  // ✅ Loads fine
img.onload = () => {
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  // ❌ This fails silently if image is tainted
  // Texture might be created as 1×1 transparent or not at all
};
```

**The texture creation fails, but:**
- No error is thrown
- No console warning
- The texture might be created as a 1×1 transparent pixel
- Or the texture binding fails silently

---

## Evidence

### What We Know Works
- ✅ Image file loads (Network tab: 200 OK)
- ✅ Image dimensions are correct (2522 × 4096)
- ✅ Shader dimensions match (vec2(2522, 4096))
- ✅ JSON structure is correct
- ✅ Unicorn Studio initializes
- ✅ WebGL context is created
- ✅ Textures are bound (console shows "Texture unit 0/1 has texture bound")

### What's Missing
- ❌ **Actual image data in the texture**
- ❌ The texture is likely 1×1 transparent or empty
- ❌ When shader samples it, it gets transparent pixels
- ❌ Result: Image is invisible

---

## The Fix: Add CORS Headers

To make local JSON work, the local server needs to send CORS headers:

### Python HTTP Server (Current)
```python
# Current: python3 -m http.server 8000
# ❌ No CORS headers
```

### Solution: Add CORS Headers

**Option 1: Use a server with CORS**
```python
# Use http.server with CORS middleware
# Or use a different server like:
# - Live Server (VS Code extension)
# - http-server with --cors flag
```

**Option 2: Add CORS headers manually**
```python
# Custom Python server with CORS
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

HTTPServer(('', 8000), CORSRequestHandler).serve_forever()
```

**Option 3: Use nginx or Apache**
```nginx
# nginx config
location / {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

---

## Why CDN Works But Local Doesn't

| Aspect | CDN (`data-us-project`) | Local JSON (`data-us-project-src`) |
|--------|-------------------------|-------------------------------------|
| Image URL | `https://assets.unicorn.studio/...` | `http://localhost:8000/...` |
| CORS Headers | ✅ Yes (from Unicorn Studio) | ❌ No (Python http.server) |
| Image Loads | ✅ Yes | ✅ Yes |
| WebGL Texture | ✅ Works | ❌ Fails (tainted) |
| Result | ✅ Renders | ❌ Invisible |

---

## Verification Steps

To confirm this is the issue:

1. **Check browser console for CORS errors:**
   - Open DevTools → Console
   - Look for: "Access to image ... has been blocked by CORS policy"
   - Note: These might not appear if failure is silent

2. **Check Network tab:**
   - Image request should show CORS headers in response
   - Look for: `Access-Control-Allow-Origin: *`

3. **Test with CORS-enabled server:**
   - Use `http-server --cors` or similar
   - Image should now render

---

## Conclusion

**Root Cause:** WebGL texture creation fails because local images lack CORS headers, making them "tainted" and unusable in WebGL, even though they load successfully for regular use.

**Solution:** Serve local images with proper CORS headers (`Access-Control-Allow-Origin: *`).

**Why CDN works:** Unicorn Studio's CDN automatically includes CORS headers for all images.
