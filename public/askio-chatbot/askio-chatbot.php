<?php
/**
 * Plugin Name: Askio Chatbot
 * Description: Easily add your Askio AI chatbot to your WordPress site. No coding required.
 * Version: 1.0.1
 * Author: Askio
 * Author URI: https://getaskio.xyz
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

// Add admin menu
function askio_chatbot_menu() {
    add_menu_page(
        'Askio Chatbot',
        'Askio Chatbot',
        'manage_options',
        'askio-chatbot',
        'askio_chatbot_settings_page',
        'dashicons-format-chat',
        80
    );
}
add_action('admin_menu', 'askio_chatbot_menu');

// Settings page
function askio_chatbot_settings_page() {
    if (isset($_POST['askio_chatbot_id']) && check_admin_referer('askio_save_settings')) {
        update_option('askio_chatbot_id', sanitize_text_field($_POST['askio_chatbot_id']));
        echo '<div class="updated"><p>Settings saved successfully!</p></div>';
    }

    $chatbot_id = get_option('askio_chatbot_id', '');
    ?>
    <div class="wrap">
        <h1>Askio Chatbot Settings</h1>
        <p>Enter your Chatbot ID from the <a href="https://getaskio.xyz/integrations" target="_blank">Askio Dashboard</a> to display the chatbot on your site.</p>
        <form method="post">
            <?php wp_nonce_field('askio_save_settings'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="askio_chatbot_id">Chatbot ID</label></th>
                    <td>
                        <input type="text" id="askio_chatbot_id" name="askio_chatbot_id" value="<?php echo esc_attr($chatbot_id); ?>" class="regular-text" placeholder="e.g. abc123xyz" />
                        <p class="description">You can find your Chatbot ID on the Askio Integrations page.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Settings'); ?>
        </form>
    </div>
    <?php
}

// Inject chatbot script into footer
function askio_chatbot_inject() {
    $chatbot_id = get_option('askio_chatbot_id', '');
    if (empty($chatbot_id) || is_admin()) {
        return;
    }
    // One line, loaded without holding up the page.
    ?>
    <script src="https://www.getaskio.xyz/chatbot-embed.js" data-chatbot="<?php echo esc_attr($chatbot_id); ?>" async></script>
    <?php
}
add_action('wp_footer', 'askio_chatbot_inject');
