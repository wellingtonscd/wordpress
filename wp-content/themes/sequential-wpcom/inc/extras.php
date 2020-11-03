<?php
/**
 * Custom functions that act independently of the theme templates
 *
 * Eventually, some of the functionality here could be replaced by core features
 *
 * @package Sequential
 */

/**
 * Get our wp_nav_menu() fallback, wp_page_menu(), to show a home link.
 *
 * @param array $args Configuration arguments.
 * @return array
 */
function sequential_page_menu_args( $args ) {
	$args['show_home'] = true;
	return $args;
}
add_filter( 'wp_page_menu_args', 'sequential_page_menu_args' );

/**
 * Adds custom classes to the array of body classes.
 *
 * @param array $classes Classes for the body element.
 * @return array
 */
function sequential_body_classes( $classes ) {
	// Adds a class of group-blog to blogs with more than 1 published author.
	if ( is_multi_author() ) {
		$classes[] = 'group-blog';
	}

	// Adds a class of no-sidebar to blogs without a sidebar
	if ( ! is_active_sidebar( 'sidebar-1' ) || is_post_type_archive( 'jetpack-testimonial' ) ) {
		$classes[] = 'no-sidebar';
	}

	// Adds a class of show-tagline to blogs depending on the theme options.
	if ( 1 == get_theme_mod( 'sequential_tagline' ) ) {
		$classes[] = 'show-tagline';
	}

	// Adds a class of full-width-layout to blogs depending on the page template.
	if ( is_page_template( 'page-templates/front-page.php' ) || is_page_template( 'page-templates/grid-page.php' ) || is_page_template( 'page-templates/full-width-page.php' ) || is_404() || is_post_type_archive( 'jetpack-testimonial' ) ) {
		$classes[] = 'full-width-layout';
	}

	// Adds a class of extra-spacing to blogs depending on the page template.
	if ( is_page_template( 'page-templates/grid-page.php' ) || is_page_template( 'page-templates/full-width-page.php' ) || is_404() ) {
		$classes[] = 'extra-spacing';
	}

	return $classes;
}
add_filter( 'body_class', 'sequential_body_classes' );

/**
 * Filters wp_title to print a neat <title> tag based on what is being viewed.
 *
 * @param string $title Default title text for current view.
 * @param string $sep Optional separator.
 * @return string The filtered title.
 */
function sequential_wp_title( $title, $sep ) {
	if ( is_feed() ) {
		return $title;
	}

	global $page, $paged;

	// Add the blog name
	$title .= get_bloginfo( 'name', 'display' );

	// Add the blog description for the home/front page.
	$site_description = get_bloginfo( 'description', 'display' );
	if ( $site_description && ( is_home() || is_front_page() ) ) {
		$title .= " $sep $site_description";
	}

	// Add a page number if necessary:
	if ( ( $paged >= 2 || $page >= 2 ) && ! is_404() ) {
		$title .= " $sep " . sprintf( esc_html__( 'Page %s', 'sequential' ), max( $paged, $page ) );
	}

	return $title;
}
add_filter( 'wp_title', 'sequential_wp_title', 10, 2 );

/**
 * Sets the authordata global when viewing an author archive.
 *
 * This provides backwards compatibility with
 * http://core.trac.wordpress.org/changeset/25574
 *
 * It removes the need to call the_post() and rewind_posts() in an author
 * template to print information about the author.
 *
 * @global WP_Query $wp_query WordPress Query object.
 * @return void
 */
function sequential_setup_author() {
	global $wp_query;

	if ( $wp_query->is_author() && isset( $wp_query->post ) ) {
		$GLOBALS['authordata'] = get_userdata( $wp_query->post->post_author );
	}
}
add_action( 'wp', 'sequential_setup_author' );

/**
 * Returns the URL from the post.
 *
 * @uses get_the_link() to get the URL in the post meta (if it exists) or
 * the first link found in the post content.
 *
 * Falls back to the post permalink if no URL is found in the post.
 *
 * @return string URL
 */
function sequential_get_link_url() {
	$content = get_the_content();
	$has_url = get_url_in_content( $content );

	return ( $has_url && has_post_format( 'link' ) ) ? $has_url : apply_filters( 'the_permalink', get_permalink() );
}

/**
 * Replaces "[...]" (appended to automatically generated excerpts) with ... and a 'Continue reading' link.
 * @return string 'Continue reading' link prepended with an ellipsis.
 */
if ( ! function_exists( 'sequential_excerpt_more' ) ) :
    function sequential_excerpt_more( $more ) {
        $link = sprintf( '<a href="%1$s" class="more-link">%2$s</a>',
            esc_url( get_permalink( get_the_ID() ) ),
            /* translators: %s: Name of current post */
            sprintf( esc_html__( 'Continue reading %s', 'sequential' ), '<span class="screen-reader-text">' . get_the_title( get_the_ID() ) . '</span>' )
            );
        return ' &hellip; ' . $link;
    }
    add_filter( 'excerpt_more', 'sequential_excerpt_more' );
endif;

/**
 * Wrap more link
 */
function sequential_more_link( $link ) {
	return '<p>' . $link . '</p>';
}
add_filter( 'the_content_more_link', 'sequential_more_link' );
