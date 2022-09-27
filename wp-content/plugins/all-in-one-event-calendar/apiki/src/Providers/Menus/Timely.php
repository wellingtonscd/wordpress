<?php declare(strict_types = 1);

namespace App\Providers\Menus;

use App\Entities\Timely as Menu;
use App\Services\ApiUtils\Auth;
use App\Services\ApiUtils\Requests;
use App\Services\Utils\Versions;
use WPSteak\Providers\AbstractHookProvider;

class Timely extends AbstractHookProvider {

	public function register_hooks(): void {
		add_action( 'admin_menu', array( $this, 'build_menu' ) );
	}

	/**
	 * Adds Timely menu to admin sidebar
	 */
	public function build_menu(): void {
		add_menu_page(
			__( 'Time.ly', 'all-in-one-event-calendar' ),
			__( 'Time.ly', 'all-in-one-event-calendar' ),
			'edit_posts',
			Menu::MENU_NAME,
			array( $this, 'build_app' ),
			TIMELY_PATH . '/resources/images/logo.svg',
			'25.1651656'
		);

		$response = Requests::timely_request( Requests::API_URL . '/products/settings/cms' );
		$sign_in = 'timely_signin';
		$get_data = filter_input_array( INPUT_GET );
		$page = null;

		if ( isset( $get_data['page'] ) && false !== strpos( $get_data['page'], 'timely' ) ) {
			$page = $get_data['page'];
		}

		if ( ! $response ) {
			if ( $page && $page !== $sign_in ) {
				if ( wp_safe_redirect( get_admin_url() . 'admin.php?page=' . $sign_in ) ) {
					exit;
				}
			}

			add_submenu_page(
				Menu::MENU_NAME,
				__( 'Sign In', 'all-in-one-event-calendar' ),
				__( 'Sign In', 'all-in-one-event-calendar' ),
				'edit_posts',
				$sign_in,
				array( $this, 'build_app' )
			);
		} else {
			$response_menu = $response['menu'];
			$response_embed = $response['embed_calendar'];

			if ( ! get_transient( 'timely_embed_calendar' ) ) {
				set_transient( 'timely_embed_calendar', 1, DAY_IN_SECONDS );

				if ( get_option( 'timely_embed_calendar_script' ) ) {
					update_option( 'timely_embed_calendar_script', $response_embed['script'] );
					update_option( 'timely_embed_calendar_instruction', $response_embed['instruction'] );
				} else {
					add_option( 'timely_embed_calendar_script', $response_embed['script'] );
					add_option( 'timely_embed_calendar_instruction', $response_embed['instruction'] );
				}
			}

			if ( $page && $page === $sign_in ) {
				$slug_redirect = 'timely_' .
					str_replace( '+', '_', urlencode( strtolower( $response_menu[0]['name'] ) ) );

				if ( wp_safe_redirect( get_admin_url() . 'admin.php?page=' . $slug_redirect ) ) {
					exit;
				}
			}

			$items_menu = [];

			foreach ( $response_menu as $item_menu ) {
				$menu_name = $item_menu['name'];

				/* set url */
				if ( $item_menu['url'] && false === strpos( $item_menu['url'], '://' ) ) {
					$item_menu['url'] = TIMELY_URL . $item_menu['url'];
				}

				$slug = 'timely_' . str_replace( '+', '_', urlencode( strtolower( $menu_name ) ) );

				if ( '_blank' === $item_menu['target'] ) {
					$item_url = str_replace( 'https://', '', $item_menu['url'] );
					$slug .= '#timely=' . $item_url;
				}

				if ( 'embed_calendar' === $item_menu['target'] ) {
					$slug = 'cmstimely_' . $item_menu['target'];
				}

				$items_menu[ $slug ] = $item_menu['url']
					? str_replace( 'wp=1', 'cms=1', $item_menu['url'] )
					: '';

				add_submenu_page(
					Menu::MENU_NAME,
					$menu_name,
					$menu_name,
					'edit_posts',
					$slug,
					array(
						$this,
						'embed_calendar' === $item_menu['target']
							? 'build_embed'
							: 'build_app',
					)
				);
			}

			if ( wp_cache_get( 'timely_items_menu' ) ) {
				wp_cache_replace( 'timely_items_menu', $items_menu );
			} else {
				wp_cache_set( 'timely_items_menu', $items_menu );
			}
		}

		remove_submenu_page( Menu::MENU_NAME, Menu::MENU_NAME );
	}

	/**
	 * Renders the timely admin page.
	 */
	public function build_app(): void {
		wp_enqueue_style(
			'timely-iframe',
			TIMELY_PATH . '/dist/styles/iframe.css',
			[],
			1.0
		);

		wp_enqueue_script( 'timely-iframe', TIMELY_PATH . '/dist/iframe.js', array( 'jquery' ), 1.0, false );

		global $wp;
		$nonce = wp_create_nonce( 'auth_token_nonce' );
		$items_menu = wp_cache_get( 'timely_items_menu' );
		$current_url = home_url( add_query_arg( $wp->query_vars, $wp->request ) );
		$url = Auth::is_auth()
			? TIMELY_URL . '?cms=1&callback_url=' . urlencode( $current_url )
			: TIMELY_URL . '/login?cms=1&callback_url=' . urlencode( $current_url );

		if ( $items_menu ) {
			$get_data = filter_input_array( INPUT_GET );
			$page = null;

			if ( isset( $get_data['page'] ) && false !== strpos( $get_data['page'], 'timely' ) ) {
				$page = $get_data['page'];
			}

			if ( Requests::timely_request( $items_menu[ $page ] ) ) {
				$url = $items_menu[ $page ];
			}
		}

		wp_localize_script(
			'timely-iframe',
			'ajax_object',
			array(
				'xhr_url' => admin_url( 'admin-ajax.php' ),
				'auth_token_nonce' => $nonce,
				'iframe_url' => $url,
			)
		);

		$error_message = '';

		if ( Versions::is_php_version_supported() ) {
			$error_message = sprintf(
				/* translators: %1$s: plugin version, %2$s required PHP version */
				__( 'Timely %1$s requires PHP %2$s or higher. Please upgrade WordPress first.', 'all-in-one-event-calendar' ),
				TIMELY_PLUGIN_VERSION,
				TIMELY_REQUIRED_PHP_VERSION
			);
		} elseif ( Versions::is_wp_version_supported() ) {
			$error_message = sprintf(
				/* translators: %1$s: plugin version, %2$s required wp version */
				__( 'Timely %1$s requires PHP %2$s or higher. Please upgrade WordPress first.', 'all-in-one-event-calendar' ),
				TIMELY_PLUGIN_VERSION,
				TIMELY_REQUIRED_WP_VERSION
			);
		}

		if ( $error_message ) {
			?>
			<div class='notice notice-warning'>
				<p>
					<?php echo esc_html( $error_message ); ?>
				</p>
			</div>
			<?php
		} else {
			if ( get_transient( 'timely_update_message' ) ) :
				delete_transient( 'timely_update_message' )
				?>
				<div id="timely-update-message">
					<div class="card">
						<span class="card_text">
							The All-in-One Event Calendar version has been updated to the new SaaS version.
							</br></br>
							Enjoy your new Journey
						</span>
						<input id="timely-update-message-button" type="button" class="card_button" value="Close">
					</div>
				</div>
			<?php endif
			?>
			<div id="timely-iframe-container">
				<div class="links">
					<?php
					if ( $items_menu && count($items_menu) > 0 ) :
						foreach ( $items_menu as $key => $item ) :
							?>
								<input type="hidden" id="<?php echo esc_attr( $key ); ?>"
									value="<?php echo esc_attr( $item ); ?>" />
							<?php
							endforeach;
						endif;
					?>
				</div>
				<div id="timely-loader"  class="timely-loader">
					<svg class="circular" viewBox="25 25 50 50" style="zoom:5; opacity: 0.2">
						<circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2"
							stroke-miterlimit="10" />
					</svg>
				</div>

			</div>
			<?php
		}
	}

	public function build_embed() {
		wp_enqueue_script(
			'timely-iframe',
			TIMELY_PATH . '/dist/iframe.js',
			array( 'jquery' ),
			1.0,
			false
		);
		?>
		<h1>Embed calendar</h1>
		<h2><?php echo wp_kses_post( get_option( 'timely_embed_calendar_instruction' ) ); ?></h2>
		<h3>Calendar example:</h3>
		<?php
		echo do_shortcode( '[timely-calendar]' );
	}

}
