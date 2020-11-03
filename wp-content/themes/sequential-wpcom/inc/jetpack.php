<?php
/**
 * Jetpack Compatibility File
 * See: http://jetpack.com/
 *
 * @package Sequential
 */

function sequential_jetpack_setup() {
	// Add theme support for Infinite Scroll.
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'main',
		'footer_widgets' => array(
			'sidebar-2',
		),
		'footer'         => 'page',
		'render'    	 => 'sequential_infinite_scroll_render',
	) );

	// Add theme support for Responsive Videos.
	add_theme_support( 'jetpack-responsive-videos' );

	// Add theme support for Testimonial CPT.
	add_image_size( 'sequential-avatar', 96, 96, true );
	add_theme_support( 'jetpack-testimonial' );

	//Add theme support for Content Options.
	add_theme_support( 'jetpack-content-options', array(
		'blog-display'    => 'content',
		'post-details'    => array(
			'stylesheet' => 'sequential-style',
			'date'       => '.posted-on',
			'categories' => '.cat-links',
			'tags'       => '.tags-links',
			'author'     => '.byline',
		),
		'featured-images' => array(
			'archive'    => true,
			'post'       => true,
		),
	) );
}
add_action( 'after_setup_theme', 'sequential_jetpack_setup' );

/**
 * Disable Infinite Scroll for the Testimonial CPT
 * @return bool
 */
function sequential_infinite_scroll_supported() {
        return current_theme_supports( 'infinite-scroll' ) && ( is_archive() || is_home() ) && ! is_post_type_archive( 'jetpack-testimonial' );
}
add_filter( 'infinite_scroll_archive_supported', 'sequential_infinite_scroll_supported' );

/**
 * Flush the Rewrite Rules for the Testimonial CPT after the user has activated the theme.
 */
function sequential_flush_rewrite_rules() {
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'sequential_flush_rewrite_rules' );

/**
 * Remove related-posts and likes scripts.
 */
function sequential_remove_jetpack_scripts() {
    wp_dequeue_style( 'jetpack_related-posts' );
    wp_dequeue_style( 'jetpack_likes' );
}
add_action( 'wp_enqueue_scripts', 'sequential_remove_jetpack_scripts' );

/**
 * Remove sharedaddy from excerpt.
 */
function sequential_remove_sharedaddy() {
    remove_filter( 'the_excerpt', 'sharing_display', 19 );
}
add_action( 'loop_start', 'sequential_remove_sharedaddy' );

/**
 * Remove Testimonial Page Featured Image option.
 */
function sequential_testimonials_customize_register( $wp_customize ) {
	$wp_customize->remove_setting( 'jetpack_testimonials[featured-image]' );
	$wp_customize->remove_control( 'jetpack_testimonials[featured-image]' );
}
add_action( 'customize_register', 'sequential_testimonials_customize_register', 11 );
