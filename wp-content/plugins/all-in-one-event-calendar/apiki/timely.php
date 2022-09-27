<?php declare(strict_types = 1);

use Cedaro\WP\Plugin\Plugin;
use Cedaro\WP\Plugin\PluginFactory;

// =============================================
// Define Constants
// =============================================
if ( ! defined( 'TIMELY_BASE_PATH' ) ) {
	define( 'TIMELY_BASE_PATH', __FILE__ );
}

if ( ! defined( 'TIMELY_PATH' ) ) {
	define( 'TIMELY_PATH', untrailingslashit( plugins_url( '', TIMELY_BASE_PATH ) ) );
}

if ( ! defined( 'TIMELY_REQUIRED_PHP_VERSION' ) ) {
	define( 'TIMELY_REQUIRED_PHP_VERSION', '7.2' );
}

if ( ! defined( 'TIMELY_REQUIRED_WP_VERSION' ) ) {
	define( 'TIMELY_REQUIRED_WP_VERSION', '4.0' );
}

if ( ! defined( 'TIMELY_PLUGIN_VERSION' ) ) {
	define( 'TIMELY_PLUGIN_VERSION', '1.0.0' );
}

if ( ! defined( 'TIMELY_JS_BASE_PATH' ) ) {
	define( 'TIMELY_JS_BASE_PATH', TIMELY_PATH . '/dist/js' );
}

if ( ! defined( 'TIMELY_URL' ) ) {
	define( 'TIMELY_URL', 'https://app.time.ly' );
}

if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require __DIR__ . '/vendor/autoload.php';
}

/**
 * Retrieve the main plugin instance.
 */
function timely(): Plugin {
	static $instance;

	if ( null === $instance ) {
		$instance = PluginFactory::create( 'all-in-one-event-calendar' );
	}

	return $instance;
}

$container = new League\Container\Container();

/* register the reflection container as a delegate to enable auto wiring. */
$container->delegate(
	( new League\Container\ReflectionContainer() )->cacheResolutions()
);

// phpcs:ignore WordPress.WP.GlobalVariablesOverride
$plugin = timely();

$plugin->set_container( $container );
$plugin->register_hooks( $container->get( Cedaro\WP\Plugin\Provider\I18n::class ) );
$plugin->register_hooks( $container->get( WPSteak\Providers\I18n::class ) );

$config = ( require __DIR__ . '/config.php' );

foreach ( $config['service_providers'] as $service_provider ) {
	$container->addServiceProvider( $service_provider );
}

foreach ( $config['hook_providers'] as $hook_provider ) {
	$plugin->register_hooks( $container->get( $hook_provider ) );
}

add_action( 'wp_ajax_nopriv_auth_token', array( 'App\Services\ApiUtils\Auth', 'auth_token' ) );
add_action( 'wp_ajax_auth_token', array( 'App\Services\ApiUtils\Auth', 'auth_token' ) );

if ( ! function_exists( 'timely_dd' ) ) {
	function timely_dd( mixed $log ): void {
		if ( true !== WP_DEBUG ) {
			exit;
		}

		echo '<pre>';
		var_dump( $log );
		die;
	}
}

if ( ! function_exists( 'timely_write_log' ) ) {

	function timely_write_log( mixed $log ): void {
		if ( true !== WP_DEBUG ) {
			exit;
		}

		if ( is_array( $log ) || is_object( $log ) ) {
			error_log( print_r( $log, true ) );
		} else {
			error_log( $log );
		}
	}
}
