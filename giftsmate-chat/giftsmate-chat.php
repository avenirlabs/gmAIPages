<?php
/**
 * Plugin Name: Giftsmate Chat Widget
 * Plugin URI: https://github.com/avenirlabs/gmAIPages
 * Description: Progressive-enhancement AI gift finder with server-rendered static shell and optional interactivity
 * Version: 2.1.0
 * Author: Avenir Labs
 * Author URI: https://avenirlabs.com
 * License: MIT
 * Text Domain: giftsmate-chat
 */

// Security: Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('GIFTSMATE_CHAT_VERSION', '2.1.0');
define('GIFTSMATE_CHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GIFTSMATE_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Initialize plugin
 */
function giftsmate_chat_init() {
    // Load snapshot fetcher
    require_once GIFTSMATE_CHAT_PLUGIN_DIR . 'includes/snapshot-fetcher.php';

    // Register shortcode
    require_once GIFTSMATE_CHAT_PLUGIN_DIR . 'includes/shortcode.php';
    giftsmate_register_shortcodes();

    // Load admin page (only in admin area)
    if (is_admin()) {
        require_once GIFTSMATE_CHAT_PLUGIN_DIR . 'includes/admin-page.php';
    }
}
add_action('init', 'giftsmate_chat_init');

/**
 * Enqueue inline styles (only when shortcode is used)
 * This is handled per-shortcode to avoid loading on every page
 */
function giftsmate_chat_enqueue_styles() {
    // Styles are inlined in shortcode output for better performance
    // No separate CSS file needed for static shell
}
