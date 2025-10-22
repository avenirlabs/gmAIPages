=== Giftsmate Chat Widget ===
Contributors: avenirlabs
Tags: gifts, ai, chat, ecommerce, recommendations
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 2.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Progressive-enhancement AI gift finder with server-rendered static shell and optional interactivity.

== Description ==

Giftsmate Chat Widget provides an AI-powered gift recommendation system for your WordPress site using progressive enhancement. The plugin renders server-side static HTML with zero JavaScript dependencies by default, then progressively enhances with interactive features.

= Key Features =

* **Server-Rendered Shell** - Fully static HTML output, SEO-friendly
* **Progressive Enhancement** - Works without JavaScript, enhances when available
* **AI-Powered Recommendations** - Smart gift suggestions based on context
* **Snapshot Cards** - Pre-rendered product cards for fast initial load
* **Interactive Chips** - Contextual filtering options
* **Zero Layout Shift** - CLS-stable with fixed-height placeholders
* **Privacy-First Analytics** - Optional event tracking without PII
* **Mobile Responsive** - Works perfectly on all devices

= Use Cases =

* Gift finder pages for e-commerce sites
* Birthday/anniversary gift recommendations
* Holiday gift guides (Diwali, Christmas, etc.)
* Occasion-based product discovery
* Interactive product catalogs

= Technical Highlights =

* Progressive enhancement architecture
* Server-side rendering for performance and SEO
* Lazy-loaded JavaScript (~5KB gzipped)
* Inline CSS (~1.5KB) to avoid render-blocking
* Schema.org structured data for products
* CORS-compatible API integration

= Requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* Modern browser (Chrome, Firefox, Safari, Edge)

= Documentation =

For detailed documentation, integration guides, and examples, visit:
[GitHub Repository](https://github.com/avenirlabs/gmAIPages)

== Installation ==

= Automatic Installation =

1. Go to Plugins > Add New
2. Search for "Giftsmate Chat Widget"
3. Click "Install Now"
4. Activate the plugin

= Manual Installation =

1. Download the plugin ZIP file
2. Go to Plugins > Add New > Upload Plugin
3. Choose the downloaded ZIP file
4. Click "Install Now"
5. Activate the plugin

= After Activation =

1. Add the shortcode `[giftsmate_chat]` to any page or post
2. Customize with attributes (see Usage section)

== Usage ==

= Basic Usage =

`[giftsmate_chat]`

= With Relationship & Occasion =

`[giftsmate_chat relationship="dad" occasion="birthday"]`

= With Custom Chips =

`[giftsmate_chat chips="Gifts for Dad|Tech lover|Under ₹999"]`

= With Server-Rendered Snapshot =

`[giftsmate_chat snapshot_key="dad-birthday" snapshot_limit="8"]`

= Full Configuration Example =

`[giftsmate_chat
    relationship="mom"
    occasion="anniversary"
    chips="Jewelry|Spa gifts|Premium gifts"
    first_prompt="Suggest thoughtful anniversary gifts for mom under ₹2000"
    snapshot_key="mom-anniversary"
    snapshot_limit="8"
    api_base="https://gm-ai-pages.vercel.app"
    class="custom-wrapper"
    style="margin-top: 3rem;"
]`

= Shortcode Attributes =

* `relationship` - (string) e.g., "dad", "mom", "husband"
* `occasion` - (string) e.g., "birthday", "diwali", "anniversary"
* `chips` - (string) Pipe-separated list: "Chip 1|Chip 2|Chip 3"
* `first_prompt` - (string) Custom first chat message
* `snapshot_key` - (string) Identifier for cached snapshot data
* `snapshot_limit` - (int) Number of placeholder cards (6-12), default: 8
* `api_base` - (URL) API endpoint, default: https://gm-ai-pages.vercel.app
* `class` - (string) Additional CSS class names
* `style` - (string) Inline CSS styles

== Frequently Asked Questions ==

= Does this plugin work without JavaScript? =

Yes! The plugin renders a fully functional server-side static shell. JavaScript is only loaded progressively for enhanced interactivity.

= Is the plugin SEO-friendly? =

Absolutely. The server-rendered HTML includes semantic markup, Schema.org structured data, and all content is indexable by search engines.

= Does it work with my theme? =

Yes, the plugin uses scoped CSS with BEM-ish naming conventions to avoid conflicts with theme styles.

= What API endpoints does it use? =

The plugin connects to:
* `/api/snapshots/:key.json` - For server-rendered product cards
* `/api/metrics/gm-widget` - For optional analytics (privacy-first)
* `/api/gifts/chat` - For AI chat interactions

= Can I customize the styling? =

Yes! Use the `class` and `style` attributes, or target `.gm-chat-shell` in your theme CSS.

= Is analytics data collected? =

The plugin includes optional privacy-first analytics. No personally identifiable information (PII) is collected - only aggregate interaction events like "chip clicked" or "snapshot viewed".

= What happens if the API is down? =

The plugin gracefully degrades. The static shell remains visible, and users can still browse placeholder cards and see content.

= Can I use my own API endpoint? =

Yes, use the `api_base` attribute to point to your custom endpoint.

== Screenshots ==

1. Basic widget with server-rendered cards
2. Interactive AI chat overlay
3. Chip-based filtering
4. Mobile responsive layout
5. Shortcode configuration example
6. Admin settings (if applicable)

== Changelog ==

= 2.0.0 (2025-10-22) =
* Complete rewrite with progressive enhancement architecture
* Added server-side rendering for instant load
* Implemented snapshot fetcher for product cards
* Added lazy-loading JavaScript bootstrap (~5KB)
* Privacy-first analytics integration
* Schema.org structured data support
* Zero layout shift (CLS-stable)
* Mobile responsive design
* CORS-compatible API integration
* Verified compatibility with Vercel API endpoints

= 1.0.0 (Initial Release) =
* Basic chat widget functionality
* Simple shortcode implementation

== Upgrade Notice ==

= 2.0.0 =
Major update with progressive enhancement, server-side rendering, and improved performance. Fully backward compatible with existing shortcodes.

== Privacy Policy ==

This plugin may collect anonymous, aggregate analytics data if enabled:
* Page views with widget present
* Chip clicks and interactions
* Widget load times
* Device type (mobile/desktop)

**NOT collected:**
* IP addresses (only used for rate limiting, not stored)
* User agents (logged but not in analytics payload)
* Cookies or user identifiers
* Personal data or PII

All analytics are fire-and-forget with no impact on user experience.

== Third-Party Services ==

This plugin connects to external API endpoints hosted on Vercel (https://gm-ai-pages.vercel.app):

* **Purpose**: Fetch product data, AI recommendations, and analytics
* **Data sent**: Search queries, interaction events (no PII)
* **Privacy Policy**: https://vercel.com/legal/privacy-policy
* **Terms of Service**: https://vercel.com/legal/terms

You can configure a custom `api_base` to use your own endpoints.

== Credits ==

Developed by [Avenir Labs](https://avenirlabs.com)

== Support ==

For support, bug reports, or feature requests:
* GitHub: https://github.com/avenirlabs/gmAIPages/issues
* Email: support@avenirlabs.com
