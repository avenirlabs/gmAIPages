<?php
/**
 * Admin Settings Page
 *
 * Provides settings interface, shortcode generator, and saved shortcodes list
 */

// Security: Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register admin menu
 */
function giftsmate_admin_menu() {
    add_options_page(
        'Giftsmate Chat Settings',           // Page title
        'Giftsmate Chat',                    // Menu title
        'manage_options',                    // Capability
        'giftsmate-chat',                    // Menu slug
        'giftsmate_admin_page_html'          // Callback function
    );
}
add_action('admin_menu', 'giftsmate_admin_menu');

/**
 * Register settings
 */
function giftsmate_register_settings() {
    register_setting('giftsmate_settings', 'giftsmate_api_base');
    register_setting('giftsmate_settings', 'giftsmate_default_snapshot_limit');
    register_setting('giftsmate_settings', 'giftsmate_cache_duration');
    register_setting('giftsmate_settings', 'giftsmate_enable_analytics');
    register_setting('giftsmate_settings', 'giftsmate_saved_shortcodes');
}
add_action('admin_init', 'giftsmate_register_settings');

/**
 * Get default settings
 */
function giftsmate_get_default_settings() {
    return array(
        'api_base' => 'https://gm-ai-pages.vercel.app',
        'default_snapshot_limit' => 8,
        'cache_duration' => 3600,
        'enable_analytics' => true,
    );
}

/**
 * Admin page HTML
 */
function giftsmate_admin_page_html() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }

    // Get current tab
    $active_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'settings';

    // Handle saved shortcodes
    $saved_shortcodes = get_option('giftsmate_saved_shortcodes', array());

    // Handle delete shortcode
    if (isset($_POST['delete_shortcode']) && check_admin_referer('giftsmate_delete_shortcode')) {
        $index = intval($_POST['shortcode_index']);
        if (isset($saved_shortcodes[$index])) {
            unset($saved_shortcodes[$index]);
            $saved_shortcodes = array_values($saved_shortcodes); // Re-index
            update_option('giftsmate_saved_shortcodes', $saved_shortcodes);
            echo '<div class="notice notice-success"><p>Shortcode deleted successfully.</p></div>';
        }
    }

    // Handle save new shortcode
    if (isset($_POST['save_shortcode']) && check_admin_referer('giftsmate_save_shortcode')) {
        $new_shortcode = array(
            'name' => sanitize_text_field($_POST['shortcode_name']),
            'shortcode' => wp_kses_post($_POST['generated_shortcode']),
            'created' => current_time('mysql'),
        );
        $saved_shortcodes[] = $new_shortcode;
        update_option('giftsmate_saved_shortcodes', $saved_shortcodes);
        echo '<div class="notice notice-success"><p>Shortcode saved successfully!</p></div>';
    }

    // Get settings
    $defaults = giftsmate_get_default_settings();
    $api_base = get_option('giftsmate_api_base', $defaults['api_base']);
    $snapshot_limit = get_option('giftsmate_default_snapshot_limit', $defaults['default_snapshot_limit']);
    $cache_duration = get_option('giftsmate_cache_duration', $defaults['cache_duration']);
    $enable_analytics = get_option('giftsmate_enable_analytics', $defaults['enable_analytics']);

    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <h2 class="nav-tab-wrapper">
            <a href="?page=giftsmate-chat&tab=settings" class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>">
                Settings
            </a>
            <a href="?page=giftsmate-chat&tab=generator" class="nav-tab <?php echo $active_tab === 'generator' ? 'nav-tab-active' : ''; ?>">
                Shortcode Generator
            </a>
            <a href="?page=giftsmate-chat&tab=saved" class="nav-tab <?php echo $active_tab === 'saved' ? 'nav-tab-active' : ''; ?>">
                Saved Shortcodes (<?php echo count($saved_shortcodes); ?>)
            </a>
        </h2>

        <?php if ($active_tab === 'settings') : ?>
            <!-- SETTINGS TAB -->
            <form method="post" action="options.php">
                <?php
                settings_fields('giftsmate_settings');
                ?>

                <table class="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row">
                                <label for="giftsmate_api_base">API Base URL</label>
                            </th>
                            <td>
                                <input type="url"
                                       id="giftsmate_api_base"
                                       name="giftsmate_api_base"
                                       value="<?php echo esc_attr($api_base); ?>"
                                       class="regular-text"
                                       placeholder="https://gm-ai-pages.vercel.app">
                                <p class="description">
                                    Default: <code>https://gm-ai-pages.vercel.app</code>
                                    <br>This is the base URL for API endpoints (snapshots, metrics, chat).
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="giftsmate_default_snapshot_limit">Default Snapshot Limit</label>
                            </th>
                            <td>
                                <input type="number"
                                       id="giftsmate_default_snapshot_limit"
                                       name="giftsmate_default_snapshot_limit"
                                       value="<?php echo esc_attr($snapshot_limit); ?>"
                                       min="6"
                                       max="24"
                                       class="small-text">
                                <p class="description">
                                    Number of product cards to display (6-24). Default: 8
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="giftsmate_cache_duration">Cache Duration (seconds)</label>
                            </th>
                            <td>
                                <input type="number"
                                       id="giftsmate_cache_duration"
                                       name="giftsmate_cache_duration"
                                       value="<?php echo esc_attr($cache_duration); ?>"
                                       min="60"
                                       max="86400"
                                       class="small-text">
                                <p class="description">
                                    How long to cache snapshot data. Default: 3600 seconds (1 hour)
                                    <br>Min: 60 seconds, Max: 86400 seconds (24 hours)
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                Enable Analytics
                            </th>
                            <td>
                                <fieldset>
                                    <label>
                                        <input type="checkbox"
                                               name="giftsmate_enable_analytics"
                                               value="1"
                                               <?php checked($enable_analytics, true); ?>>
                                        Send anonymous usage analytics
                                    </label>
                                    <p class="description">
                                        Enables privacy-first event tracking (snapshot views, chip clicks, etc.)
                                        <br><strong>No PII is collected</strong> - only aggregate interaction events.
                                    </p>
                                </fieldset>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <?php submit_button('Save Settings'); ?>

                <hr>

                <h3>Available Snapshot Keys</h3>
                <p>These snapshot keys are pre-configured and ready to use:</p>
                <ul style="list-style: disc; margin-left: 2em;">
                    <li><code>dad-birthday</code> - Birthday gifts for dad (8 products)</li>
                    <li><code>mom-anniversary</code> - Anniversary gifts for mom (8 products)</li>
                    <li><code>tech-lover</code> - Tech enthusiast gifts (8 products)</li>
                </ul>

                <h3>API Status</h3>
                <p>
                    <a href="<?php echo esc_url($api_base . '/api/debug'); ?>" target="_blank" class="button">
                        Test API Connection
                    </a>
                </p>
            </form>

        <?php elseif ($active_tab === 'generator') : ?>
            <!-- SHORTCODE GENERATOR TAB -->
            <div style="max-width: 900px;">
                <h2>Shortcode Generator</h2>
                <p>Use this tool to create a custom shortcode for your gift finder widget.</p>

                <form id="giftsmate-generator-form">
                    <table class="form-table" role="presentation">
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <label for="gen_relationship">Relationship</label>
                                </th>
                                <td>
                                    <input type="text"
                                           id="gen_relationship"
                                           name="relationship"
                                           class="regular-text"
                                           placeholder="e.g., dad, mom, husband, wife">
                                    <p class="description">Who is the gift for?</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_occasion">Occasion</label>
                                </th>
                                <td>
                                    <input type="text"
                                           id="gen_occasion"
                                           name="occasion"
                                           class="regular-text"
                                           placeholder="e.g., birthday, anniversary, diwali">
                                    <p class="description">What's the occasion?</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_snapshot_key">Snapshot Key</label>
                                </th>
                                <td>
                                    <select id="gen_snapshot_key" name="snapshot_key" class="regular-text">
                                        <option value="">-- None (show placeholders) --</option>
                                        <option value="dad-birthday">dad-birthday</option>
                                        <option value="mom-anniversary">mom-anniversary</option>
                                        <option value="tech-lover">tech-lover</option>
                                    </select>
                                    <p class="description">Pre-configured product snapshots</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_chips">Chips (Filter Options)</label>
                                </th>
                                <td>
                                    <input type="text"
                                           id="gen_chips"
                                           name="chips"
                                           class="large-text"
                                           placeholder="Under ₹999|Tech Gadgets|Premium Gifts">
                                    <p class="description">
                                        Separate options with pipe symbol (|). Example: <code>Under ₹999|Tech|Premium</code>
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_first_prompt">First Prompt (AI)</label>
                                </th>
                                <td>
                                    <textarea id="gen_first_prompt"
                                              name="first_prompt"
                                              rows="3"
                                              class="large-text"
                                              placeholder="Show me thoughtful birthday gifts for dad under ₹2000"></textarea>
                                    <p class="description">Optional AI prompt to initialize the chat</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_snapshot_limit">Snapshot Limit</label>
                                </th>
                                <td>
                                    <input type="number"
                                           id="gen_snapshot_limit"
                                           name="snapshot_limit"
                                           value="<?php echo esc_attr($snapshot_limit); ?>"
                                           min="6"
                                           max="24"
                                           class="small-text">
                                    <p class="description">Number of product cards (6-24)</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_class">Custom CSS Class</label>
                                </th>
                                <td>
                                    <input type="text"
                                           id="gen_class"
                                           name="class"
                                           class="regular-text"
                                           placeholder="my-custom-widget">
                                    <p class="description">Add a custom CSS class for styling</p>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">
                                    <label for="gen_style">Inline CSS Styles</label>
                                </th>
                                <td>
                                    <input type="text"
                                           id="gen_style"
                                           name="style"
                                           class="large-text"
                                           placeholder="margin: 2rem 0; padding: 1rem;">
                                    <p class="description">Add inline CSS styles</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="submit">
                        <button type="button" id="generate-shortcode" class="button button-primary button-large">
                            Generate Shortcode
                        </button>
                        <button type="button" id="reset-generator" class="button button-large">
                            Reset Form
                        </button>
                    </p>
                </form>

                <div id="generated-shortcode-container" style="display:none; margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                    <h3>Generated Shortcode</h3>
                    <div style="position: relative;">
                        <textarea id="generated-shortcode-output"
                                  readonly
                                  rows="6"
                                  class="large-text code"
                                  style="font-family: monospace; font-size: 13px; background: #fff; padding: 10px;"></textarea>
                        <button type="button" id="copy-shortcode" class="button" style="margin-top: 10px;">
                            📋 Copy to Clipboard
                        </button>
                        <span id="copy-success" style="display:none; color: green; margin-left: 10px;">✓ Copied!</span>
                    </div>

                    <form method="post" style="margin-top: 1rem;">
                        <?php wp_nonce_field('giftsmate_save_shortcode'); ?>
                        <input type="hidden" name="generated_shortcode" id="save-shortcode-value">
                        <label for="shortcode_name" style="display: block; margin-bottom: 5px;">
                            <strong>Save this shortcode for later:</strong>
                        </label>
                        <input type="text"
                               name="shortcode_name"
                               id="shortcode_name"
                               placeholder="e.g., Dad Birthday Page"
                               class="regular-text"
                               required>
                        <button type="submit" name="save_shortcode" class="button button-secondary">
                            💾 Save Shortcode
                        </button>
                    </form>
                </div>
            </div>

        <?php else : ?>
            <!-- SAVED SHORTCODES TAB -->
            <div style="max-width: 1200px;">
                <h2>Saved Shortcodes</h2>

                <?php if (empty($saved_shortcodes)) : ?>
                    <p>No saved shortcodes yet. Use the <a href="?page=giftsmate-chat&tab=generator">Shortcode Generator</a> to create and save shortcodes.</p>
                <?php else : ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Name</th>
                                <th style="width: 50%;">Shortcode</th>
                                <th style="width: 15%;">Created</th>
                                <th style="width: 15%;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($saved_shortcodes as $index => $shortcode) : ?>
                                <tr>
                                    <td>
                                        <strong><?php echo esc_html($shortcode['name']); ?></strong>
                                    </td>
                                    <td>
                                        <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 12px; display: block; overflow-x: auto;">
                                            <?php echo esc_html($shortcode['shortcode']); ?>
                                        </code>
                                    </td>
                                    <td>
                                        <?php echo esc_html(date('M j, Y', strtotime($shortcode['created']))); ?>
                                    </td>
                                    <td>
                                        <button type="button"
                                                class="button copy-saved-shortcode"
                                                data-shortcode="<?php echo esc_attr($shortcode['shortcode']); ?>">
                                            📋 Copy
                                        </button>
                                        <form method="post" style="display: inline;">
                                            <?php wp_nonce_field('giftsmate_delete_shortcode'); ?>
                                            <input type="hidden" name="shortcode_index" value="<?php echo esc_attr($index); ?>">
                                            <button type="submit"
                                                    name="delete_shortcode"
                                                    class="button"
                                                    onclick="return confirm('Are you sure you want to delete this shortcode?')">
                                                🗑️ Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- JavaScript for Shortcode Generator -->
    <script>
    jQuery(document).ready(function($) {
        // Generate shortcode
        $('#generate-shortcode').on('click', function() {
            var attrs = [];
            var relationship = $('#gen_relationship').val().trim();
            var occasion = $('#gen_occasion').val().trim();
            var snapshot_key = $('#gen_snapshot_key').val();
            var chips = $('#gen_chips').val().trim();
            var first_prompt = $('#gen_first_prompt').val().trim();
            var snapshot_limit = $('#gen_snapshot_limit').val();
            var css_class = $('#gen_class').val().trim();
            var style = $('#gen_style').val().trim();

            if (relationship) attrs.push('relationship="' + relationship + '"');
            if (occasion) attrs.push('occasion="' + occasion + '"');
            if (snapshot_key) attrs.push('snapshot_key="' + snapshot_key + '"');
            if (chips) attrs.push('chips="' + chips + '"');
            if (first_prompt) attrs.push('first_prompt="' + first_prompt + '"');
            if (snapshot_limit && snapshot_limit !== '<?php echo esc_js($snapshot_limit); ?>') {
                attrs.push('snapshot_limit="' + snapshot_limit + '"');
            }
            if (css_class) attrs.push('class="' + css_class + '"');
            if (style) attrs.push('style="' + style + '"');

            var shortcode = '[giftsmate_chat';
            if (attrs.length > 0) {
                shortcode += '\n    ' + attrs.join('\n    ');
                shortcode += ']';
            } else {
                shortcode += ']';
            }

            $('#generated-shortcode-output').val(shortcode);
            $('#save-shortcode-value').val(shortcode);
            $('#generated-shortcode-container').slideDown();
        });

        // Reset form
        $('#reset-generator').on('click', function() {
            $('#giftsmate-generator-form')[0].reset();
            $('#generated-shortcode-container').slideUp();
        });

        // Copy shortcode
        $('#copy-shortcode').on('click', function() {
            var textarea = document.getElementById('generated-shortcode-output');
            textarea.select();
            document.execCommand('copy');

            $('#copy-success').fadeIn().delay(2000).fadeOut();
        });

        // Copy saved shortcode
        $('.copy-saved-shortcode').on('click', function() {
            var shortcode = $(this).data('shortcode');
            var temp = $('<textarea>');
            $('body').append(temp);
            temp.val(shortcode).select();
            document.execCommand('copy');
            temp.remove();

            var btn = $(this);
            var originalText = btn.text();
            btn.text('✓ Copied!').css('color', 'green');
            setTimeout(function() {
                btn.text(originalText).css('color', '');
            }, 2000);
        });
    });
    </script>

    <style>
    .nav-tab-wrapper {
        margin-bottom: 20px;
    }
    .code {
        font-family: Consolas, Monaco, monospace;
    }
    </style>
    <?php
}
