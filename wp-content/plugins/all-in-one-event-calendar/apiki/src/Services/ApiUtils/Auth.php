<?php declare( strict_types = 1 );

namespace App\Services\ApiUtils;

/**
 * Static class containing all the utility functions related to authentication.
 */
class Auth {

	public const TOKEN_NAME = 'timely_token';

	public static function auth_token(): void {
		if ( ! wp_verify_nonce( $_POST['auth_token_nonce'], 'auth_token_nonce' ) ) {
			/* Caso não seja verificado o nonce enviado, a requisição vai retornar 401 */
			echo '401';
			wp_die();
		}

		$input_post = filter_input_array( INPUT_POST );

		if ( 'logout' === $input_post['timely_action'] ) {
			if ( '' !== self::get_user_token() ) {
				self::delete_user_token();
			} else {
				echo 'logged out';
			}

			wp_die();
		}

		/* save token */
		$token = $input_post['timely_token'];
		self::set_user_token( $token );
		wp_die();
	}

	public static function set_user_token( string $token ): void {
		$user_id = get_current_user_id();
		set_transient( self::TOKEN_NAME . $user_id, $token );
	}

	public static function get_user_token(): string {
		$user_id = get_current_user_id();

		if ( get_transient( self::TOKEN_NAME . $user_id ) ) {
			return get_transient( self::TOKEN_NAME . $user_id );
		}

		return '';
	}

	public static function delete_user_token(): void {
		$user_id = get_current_user_id();
		delete_transient( self::TOKEN_NAME . $user_id );
		delete_transient( 'timely_embed_calendar' );
	}

	/** @return array<string> */
	public static function is_auth(): array {
		return Requests::timely_request( Requests::API_URL . '/users/me' );
	}

}
