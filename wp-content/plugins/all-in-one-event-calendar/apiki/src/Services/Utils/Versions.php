<?php declare(strict_types = 1);

namespace App\Services\Utils;

/**
 * Static class containing all the utility functions related to versioning.
 */
class Versions {

	/**
	 * Return the current WordPress version.
	 */
	public static function get_wp_version(): string {
		global $wp_version;

		return self::parse_version( $wp_version );
	}

	/**
	 * Return the current PHP version.
	 */
	public static function get_php_version(): string {
		return self::parse_version( phpversion() );
	}

	/**
	 * Return true if the current PHP version is supported.
	 */
	public static function is_php_version_supported(): bool {
		return version_compare( phpversion(), TIMELY_REQUIRED_PHP_VERSION, '<' );
	}

	/**
	 * Return true if the current WordPress version is supported.
	 */
	public static function is_wp_version_supported(): bool {
		global $wp_version;

		return version_compare( $wp_version, TIMELY_REQUIRED_WP_VERSION, '<' );
	}

	/**
	 * Return the given version until the patch version
	 * eg: 6.4.2.1-beta => 6.4.2
	 *
	 * @param String $version version.
	 */
	private static function parse_version( string $version ): string {
		preg_match( '/^\d+(\.\d+){0,2}/', $version, $match );

		if ( ! isset( $match ) ) {
			return '';
		}

		return $match[0];
	}

}
