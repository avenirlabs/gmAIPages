<?php
/**
 * Giftsmate Chat Shortcode
 *
 * Progressive enhancement shortcode that renders a static HTML shell
 * with all data attributes for future JS hydration (Step 2).
 *
 * @package GiftsmateChat
 * @since 2.0.0
 */

// Security: Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register shortcodes
 */
function giftsmate_register_shortcodes() {
    add_shortcode('giftsmate_chat', 'giftsmate_chat_shortcode_handler');
}

/**
 * Main shortcode handler
 *
 * Usage examples:
 * [giftsmate_chat]
 * [giftsmate_chat relationship="dad" occasion="birthday"]
 * [giftsmate_chat chips="Gifts for Dad|Tech lover|Under ₹999"]
 * [giftsmate_chat relationship="mom" occasion="anniversary" snapshot_key="mom-anniversary" snapshot_limit="8"]
 *
 * @param array $atts Shortcode attributes
 * @return string HTML output
 */
function giftsmate_chat_shortcode_handler($atts) {
    // Parse and sanitize shortcode attributes
    $atts = shortcode_atts([
        'relationship'    => '',
        'occasion'        => '',
        'chips'           => '',
        'first_prompt'    => '',
        'snapshot_key'    => '',
        'snapshot_limit'  => '8',
        'api_base'        => 'https://gm-ai-pages.vercel.app',
        'class'           => '',
        'style'           => '',
    ], $atts, 'giftsmate_chat');

    // Sanitize all attributes
    $relationship    = sanitize_text_field($atts['relationship']);
    $occasion        = sanitize_text_field($atts['occasion']);
    $chips_raw       = sanitize_text_field($atts['chips']);
    $first_prompt    = sanitize_textarea_field($atts['first_prompt']);
    $snapshot_key    = sanitize_key($atts['snapshot_key']);
    $snapshot_limit  = absint($atts['snapshot_limit']);
    $api_base        = esc_url_raw($atts['api_base']);
    $extra_class     = sanitize_html_class($atts['class']);
    $inline_style    = esc_attr($atts['style']);

    // Process chips: split on |, trim, dedupe, cap at 12
    $chips_array = giftsmate_process_chips($chips_raw, $relationship, $occasion);
    $chips_string = implode('|', $chips_array);

    // Generate unique ID for this instance
    $unique_id = 'gm-chat-' . uniqid();

    // Generate heading and description
    $heading = giftsmate_generate_heading($relationship, $occasion);
    $description = giftsmate_generate_description($relationship, $occasion);

    // Start output buffering
    ob_start();

    // Inline CSS (scoped to .gm-chat-shell)
    giftsmate_output_inline_styles();

    ?>
    <!-- STEP 1: Static Shell - Progressive Enhancement Shortcode -->
    <section
        id="<?php echo esc_attr($unique_id); ?>"
        class="gm-chat-shell <?php echo esc_attr($extra_class); ?>"
        <?php if ($inline_style): ?>style="<?php echo $inline_style; ?>"<?php endif; ?>
        data-relationship="<?php echo esc_attr($relationship); ?>"
        data-occasion="<?php echo esc_attr($occasion); ?>"
        data-chips="<?php echo esc_attr($chips_string); ?>"
        data-first-prompt="<?php echo esc_attr($first_prompt); ?>"
        data-snapshot-key="<?php echo esc_attr($snapshot_key); ?>"
        data-snapshot-limit="<?php echo esc_attr($snapshot_limit); ?>"
        data-api-base="<?php echo esc_attr($api_base); ?>"
    >
        <!-- Heading -->
        <h2 class="gm-chat-shell__heading">
            <?php echo esc_html($heading); ?>
        </h2>

        <!-- Description -->
        <p class="gm-chat-shell__description">
            <?php echo esc_html($description); ?>
        </p>

        <!-- Chip Row - STEP 3: SEO-friendly links with URL params -->
        <div class="gm-chat-shell__chips" role="group" aria-label="Quick search suggestions">
            <?php
            // STEP 4: Preserve first_prompt if present in URL
            $current_first_prompt = isset($_GET['first_prompt']) ? sanitize_textarea_field($_GET['first_prompt']) : '';

            foreach ($chips_array as $chip_index => $chip):
                // Build chip URL with chip param and preserve first_prompt
                $chip_url_args = array('chip' => $chip);
                if (!empty($current_first_prompt)) {
                    $chip_url_args['first_prompt'] = $current_first_prompt;
                }
                $chip_url = add_query_arg($chip_url_args);
            ?>
                <a
                    href="<?php echo esc_url($chip_url); ?>"
                    class="gm-chat-shell__chip"
                    data-chip-index="<?php echo esc_attr($chip_index); ?>"
                    data-chip-text="<?php echo esc_attr($chip); ?>"
                >
                    <?php echo esc_html($chip); ?>
                </a>
            <?php endforeach; ?>
        </div>

        <!-- STEP 3: Server-rendered snapshot grid -->
        <div class="gm-chat-shell__snapshot-grid">
            <?php
            // Attempt to fetch snapshot if key is provided
            $snapshot_items = null;
            $render_placeholders = true;

            if (!empty($snapshot_key)) {
                $snapshot_items = giftsmate_fetch_snapshot($snapshot_key, $snapshot_limit);

                if (!is_wp_error($snapshot_items) && is_array($snapshot_items) && !empty($snapshot_items)) {
                    // SUCCESS: Render real cards
                    $render_placeholders = false;

                    foreach ($snapshot_items as $index => $item) {
                        echo giftsmate_render_card($item, $index);
                    }

                    // Emit cache debug comment
                    do_action('giftsmate_snapshot_cache_debug');

                    // Emit structured data
                    echo giftsmate_generate_itemlist_schema($snapshot_items);
                } else {
                    // FAILURE: Log error and fall back to placeholders
                    if (is_wp_error($snapshot_items)) {
                        $error_code = $snapshot_items->get_error_code();
                        echo '<!-- gm snapshot error: ' . esc_html($error_code) . ' -->' . "\n";
                    }
                }
            }

            // Render placeholders if no snapshot or fetch failed
            if ($render_placeholders) {
                $limit = max(6, min(12, $snapshot_limit));
                for ($i = 0; $i < $limit; $i++):
                ?>
                    <div class="gm-chat-shell__card-placeholder">
                        <div class="gm-chat-shell__card-image"></div>
                        <div class="gm-chat-shell__card-title"></div>
                        <div class="gm-chat-shell__card-price"></div>
                    </div>
                <?php
                endfor;
            }
            ?>
        </div>

        <!-- CTA Buttons -->
        <div class="gm-chat-shell__actions">
            <button type="button" class="gm-chat-shell__btn-primary" disabled>
                ✨ Refine with AI
            </button>
            <?php
            // STEP 4: Build "Open full AI Gift Finder" link with current params
            $gift_finder_url = '/gift-finder/';
            $gift_finder_args = array();

            // Add chip param if present
            if (isset($_GET['chip']) && !empty($_GET['chip'])) {
                $gift_finder_args['chip'] = sanitize_text_field($_GET['chip']);
            }

            // Add first_prompt param if present
            if (isset($_GET['first_prompt']) && !empty($_GET['first_prompt'])) {
                $gift_finder_args['first_prompt'] = sanitize_textarea_field($_GET['first_prompt']);
            }

            // Build final URL
            if (!empty($gift_finder_args)) {
                $gift_finder_url = add_query_arg($gift_finder_args, $gift_finder_url);
            }
            ?>
            <a href="<?php echo esc_url($gift_finder_url); ?>" class="gm-chat-shell__link-secondary" data-gift-finder-link>
                Open full AI Gift Finder →
            </a>
        </div>

        <!-- JS Hook Point (Step 2 will attach here) -->
        <noscript>
            <p class="gm-chat-shell__noscript">
                JavaScript is required for the interactive AI gift finder.
                <a href="/gift-finder/">Visit the full page version</a> to browse our catalog.
            </p>
        </noscript>
    </section>
    <?php

    // STEP 2: Output bootstrap script (only once per page)
    static $bootstrap_loaded = false;
    if (!$bootstrap_loaded) {
        giftsmate_output_bootstrap_script();
        $bootstrap_loaded = true;
    }

    // STEP 5: Output snapshot_view beacon (only once per page)
    static $snapshot_view_sent = false;
    if (!$snapshot_view_sent) {
        giftsmate_output_snapshot_view_beacon($snapshot_key);
        $snapshot_view_sent = true;
    }

    return ob_get_clean();
}

/**
 * Process chips: split, trim, dedupe, cap at 12
 *
 * @param string $chips_raw Raw chips string (pipe-separated)
 * @param string $relationship Relationship attribute
 * @param string $occasion Occasion attribute
 * @return array Processed chip array
 */
function giftsmate_process_chips($chips_raw, $relationship, $occasion) {
    $chips = [];

    if (!empty($chips_raw)) {
        // Split on pipe, trim each item
        $chips = array_map('trim', explode('|', $chips_raw));
        // Remove empty items
        $chips = array_filter($chips);
    }

    // If no chips provided, auto-generate from relationship/occasion
    if (empty($chips)) {
        $chips = giftsmate_generate_default_chips($relationship, $occasion);
    }

    // Dedupe and cap at 12
    $chips = array_unique($chips);
    $chips = array_slice($chips, 0, 12);

    return $chips;
}

/**
 * Generate default chips based on relationship/occasion
 *
 * @param string $relationship Relationship attribute
 * @param string $occasion Occasion attribute
 * @return array Default chips
 */
function giftsmate_generate_default_chips($relationship, $occasion) {
    $chips = [];

    // Add relationship-based chip
    if (!empty($relationship)) {
        $chips[] = 'Gifts for ' . ucfirst($relationship);
    }

    // Add occasion-based chip
    if (!empty($occasion)) {
        $chips[] = ucfirst($occasion) . ' gifts';
    }

    // Add generic fallback chips
    if (empty($chips)) {
        $chips = [
            'Trending gifts',
            'Budget-friendly',
            'Premium gifts'
        ];
    } else {
        // Add complementary chips
        $chips[] = 'Under ₹999';
        $chips[] = 'Premium gifts';
        $chips[] = 'Personalized';
    }

    return $chips;
}

/**
 * Generate heading from relationship/occasion
 *
 * @param string $relationship Relationship attribute
 * @param string $occasion Occasion attribute
 * @return string Generated heading
 */
function giftsmate_generate_heading($relationship, $occasion) {
    if (!empty($relationship) && !empty($occasion)) {
        return sprintf('Perfect %s gifts for %s', ucfirst($occasion), ucfirst($relationship));
    } elseif (!empty($relationship)) {
        return sprintf('Find the perfect gift for %s', ucfirst($relationship));
    } elseif (!empty($occasion)) {
        return sprintf('Discover %s gifts', ucfirst($occasion));
    }

    return 'Find the perfect gift with AI';
}

/**
 * Generate description text
 *
 * @param string $relationship Relationship attribute
 * @param string $occasion Occasion attribute
 * @return string Generated description
 */
function giftsmate_generate_description($relationship, $occasion) {
    if (!empty($relationship) || !empty($occasion)) {
        return 'Browse our curated selection or use AI to get personalized recommendations tailored to your needs.';
    }

    return 'Let our AI help you discover thoughtful, personalized gifts. Click any suggestion below to get started.';
}

/**
 * Output inline CSS (scoped to .gm-chat-shell)
 * ~1.5KB minified - only loads when shortcode is used
 */
function giftsmate_output_inline_styles() {
    ?>
    <style>
    /* Giftsmate Chat Shell - Static Styles (Step 1) */
    .gm-chat-shell {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .gm-chat-shell__heading {
        margin: 0 0 0.75rem 0;
        font-size: 1.875rem;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
    }

    .gm-chat-shell__description {
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        color: #6b7280;
        line-height: 1.5;
    }

    /* Chips */
    .gm-chat-shell__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }

    .gm-chat-shell__chip {
        display: inline-block;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 9999px;
        text-decoration: none;
        transition: all 0.2s;
    }

    .gm-chat-shell__chip:hover {
        background: #e5e7eb;
        color: #111827;
    }

    /* STEP 4: Active/selected chip state */
    .gm-chat-shell__chip--active {
        background: #6366f1;
        color: #ffffff;
        border-color: #4f46e5;
    }

    .gm-chat-shell__chip--active:hover {
        background: #4f46e5;
        color: #ffffff;
    }

    /* Snapshot Grid - Fixed height to prevent CLS */
    .gm-chat-shell__snapshot-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* Card Placeholders - Reserve space */
    .gm-chat-shell__card-placeholder {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .gm-chat-shell__card-image {
        aspect-ratio: 1 / 1;
        background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
    }

    .gm-chat-shell__card-title {
        height: 2.5rem;
        background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
    }

    .gm-chat-shell__card-price {
        height: 1.5rem;
        width: 60%;
        background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
    }

    @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }

    /* STEP 3: Real Product Cards */
    .gm-chat-shell__card {
        display: flex;
        flex-direction: column;
    }

    .gm-card__link {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s;
    }

    .gm-card__link:hover {
        transform: translateY(-2px);
    }

    .gm-card__image-wrapper {
        position: relative;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-radius: 8px;
        background: #f3f4f6;
    }

    .gm-card__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .gm-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #ffffff;
        background: #ef4444;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .gm-card__title {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #111827;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .gm-card__price {
        margin: 0;
    }

    .gm-price-amount {
        font-size: 1rem;
        font-weight: 700;
        color: #059669;
    }

    /* Actions */
    .gm-chat-shell__actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .gm-chat-shell__btn-primary {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        background: #6366f1;
        border: none;
        border-radius: 8px;
        cursor: not-allowed;
        opacity: 0.6;
        transition: all 0.2s;
    }

    .gm-chat-shell__btn-primary:hover {
        background: #4f46e5;
    }

    .gm-chat-shell__link-secondary {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6366f1;
        text-decoration: none;
    }

    .gm-chat-shell__link-secondary:hover {
        text-decoration: underline;
    }

    /* Noscript */
    .gm-chat-shell__noscript {
        padding: 1rem;
        margin-top: 1rem;
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        color: #92400e;
    }

    .gm-chat-shell__noscript a {
        color: #92400e;
        font-weight: 600;
    }

    /* STEP 4: Screen reader only (for aria-live announcements) */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    /* STEP 2: Loading & Error States */
    .gm-chat--loading .gm-chat-shell__btn-primary {
        opacity: 0.8;
        cursor: wait;
    }

    .gm-chat--error .gm-chat-shell__error {
        padding: 1rem;
        margin-bottom: 1.5rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #991b1b;
    }

    .gm-chat--error .gm-chat-shell__error p {
        margin: 0 0 0.75rem 0;
    }

    .gm-chat-shell__btn-retry {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #ffffff;
        background: #dc2626;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }

    .gm-chat-shell__btn-retry:hover {
        background: #b91c1c;
    }

    .gm-chat--hydrated .gm-chat-shell__chips,
    .gm-chat--hydrated .gm-chat-shell__actions {
        display: none;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .gm-chat-shell {
            padding: 1.5rem;
            margin: 1rem;
        }

        .gm-chat-shell__heading {
            font-size: 1.5rem;
        }

        .gm-chat-shell__snapshot-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }
    }
    </style>
    <?php
}

/**
 * Output inline bootstrap script
 * STEP 2: Lazy loader that hydrates on user intent
 */
function giftsmate_output_bootstrap_script() {
    // Get plugin URL for widget bundle
    $widget_version = '20251022'; // Update when widget changes
    $widget_url = apply_filters(
        'giftsmate_widget_url',
        get_site_url() . '/wp-content/uploads/2025/10/giftsmate-chat.js?v=' . $widget_version
    );
    ?>
    <script>
    window.GIFTSMATE_WIDGET_URL = <?php echo json_encode($widget_url); ?>;
    </script>
    <?php

    // Output bootstrap script inline
    $bootstrap_path = GIFTSMATE_CHAT_PLUGIN_DIR . 'assets/gm-bootstrap.js';
    if (file_exists($bootstrap_path)) {
        echo '<script>';
        include $bootstrap_path;
        echo '</script>';
    }
}

/**
 * Output snapshot_view analytics beacon
 * STEP 5: Fire-and-forget pageview tracking
 *
 * @param string $snapshot_key Snapshot key for this widget instance
 */
function giftsmate_output_snapshot_view_beacon($snapshot_key) {
    // Get metrics endpoint URL (filterable)
    $metrics_url = apply_filters(
        'giftsmate_metrics_url',
        'https://gm-ai-pages.vercel.app/api/metrics/gm-widget'
    );

    // Sanitize snapshot_key for JS
    $snapshot_key_safe = esc_js($snapshot_key);
    ?>
    <script>
    (function(){
        if(window._gm_sv_sent){return;}
        window._gm_sv_sent=1;
        try{
            if(navigator.sendBeacon){
                var payload=JSON.stringify({
                    event:'snapshot_view',
                    ts:Date.now(),
                    page_path:location.pathname,
                    snapshot_key:'<?php echo $snapshot_key_safe; ?>'
                });
                navigator.sendBeacon('<?php echo esc_js($metrics_url); ?>',new Blob([payload],{type:'application/json'}));
            }
        }catch(e){}
    })();
    </script>
    <?php
}

// STEP 1 END
// STEP 2: Add lightweight JS bootstrap to hydrate chips and fetch snapshot data
