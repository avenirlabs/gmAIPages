# Giftsmate Chat Widget - Usage Guide

**Version:** 2.1.0
**Updated:** 2025-10-22

---

## 🎉 What's New in v2.1.0

**✨ Admin Settings Page Added!**

- Configure default API settings
- Visual shortcode generator
- Save and manage shortcodes
- No more manual shortcode writing!

---

## 📍 How to Access Settings

After installing and activating the plugin:

1. Go to WordPress Admin
2. Navigate to **Settings → Giftsmate Chat**
3. You'll see 3 tabs:
   - **Settings** - Configure defaults
   - **Shortcode Generator** - Visual builder
   - **Saved Shortcodes** - Your saved shortcodes

---

## ⚙️ Settings Tab

Configure global defaults for your site:

### API Base URL
**Default:** `https://gm-ai-pages.vercel.app`

This is where the plugin fetches product data and AI responses. You can change this to your own domain if you host the API yourself.

### Default Snapshot Limit
**Default:** 8 products
**Range:** 6-24 products

Number of product cards to show by default. Can be overridden per shortcode.

### Cache Duration
**Default:** 3600 seconds (1 hour)
**Range:** 60 seconds - 86400 seconds (24 hours)

How long to cache product snapshots. Longer = faster, but less fresh data.

### Enable Analytics
**Default:** Enabled

Privacy-first event tracking. No PII collected - only aggregate events like "snapshot viewed" or "chip clicked".

---

## 🎨 Shortcode Generator Tab

**No more manual shortcode writing!**

### Step 1: Fill in the Form

**Relationship:** Who is the gift for?
- Example: `dad`, `mom`, `husband`, `wife`, `friend`

**Occasion:** What's the occasion?
- Example: `birthday`, `anniversary`, `diwali`, `christmas`

**Snapshot Key:** Pre-configured product sets
- `dad-birthday` - Birthday gifts for dad
- `mom-anniversary` - Anniversary gifts for mom
- `tech-lover` - Tech enthusiast gifts

**Chips:** Filter options (pipe-separated)
- Example: `Under ₹999|Tech Gadgets|Premium Gifts`

**First Prompt:** Optional AI initialization
- Example: `Show me thoughtful birthday gifts for dad under ₹2000`

**Snapshot Limit:** Number of cards (6-24)

**Custom CSS Class:** For styling

**Inline CSS Styles:** Direct styles

### Step 2: Generate Shortcode

Click **"Generate Shortcode"** button

### Step 3: Copy or Save

**Option A:** Click "📋 Copy to Clipboard" - paste in your page

**Option B:** Give it a name and click "💾 Save Shortcode" - save for later use

---

## 💾 Saved Shortcodes Tab

View all your saved shortcodes in one place:

- **Name** - Your label for the shortcode
- **Shortcode** - The actual shortcode code
- **Created** - When you saved it
- **Actions:**
  - 📋 **Copy** - Copy to clipboard
  - 🗑️ **Delete** - Remove from list

---

## 🚀 Quick Start Example

### Example 1: Dad's Birthday Gift Page

**Using Shortcode Generator:**

1. Go to **Settings → Giftsmate Chat → Shortcode Generator**
2. Fill in:
   - Relationship: `dad`
   - Occasion: `birthday`
   - Snapshot Key: `dad-birthday`
   - Chips: `Under ₹999|Tech Gadgets|Premium|Personalized`
3. Click **Generate Shortcode**
4. Click **Copy to Clipboard**
5. Create a new page in WordPress
6. Paste the shortcode
7. Publish!

**Generated Shortcode:**
```
[giftsmate_chat
    relationship="dad"
    occasion="birthday"
    snapshot_key="dad-birthday"
    chips="Under ₹999|Tech Gadgets|Premium|Personalized"]
```

**Result:**
- Heading: "Perfect Birthday gifts for Dad"
- 8 curated product cards
- 4 filter chips
- AI chat button

---

### Example 2: Mom's Anniversary Page

**Manual Shortcode:**
```
[giftsmate_chat
    relationship="mom"
    occasion="anniversary"
    snapshot_key="mom-anniversary"
    chips="Jewelry|Spa|Flowers|Premium"
    first_prompt="Show anniversary gifts under ₹3000"]
```

---

### Example 3: Generic Tech Gifts

**Minimal Shortcode:**
```
[giftsmate_chat snapshot_key="tech-lover"]
```

That's it! The plugin handles everything else.

---

## 📊 Common Use Cases

### Use Case 1: Gift Category Pages

Create dedicated pages for each gift category:

**Page:** `/gifts-for-dad/`
```
[giftsmate_chat
    relationship="dad"
    snapshot_key="dad-birthday"]
```

**Page:** `/gifts-for-mom/`
```
[giftsmate_chat
    relationship="mom"
    snapshot_key="mom-anniversary"]
```

### Use Case 2: Occasion-Based Pages

**Page:** `/birthday-gifts/`
```
[giftsmate_chat
    occasion="birthday"
    chips="Under ₹500|Under ₹1000|Under ₹2000|Premium"]
```

**Page:** `/diwali-gifts/`
```
[giftsmate_chat
    occasion="diwali"
    chips="Traditional|Modern|For Family|For Friends"]
```

### Use Case 3: Homepage Hero

Add to homepage for instant engagement:
```
[giftsmate_chat
    chips="Trending|New Arrivals|Best Sellers|Under ₹999"
    class="homepage-widget"
    style="margin: 3rem 0;"]
```

---

## 🎛️ All Shortcode Attributes

| Attribute | Type | Example | Description |
|-----------|------|---------|-------------|
| `relationship` | text | `"dad"` | Gift recipient |
| `occasion` | text | `"birthday"` | Occasion |
| `snapshot_key` | text | `"dad-birthday"` | Pre-configured snapshot |
| `chips` | pipe-separated | `"Tech\|Under ₹999"` | Filter chips |
| `first_prompt` | text | `"Show gifts..."` | AI initialization |
| `snapshot_limit` | number | `12` | Number of cards (6-24) |
| `api_base` | URL | Custom domain | Override API URL |
| `class` | text | `"my-widget"` | CSS class |
| `style` | CSS | `"margin: 2rem;"` | Inline styles |

---

## 🎨 Customization Examples

### Add Custom Styling

```
[giftsmate_chat
    snapshot_key="dad-birthday"
    class="premium-widget"
    style="background: #f9f9f9; padding: 2rem; border-radius: 8px;"]
```

Then in your theme CSS:
```css
.premium-widget .gm-chat-shell__card {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 12px;
}

.premium-widget .gm-chat-shell__btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

---

## 🔧 Advanced Settings

### Change API Base URL

If you host your own API:

1. Go to **Settings → Giftsmate Chat → Settings**
2. Change **API Base URL** to `https://your-domain.com`
3. Save Settings

All shortcodes will now use your custom API (unless overridden with `api_base` attribute).

### Adjust Cache Duration

For frequently updated products:

1. Go to **Settings → Giftsmate Chat → Settings**
2. Change **Cache Duration** to `300` (5 minutes)
3. Save Settings

For rarely changing products:
- Set to `86400` (24 hours) for better performance

---

## 📱 Mobile Responsiveness

The widget is automatically mobile-responsive:

- **Desktop:** 4 cards per row
- **Tablet:** 2 cards per row
- **Mobile:** 1 card per row

No extra configuration needed!

---

## 🐛 Troubleshooting

### Widget shows only placeholders

**Solution:** Make sure you're using a valid `snapshot_key`:
- `dad-birthday`
- `mom-anniversary`
- `tech-lover`

### Shortcode generator not working

**Solution:**
1. Clear your browser cache
2. Make sure JavaScript is enabled
3. Check browser console for errors

### Settings not saving

**Solution:**
1. Check user has `manage_options` capability (admin role)
2. Verify WordPress file permissions
3. Check for plugin conflicts

### Can't find Settings menu

**Solution:**
Look under **Settings → Giftsmate Chat** (not Plugins)

---

## ✅ Best Practices

### 1. Use Snapshot Keys

Always use `snapshot_key` for better performance:

✅ **Good:**
```
[giftsmate_chat snapshot_key="dad-birthday"]
```

❌ **Avoid:**
```
[giftsmate_chat]
```

### 2. Limit Attributes

Only include attributes you need:

✅ **Good:**
```
[giftsmate_chat
    snapshot_key="dad-birthday"
    chips="Under ₹999|Premium"]
```

❌ **Avoid:**
```
[giftsmate_chat
    relationship=""
    occasion=""
    snapshot_key="dad-birthday"
    chips="Under ₹999|Premium"
    first_prompt=""
    snapshot_limit="8"
    api_base="https://gm-ai-pages.vercel.app"]
```

### 3. Save Your Shortcodes

Use the **Saved Shortcodes** feature to:
- Keep track of what you've created
- Reuse shortcodes across pages
- Share with team members

---

## 📞 Support

**Need help?**

- **Settings Page:** Settings → Giftsmate Chat
- **Documentation:** Included README.md
- **GitHub:** https://github.com/avenirlabs/gmAIPages/issues
- **Email:** support@avenirlabs.com

---

## 🎉 You're Ready!

With v2.1.0, you have a powerful admin interface to:

✅ Configure global defaults
✅ Generate shortcodes visually
✅ Save and manage shortcodes
✅ No more manual shortcode writing!

**Go to Settings → Giftsmate Chat and start creating! 🚀**
