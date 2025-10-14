# WordPress Deployment Guide - Giftsmate Chat Widget

**Version**: 20251014153557
**Build Date**: October 14, 2025
**Widget File**: `dist/spa/giftsmate-chat.js` (297.88 KB / 84.74 KB gzipped)

---

## 📦 Quick Deployment Steps

### Step 1: Upload Widget File

1. **Download** the widget file from your build:
   - Location: `dist/spa/giftsmate-chat.js`
   - Size: 297.88 KB (uncompressed)

2. **Upload to WordPress**:
   - Go to **Media Library → Upload Files**
   - Upload `giftsmate-chat.js`
   - Copy the file URL (should be something like):
     ```
     https://yourdomain.com/wp-content/uploads/2025/10/giftsmate-chat.js
     ```

### Step 2: Install Code Snippets Plugin

If not already installed:

1. Go to **Plugins → Add New**
2. Search for **"Code Snippets"**
3. Install and activate

### Step 3: Create Snippet for Script Loading

1. Go to **Snippets → Add New**
2. **Title**: `Giftsmate Chat Widget Loader`
3. **Code Type**: PHP Snippet
4. **Code**:

```php
<?php
/**
 * Giftsmate Chat Widget Script Loader
 * Injects widget script on specific pages
 */
add_action('wp_footer', function () {
    // Only load on pages where you want the widget
    // Option 1: Load on specific page by slug
    if (is_page('ai')) {
        $version = '20251014153557'; // Update this when you upload new version
        $script_url = get_site_url() . '/wp-content/uploads/2025/10/giftsmate-chat.js?v=' . $version;
        ?>
        <script src="<?php echo esc_url($script_url); ?>" defer crossorigin="anonymous"></script>
        <?php
    }

    // Option 2: Load on all pages (NOT RECOMMENDED - only if needed)
    // Uncomment below if you want widget available everywhere
    /*
    $version = '20251014153557';
    $script_url = get_site_url() . '/wp-content/uploads/2025/10/giftsmate-chat.js?v=' . $version;
    ?>
    <script src="<?php echo esc_url($script_url); ?>" defer crossorigin="anonymous"></script>
    <?php
    */
}, 99);
?>
```

5. **Run Snippet**: Everywhere
6. **Save Changes and Activate**

### Step 4: Create Shortcode Snippet

1. Go to **Snippets → Add New**
2. **Title**: `Giftsmate Chat Shortcode`
3. **Code Type**: PHP Snippet
4. **Code**:

```php
<?php
/**
 * Giftsmate Chat Widget Shortcode
 * Usage: [giftsmate_chat]
 * Usage with API: [giftsmate_chat api="https://your-api.vercel.app"]
 */
add_shortcode('giftsmate_chat', function($atts) {
    // Parse shortcode attributes
    $atts = shortcode_atts([
        'api' => 'https://gm-ai-pages.vercel.app', // Default API endpoint
        'prompts' => 'Gifts for sister|Diwali gifts|Birthday return gifts', // Default starter prompts
    ], $atts, 'giftsmate_chat');

    // Generate output
    ob_start();
    ?>
    <giftsmate-chat
        api-base="<?php echo esc_attr($atts['api']); ?>"
        starter-prompts="<?php echo esc_attr($atts['prompts']); ?>">
    </giftsmate-chat>
    <?php
    return ob_get_clean();
});
?>
```

5. **Run Snippet**: Everywhere
6. **Save Changes and Activate**

---

## 🎯 Using the Widget

### Method 1: Shortcode (Recommended)

**In any page/post, add**:

```
[giftsmate_chat]
```

**With custom API**:

```
[giftsmate_chat api="https://your-custom-api.vercel.app"]
```

**With custom prompts**:

```
[giftsmate_chat prompts="Anniversary gifts|Wedding gifts|Housewarming gifts"]
```

**Full customization**:

```
[giftsmate_chat api="https://your-api.com" prompts="Custom prompt 1|Custom prompt 2|Custom prompt 3"]
```

### Method 2: HTML Block (Gutenberg)

1. Edit your page in Gutenberg editor
2. Add **Custom HTML** block
3. Paste:

```html
<giftsmate-chat
  api-base="https://gm-ai-pages.vercel.app"
  starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
</giftsmate-chat>
```

### Method 3: Elementor Widget

1. Edit page with Elementor
2. Add **HTML** widget
3. Paste the same HTML as above

---

## 🎨 Widget Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `api-base` | URL | `window.location.origin` | API endpoint for chat backend |
| `starter-prompts` | String | `""` | Pipe-separated list of starter prompts |
| `theme` | String | `"light"` | Theme (planned for future) |
| `color` | String | `"#6C5CE7"` | Primary color (planned for future) |
| `radius` | Number | `12` | Border radius (planned for future) |

**Example with all attributes**:

```html
<giftsmate-chat
  api-base="https://gm-ai-pages.vercel.app"
  starter-prompts="Gifts for dad|Gifts for mom|Gifts for sister"
  theme="light"
  color="#6C5CE7"
  radius="12">
</giftsmate-chat>
```

---

## 🔧 Version Updates

When you deploy a new version:

1. **Build new widget**:
   ```bash
   npm run build
   ```

2. **Upload** new `giftsmate-chat.js` to WordPress Media Library

3. **Update version** in Code Snippets:
   - Edit "Giftsmate Chat Widget Loader" snippet
   - Change `$version = '20251014153557';` to new timestamp
   - Example: `$version = '20251015094500';`
   - Save

4. **Clear cache**:
   - WordPress cache (if using WP Rocket, W3 Total Cache, etc.)
   - Browser cache (Ctrl+Shift+R)
   - CDN cache (if using Cloudflare, etc.)

---

## 🧪 Testing Checklist

After deployment, verify:

- [ ] **Script loads**: Check browser DevTools → Network → `giftsmate-chat.js` shows 200 OK
- [ ] **Custom element registers**: Console → `customElements.get('giftsmate-chat')` returns function
- [ ] **Shadow DOM created**: Console → `document.querySelector('giftsmate-chat')?.shadowRoot` returns object
- [ ] **Styles applied**: Widget appears with proper styling
- [ ] **Starter prompts visible**: Chips show below input
- [ ] **Chat works**: Type message and send → products appear
- [ ] **Refinements work**: Click chips → hashtags added → results update
- [ ] **Drawer opens**: Click "Refine more" → modal appears
- [ ] **No console errors**: Check for any JavaScript errors

### Debug Console Commands

```javascript
// Check if widget is registered
!!customElements.get('giftsmate-chat')
// Expected: true

// Check if element exists
!!document.querySelector('giftsmate-chat')
// Expected: true

// Check shadow DOM
!!document.querySelector('giftsmate-chat')?.shadowRoot
// Expected: true

// Check styles
!!document.querySelector('giftsmate-chat')?.shadowRoot?.querySelector('style')
// Expected: true
```

---

## 🚨 Troubleshooting

### Widget Not Appearing

**Problem**: Nothing renders on the page

**Solutions**:
1. Check browser console for errors
2. Verify script loaded: Network tab → `giftsmate-chat.js` status 200
3. Check shortcode syntax (no extra spaces)
4. Clear WordPress cache
5. Verify snippet is activated

### Script Blocked by CSP

**Problem**: Console shows "Content Security Policy" error

**Solutions**:
1. Widget is CSP-safe (no eval/inline scripts)
2. Check WordPress security plugins (Wordfence, etc.)
3. Add exception for `/wp-content/uploads/*.js`
4. Contact hosting provider if strict CSP enforced

### CORS Errors

**Problem**: Console shows "CORS policy" error on API calls

**Solutions**:
1. Verify `api-base` attribute points to correct API
2. Check API has your WordPress domain in CORS allowlist
3. Verify API endpoint accessible (test in browser)
4. Contact API administrator to add your domain

### Styles Not Working

**Problem**: Widget appears unstyled (raw HTML)

**Solutions**:
1. Rebuild widget: `npm run build`
2. Re-upload `giftsmate-chat.js`
3. Update version number in snippet
4. Clear all caches (WordPress, browser, CDN)

### Old Version Loading

**Problem**: Changes not appearing after update

**Solutions**:
1. Update version timestamp in snippet
2. Clear WordPress cache
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser DevTools → Network → verify new file size

---

## 📊 Performance Tips

1. **Use CDN**: Upload to CDN for faster global delivery
2. **Enable Gzip**: Reduces size from 298 KB → 85 KB
3. **Page-specific loading**: Only load on pages that need it
4. **Defer attribute**: Already included (non-blocking)
5. **HTTP/2**: Ensure server supports HTTP/2 for faster loading

---

## 🔐 Security Notes

- ✅ **CSP-Safe**: No eval, no inline scripts, no unsafe code
- ✅ **CORS Protected**: API uses strict allowlist
- ✅ **Shadow DOM**: Styles isolated, no conflicts
- ✅ **No Tracking**: Widget doesn't set cookies
- ✅ **HTTPS Only**: All API calls use secure connections

---

## 📞 Support

**Issues?**
- Check documentation: `docs/widget-guide.md`
- Review test files: `test-widget.html`
- GitHub: https://github.com/avenirlabs/gmAIPages

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 20251014153557 | Oct 14, 2025 | Initial release with refinements v1 |

---

**Ready to Deploy!** 🚀

Upload `dist/spa/giftsmate-chat.js` to WordPress and add the shortcode `[giftsmate_chat]` to any page!
