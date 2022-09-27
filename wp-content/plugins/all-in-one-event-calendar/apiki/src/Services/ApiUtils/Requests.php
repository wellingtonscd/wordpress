<?php declare( strict_types = 1 );

namespace App\Services\ApiUtils;

/**
 * Static class containing all the utility functions related to authentication.
 */
class Requests {

	public const API_URL = 'https://timelyapp.time.ly/api';

	/** @return array<string> */
	public static function timely_request( string $url ): array {
		$args = array(
			'headers' => array(
				'X-Auth-Token' => Auth::get_user_token(),
				'Accept' => 'application/json',
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			if ( 401 === wp_remote_retrieve_response_code( $response ) ) {
				Auth::delete_user_token();
			}

			return [];
		}

		$response_json = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $response_json ) {
			return $response_json;
		}

		return [
			'status_code' => 200,
			'message' => 'OK',
		];
	}

}
