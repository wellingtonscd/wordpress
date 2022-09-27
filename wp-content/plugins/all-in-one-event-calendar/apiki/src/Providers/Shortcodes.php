<?php declare(strict_types = 1);

namespace App\Providers;

use WPSteak\Providers\AbstractHookProvider;

class Shortcodes extends AbstractHookProvider {

	/** @inheritDoc */
	public function register_hooks() {
		add_shortcode( 'timely-calendar', array( $this, 'embed_calendar' ) );
	}

	public function embed_calendar(): string {
		return is_string( get_option( 'timely_embed_calendar_script' ) ) ?
			get_option( 'timely_embed_calendar_script' ) :
			'';
	}

}
