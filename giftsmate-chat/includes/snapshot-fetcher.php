<?php
/**
 * Snapshot Fetcher - Server-side product card data
 *
 * Fetches small JSON snapshots from CDN/edge, caches results,
 * and provides graceful fallback to placeholders.
 *
 * @package GiftsmateChat
 * @since 2.0.0
 */

// Security: Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Fetch snapshot data from API/CDN with caching
 *
 * Expected JSON schema (array of items):
 * [
 *   {
 *     "id": "sku-or-id",           // Required: unique identifier
 *     "title": "Cozy Dad Mug",     // Required: product name
 *     "url": "https://...",        // Required: product page URL
 *     "image": "https://...",      // Required: product image URL
 *     "price": 699,                // Required: price in smallest unit (paise)
 *     "currency": "INR",           // Optional: defaults to INR
 *     "badge": "Best Seller"       // Optional: badge text
 *   }
 * ]
 *
 * @param string $key Snapshot key (e.g., "dad-birthday", "mom-anniversary")
 * @param int $limit Maximum number of items to return (capped at 24)
 * @return array|WP_Error Array of items on success, WP_Error on failure
 */
function giftsmate_fetch_snapshot($key, $limit = 8) {
    // Validate and sanitize inputs
    $key = sanitize_key($key);
    $limit = absint($limit);

    // Cap limit at 24 to prevent huge responses
    $limit = min(24, max(1, $limit));

    // Empty key = no fetch
    if (empty($key)) {
        return new WP_Error('invalid_key', 'Snapshot key is required');
    }

    // Build cache key
    $cache_key = 'gm_snap_' . md5($key . '|' . $limit);

    // Try cache first
    $cached = get_transient($cache_key);
    if (false !== $cached && is_array($cached)) {
        // Add cache hit comment for debugging
        add_action('giftsmate_snapshot_cache_debug', function() use ($cache_key) {
            echo '<!-- gm cache: HIT key=' . esc_html($cache_key) . ' -->' . "\n";
        });

        return $cached;
    }

    // Cache MISS - fetch from API
    add_action('giftsmate_snapshot_cache_debug', function() use ($cache_key) {
        echo '<!-- gm cache: MISS key=' . esc_html($cache_key) . ' -->' . "\n";
    });

    // Build API URL - use setting or default
    $api_base = get_option('giftsmate_api_base', 'https://gm-ai-pages.vercel.app');
    $base_url = apply_filters('giftsmate_snapshot_base', trailingslashit($api_base) . 'api/snapshots');
    $base_url = trailingslashit($base_url);
    $snapshot_url = $base_url . $key . '.json';

    // Fetch with tight timeout
    $response = wp_remote_get($snapshot_url, array(
        'timeout'     => 2.5, // 2.5s timeout for fast fail
        'redirection' => 2,
        'user-agent'  => 'GiftsmateSnapshot/1.0',
        'headers'     => array(
            'Accept' => 'application/json',
        ),
    ));

    // Check for network/HTTP errors
    if (is_wp_error($response)) {
        do_action('giftsmate_snapshot_error', $key, $response);
        return $response;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code !== 200) {
        $error = new WP_Error(
            'http_error',
            sprintf('HTTP %d', $status_code),
            array('status' => $status_code)
        );
        do_action('giftsmate_snapshot_error', $key, $error);
        return $error;
    }

    // Parse JSON
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        $error = new WP_Error('json_error', 'Invalid JSON response');
        do_action('giftsmate_snapshot_error', $key, $error);
        return $error;
    }

    if (!is_array($data)) {
        $error = new WP_Error('invalid_format', 'Response must be an array');
        do_action('giftsmate_snapshot_error', $key, $error);
        return $error;
    }

    // Validate and filter items
    $items = array();
    foreach ($data as $item) {
        // Skip if not an object/array
        if (!is_array($item)) {
            continue;
        }

        // Required fields validation
        if (empty($item['id']) || empty($item['title']) ||
            empty($item['url']) || empty($item['image'])) {
            continue; // Skip incomplete items
        }

        // Validate price
        if (!isset($item['price']) || !is_numeric($item['price'])) {
            continue;
        }

        // Add to items
        $items[] = array(
            'id'       => sanitize_text_field($item['id']),
            'title'    => sanitize_text_field($item['title']),
            'url'      => esc_url_raw($item['url']),
            'image'    => esc_url_raw($item['image']),
            'price'    => absint($item['price']),
            'currency' => giftsmate_validate_currency($item['currency'] ?? 'INR'),
            'badge'    => !empty($item['badge']) ? sanitize_text_field($item['badge']) : '',
        );

        // Stop at limit
        if (count($items) >= $limit) {
            break;
        }
    }

    // No valid items = error
    if (empty($items)) {
        $error = new WP_Error('no_valid_items', 'No valid items in response');
        do_action('giftsmate_snapshot_error', $key, $error);
        return $error;
    }

    // Cache successful result
    // Use cache duration from settings or default
    $cache_duration = get_option('giftsmate_cache_duration', 3600);
    $ttl = apply_filters('giftsmate_snapshot_ttl', absint($cache_duration));
    set_transient($cache_key, $items, $ttl);

    return $items;
}

/**
 * Validate currency code against whitelist
 *
 * @param string $currency Currency code (e.g., "INR", "USD")
 * @return string Validated currency or "INR" as fallback
 */
function giftsmate_validate_currency($currency) {
    $allowed = array('INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED');
    $currency = strtoupper(sanitize_text_field($currency));

    return in_array($currency, $allowed, true) ? $currency : 'INR';
}

/**
 * Render a single product card (server-side HTML)
 *
 * @param array $item Product item data
 * @param int $index Card index (for lazy loading optimization)
 * @return string HTML markup for card
 */
function giftsmate_render_card($item, $index = 0) {
    // Extra classes via filter
    $extra_classes = apply_filters('giftsmate_card_classes', '');

    // Lazy load images except first 2 (LCP optimization)
    $loading_strategy = apply_filters('giftsmate_snapshot_image_loading', 'lazy');
    $loading = ($index < 2) ? 'eager' : $loading_strategy;

    // Truncate title to prevent layout issues
    $title = $item['title'];
    if (mb_strlen($title) > 80) {
        $title = mb_substr($title, 0, 77) . '...';
    }

    // Format price (convert paise to rupees for display)
    $price_display = number_format($item['price'] / 100, 2);
    if ($item['currency'] === 'INR') {
        $price_display = '₹' . $price_display;
    } else {
        $price_display = $item['currency'] . ' ' . $price_display;
    }

    ob_start();
    ?>
    <article class="gm-chat-shell__card <?php echo esc_attr($extra_classes); ?>" itemscope itemtype="https://schema.org/Product">
        <a href="<?php echo esc_url($item['url']); ?>" class="gm-card__link" rel="noopener">
            <div class="gm-card__image-wrapper">
                <img
                    src="<?php echo esc_url($item['image']); ?>"
                    alt="<?php echo esc_attr($title); ?>"
                    class="gm-card__image"
                    loading="<?php echo esc_attr($loading); ?>"
                    itemprop="image"
                />
                <?php if (!empty($item['badge'])): ?>
                    <span class="gm-badge"><?php echo esc_html($item['badge']); ?></span>
                <?php endif; ?>
            </div>

            <h3 class="gm-card__title" itemprop="name">
                <?php echo esc_html($title); ?>
            </h3>

            <div class="gm-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                <meta itemprop="priceCurrency" content="<?php echo esc_attr($item['currency']); ?>" />
                <meta itemprop="price" content="<?php echo esc_attr($item['price'] / 100); ?>" />
                <span class="gm-price-amount"><?php echo esc_html($price_display); ?></span>
            </div>
        </a>
    </article>
    <?php
    return ob_get_clean();
}

/**
 * Generate ItemList structured data (JSON-LD)
 *
 * @param array $items Product items (max first 8)
 * @return string JSON-LD script tag or empty string if disabled
 */
function giftsmate_generate_itemlist_schema($items) {
    // Check if schema is enabled
    if (!apply_filters('giftsmate_emit_itemlist_schema', true)) {
        return '';
    }

    // Need at least 3 items for meaningful list
    if (count($items) < 3) {
        return '';
    }

    // Limit to first 8 items to keep size under control
    $items = array_slice($items, 0, 8);

    $list_items = array();
    foreach ($items as $index => $item) {
        $list_items[] = array(
            '@type'    => 'ListItem',
            'position' => $index + 1,
            'item'     => array(
                '@type'  => 'Product',
                'name'   => $item['title'],
                'url'    => $item['url'],
                'image'  => $item['image'],
                'offers' => array(
                    '@type'         => 'Offer',
                    'price'         => $item['price'] / 100,
                    'priceCurrency' => $item['currency'],
                ),
            ),
        );
    }

    $schema = array(
        '@context'        => 'https://schema.org',
        '@type'           => 'ItemList',
        'itemListElement' => $list_items,
    );

    $json = wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    // Size check: keep under 8KB
    if (strlen($json) > 8192) {
        return ''; // Too large, skip
    }

    return '<script type="application/ld+json">' . $json . '</script>' . "\n";
}
