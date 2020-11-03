/**
 * This file holds The SEO Framework plugin's JS code for the Post SEO Settings.
 * Serve JavaScript as an addition, not as an ends or means.
 *
 * @author Sybre Waaijer <https://cyberwire.nl/>
 * @link <https://wordpress.org/plugins/autodescription/>
 */

/**
 * The SEO Framework plugin
 * Copyright (C) 2019 - 2020 Sybre Waaijer, CyberWire (https://cyberwire.nl/)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published
 * by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

/**
 * Holds tsfPost values in an object to avoid polluting global namespace.
 *
 * @since 4.0.0
 *
 * @constructor
 * @param {!jQuery} $ jQuery object.
 */
window.tsfPost = function( $ ) {

	/**
	 * Data property injected by WordPress l10n handler.
	 *
	 * @since 4.0.0
	 * @access public
	 * @type {(Object<string, *>)|boolean|null} l10n Localized strings
	 */
	const l10n = 'undefined' !== typeof tsfPostL10n && tsfPostL10n;

	/**
	 * @since 4.1.0
	 * @access private
	 * @type {string}
	 */
	const _titleId = 'autodescription_title';
	/**
	 * @since 4.1.0
	 * @access private
	 * @type {string}
	 */
	const _descId = 'autodescription_description';

	/**
	 * Registers on resize/orientationchange listeners and debounces to only run
	 * at set intervals.
	 *
	 * For Flexbox implementation.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {(undefined|null)}
	 */
	const _doFlexResizeListener = () => {

		if ( ! document.querySelector( '.tsf-flex' ) ) return;

		let overflowAnimationFrame = {};
		const calculateTextOverflow = target => {

			let innerWrap = target.querySelector( '.tsf-flex-nav-tab-inner' ),
				navNames  = target.getElementsByClassName( 'tsf-flex-nav-name' );

			let displayNames = innerWrap.clientWidth <= target.clientWidth;

			if ( displayNames ) {
				if ( +( target.dataset.displayedNames || 1 ) ) return; // Names are displayed by default on-load. Ergo, 1 by default.
				target.dataset.displayedNames = 1;
				$( navNames ).stop( false, true ).fadeIn( 250 );
				// didShow = true;
			} else {
				if ( ! +( target.dataset.displayedNames || 1 ) ) return;
				target.dataset.displayedNames = 0;
				// Don't animate, we're overflowing--rectify that ASAP.
				$( navNames ).hide();
			}

			if ( +target.dataset.displayedNames ) {
				if ( innerWrap.clientWidth > target.clientWidth ) {
					$( navNames ).stop( false, true ).hide();
					target.dataset.displayedNames = 0;
				} else {
					// Loop once just to be certain, for the browser may be too slow to notice the offset change.
					// Usually, this only happens once when the navNames are meant to be displayed (target width growing).
					setTimeout( () => {
						cancelAnimationFrame( overflowAnimationFrame[ target.id ] );
						overflowAnimationFrame[ target.id ] = requestAnimationFrame( () => calculateTextOverflow( target ) );
					}, 7 ); // 144hz
				}
			}
		}
		const prepareCalculateTextOverflow = event => {
			let target = event.detail.target || document.getElementById( 'tsf-flex-inpost-tabs-wrapper' );
			if ( ! target ) return;
			overflowAnimationFrame[ target.id ] = requestAnimationFrame( () => calculateTextOverflow( target ) );
		}
		window.addEventListener( 'tsf-flex-resize', prepareCalculateTextOverflow );

		/**
		 * Triggers resize on event.
		 *
		 * @function
		 * @param {HTMLElement|undefined} target The target that's being resized. Optional.
		 * @return {undefined}
		 */
		const triggerResize = target => {
			window.dispatchEvent( new CustomEvent( 'tsf-flex-resize', {
				bubbles:    false,
				cancelable: false,
				detail:     {
					target
				},
			} ) );
		}
		if ( 'undefined' !== typeof window.ResizeObserver ) {
			let resizeAnimationFrame = {};
			const resizeObserver = new ResizeObserver( entries => {
				// There should be only one entry... Nevertheless, let's loop this for we might add more metaboxes.
				for ( const entry of entries ) {
					let target = entry.target;
					cancelAnimationFrame( resizeAnimationFrame[ target.id ] );
					resizeAnimationFrame[ target.id ] = requestAnimationFrame( () => {
						// No support for all major browsers yet. Neither for entry.contentRect.
						// if ( ! entry.dataset.boxSizeWidth ) {
						// 	entry.dataset.boxSizeWidth = 0;
						// }
						// entry.dataset.boxSizeWidth = contentBoxSize.inlineSize;

						if ( ! target.dataset.lastWidth ) {
							target.dataset.lastWidth = 0;
						}
						if ( +target.clientWidth !== +target.dataset.lastWidth ) {
							target.dataset.lastWidth = target.clientWidth;
							triggerResize( target );
						}
					} );
				}
			} );
			resizeObserver.observe( document.getElementById( 'tsf-flex-inpost-tabs-wrapper' ) );
		} else {
			/**
			 * Set asynchronous timeout because we need to wait for some actions to complete.
			 * Also forward without event data. triggerResize's first parameter may not be of type Event.
			 */
			const triggerEdgeResize = () => setTimeout( triggerResize, 10 );

			// EdgeHTML fallback support. Microsoft, release Edge Chromium already!
			// Not detailed, not optimized. Edge case. Ha! Get it? ...
			$( document ).on( 'wp-window-resized orientationchange', triggerEdgeResize );
			$( '#collapse-menu' ).on( 'click', triggerEdgeResize );
			$( '.columns-prefs :input[type=radio]' ).on( 'change', triggerEdgeResize );
			$( '.meta-box-sortables' ).on( 'sortupdate', triggerEdgeResize ); // Removed WP 5.5?
			$( document ).on( 'postbox-moved', triggerEdgeResize ); // New WP 5.5?
			$( '#tsf-inpost-box .handle-order-higher, #tsf-inpost-box .handle-order-lower' ).on( 'click', triggerEdgeResize );
		}

		// Trigger after setup
		triggerResize();
	}

	/**
	 * Sets the navigation tabs content equal to the buttons.
	 *
	 * @todo Merge with tsfSettings._initTabs?
	 *       It's basically a carbon copy, aside from the trigger and classes.
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {(undefined|null)}
	 */
	const _initTabs = () => {

		let togglePromises  = {},
			toggleTarget    = {},
			toggleWrap      = {},
			toggleContainer = {};

		const tabToggledEvent = new CustomEvent( 'tsf-flex-tab-toggled' );

		/**
		 * Sets correct tab content and classes on toggle.
		 *
		 * @function
		 * @param {Event} event
		 * @return {(undefined|null)}
		 */
		const flexTabToggle = ( event ) => {

			const currentToggle = event.target;
			const onload        = ! event.isTrusted;

			// Why is this here? For broken customEvent triggers?
			// if ( ! currentToggle.checked ) return;

			const toggleId   = event.target.id,
				  toggleName = event.target.name;

			toggleWrap.hasOwnProperty( toggleName ) || (
				toggleWrap[ toggleName ] = currentToggle.closest( '.tsf-flex-nav-tab-wrapper' )
			);

			const activeClass       = 'tsf-flex-tab-content-active',
				  toggleActiveClass = 'tsf-flex-tab-active',
				  previousToggle    = toggleWrap[ toggleName ].querySelector( `.${toggleActiveClass}` );

			if ( ! onload ) {
				// Perform validity check, this prevents non-invoking hidden browser validation errors.
				const invalidInput = document.querySelector( `.${activeClass} :invalid` );
				if ( invalidInput ) {
					invalidInput.reportValidity();

					if ( previousToggle )
						previousToggle.checked = true;

					currentToggle.checked = false;

					event.stopPropagation();
					event.preventDefault();
					return false; // stop propagation in jQuery.
				}
			}

			if ( previousToggle ) {
				previousToggle.classList.remove( toggleActiveClass );
				let label = document.querySelector( `.tsf-flex-nav-tab-label[for="${previousToggle.id}"]` );
				label && label.classList.remove( 'tsf-no-focus-ring' );
			}
			currentToggle.classList.add( toggleActiveClass );

			if ( onload ) {
				const newContent = document.getElementById( `${toggleId}-content` );

				if ( ! newContent.classList.contains( activeClass ) ) {
					const allContent = document.querySelectorAll( `.${toggleName}-content` );
					allContent && allContent.forEach( element => {
						element.classList.remove( activeClass );
					} );
					newContent && newContent.classList.add( activeClass );
				}

				document.getElementById( toggleId ).dispatchEvent( tabToggledEvent );
			} else {
				if ( ! toggleContainer.hasOwnProperty( toggleName ) ) {
					toggleContainer[ toggleName ] = currentToggle.closest( '.inside' );
					togglePromises[ toggleName ]  = void 0;
				}

				const fadeOutTimeout = 150;

				// Set toggleTarget for (active or upcoming) Promise.
				toggleTarget[ toggleName ] = toggleId;
				// If the promise is running, let it finish and consider the newly set ID.
				if ( 'undefined' !== typeof togglePromises[ toggleName ] ) return;

				const $allContent = $( '.' + toggleName + '-content' );
				const setCorrectTab = () => {
					$( `#${toggleTarget[ toggleName ]}-content` ).stop( false, true ).addClass( activeClass ).fadeIn( 250 );
					toggleContainer[ toggleName ].style.minHeight = '';
					return new Promise( resolve => setTimeout( resolve, fadeOutTimeout ) );
				};
				const lockHeight = () => {
					toggleContainer[ toggleName ].style.minHeight = toggleContainer[ toggleName ].getBoundingClientRect().height;
				}

				togglePromises[ toggleName ] = () => new Promise( resolve => {
					// Lock height, so to prevent jumping.
					lockHeight();

					// Stop any running animations, and hide the content. Put in $.Deferred so to run the thenable only once.
					$.when( $allContent.stop( false, true ).fadeOut( fadeOutTimeout ) ).then( () => {
						$allContent.removeClass( activeClass );
						resolve();
					} );
				} ).then(
					setCorrectTab
				).then( () => {
					let toggledContent = document.getElementById( `${toggleTarget[ toggleName ]}-content` );

					// Test if the correct tab has been set--otherwise, try again.
					// Resolve if the query fails, so to prevent an infinite loop.
					if ( ! toggledContent || toggledContent.classList.contains( activeClass ) ) {
						document.getElementById( toggleTarget[ toggleName ] ).dispatchEvent( tabToggledEvent );
						togglePromises[ toggleName ] = void 0;
					} else {
						// Lock height to prevent jumping.
						lockHeight();
						// Hide everything instantly. We don't make false promises here.
						$allContent.removeClass( activeClass );
						// Retry self.
						togglePromises[ toggleName ]();
					}
				} );

				togglePromises[ toggleName ]();
			}
		}

		/**
		 * Sets a class to the active element which helps excluding focus rings.
		 *
		 * @see flexTabToggle Handles this class.
		 *
		 * @function
		 * @param {Event} event
		 * @return {(undefined|null)}
		 */
		const addNoFocusClass = event => event.currentTarget.classList.add( 'tsf-no-focus-ring' );
		document.querySelectorAll( '.tsf-flex-nav-tab-wrapper .tsf-flex-nav-tab-label' ).forEach( el => {
			el.addEventListener( 'click', addNoFocusClass );
		} );

		document.querySelectorAll( '.tsf-flex-nav-tab-radio' ).forEach( el => {
			el.addEventListener( 'change', flexTabToggle );
		} );
		document.querySelectorAll( '.tsf-flex-nav-tab-radio:checked' ).forEach( el => {
			el.dispatchEvent( new Event( 'change' ) );
		} );
	}

	/**
	 * Initializes canonical URL meta input listeners.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initCanonicalInput = () => {

		let canonicalInput = $( '#autodescription_canonical' );

		if ( ! canonicalInput ) return;

		const updateCanonical = ( link ) => {
			canonicalInput.attr( 'placeholder', link );
		}

		$( document ).on( 'tsf-updated-gutenberg-link', ( event, link ) => updateCanonical( link ) );
	}

	/**
	 * Initializes title meta input listeners.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initTitleListeners = () => {

		const titleInput = document.getElementById( _titleId );
		if ( ! titleInput ) return;

		const blogNameTrigger = document.getElementById( 'autodescription_title_no_blogname' );

		tsfTitle.setInputElement( titleInput );

		let state = JSON.parse(
			document.getElementById( 'tsf-title-data_' + _titleId ).dataset.state
		);

		tsfTitle.updateStateOf( _titleId, 'allowReferenceChange', ! state.refTitleLocked );
		tsfTitle.updateStateOf( _titleId, 'defaultTitle', state.defaultTitle.trim() );
		tsfTitle.updateStateOf( _titleId, 'addAdditions', state.addAdditions );
		tsfTitle.updateStateOf( _titleId, 'useSocialTagline', !! ( state.useSocialTagline || false ) );
		tsfTitle.updateStateOf( _titleId, 'additionValue', state.additionValue.trim() );
		tsfTitle.updateStateOf( _titleId, 'additionPlacement', state.additionPlacement );
		tsfTitle.updateStateOf( _titleId, 'hasLegacy', !! ( state.hasLegacy || false ) );

		/**
		 * Updates title additions, based on singular settings change.
		 *
		 * @function
		 * @param {Event} event
		 * @return {undefined}
		 */
		const updateTitleAdditions = event => {
			let prevAddAdditions = tsfTitle.getStateOf( _titleId, 'addAdditions' ),
				addAdditions     = ! event.target.checked;

			if ( l10n.params.additionsForcedDisabled ) {
				addAdditions = false;
			} else if ( l10n.params.additionsForcedEnabled ) {
				addAdditions = true;
			}

			if ( prevAddAdditions !== addAdditions ) {
				tsfTitle.updateStateOf( _titleId, 'addAdditions', addAdditions );
			}
		}
		if ( blogNameTrigger ) {
			blogNameTrigger.addEventListener( 'change', updateTitleAdditions );
			blogNameTrigger.dispatchEvent( new Event( 'change' ) );
		}

		/**
		 * Sets private/protected visibility state.
		 *
		 * @function
		 * @param {string} visibility
		 * @return {undefined}
		 */
		const setTitleVisibilityPrefix = ( visibility ) => {

			let oldPrefixValue = tsfTitle.getStateOf( _titleId, 'prefixValue' ),
				prefixValue    = '';

			switch ( visibility ) {
				case 'password':
					prefixValue = tsfTitle.protectedPrefix;
					break;

				case 'private':
					prefixValue = tsfTitle.privatePrefix;
					break;

				default:
				case 'public':
					prefixValue = '';
					break;
			}

			if ( prefixValue !== oldPrefixValue )
				tsfTitle.updateStateOf( _titleId, 'prefixValue', prefixValue );
		}
		$( document ).on( 'tsf-updated-gutenberg-visibility', ( event, visibility ) => setTitleVisibilityPrefix( visibility ) );

		/**
		 * Sets private/protected visibility state for the classic editor.
		 *
		 * @function
		 * @param {Event} event
		 * @return {undefined}
		 */
		const setClassicTitleVisibilityPrefix = ( event ) => {
			let visibility = $( '#visibility' ).find( 'input:radio:checked' ).val();
			if ( 'password' === visibility ) {
				let pass = $( '#visibility' ).find( '#post_password' ).val();
				// A falsy-password (like '0'), will return true in "SOME OF" WP's front-end PHP, false in WP's JS before submitting...
				// It won't invoke WordPress's password protection. TODO FIXME: file WP Core bug report.
				if ( ! pass || ! pass.length ) {
					visibility = 'public';
				}
			}
			setTitleVisibilityPrefix( visibility );
		}
		const classicVisibilityInput = document.querySelector( '#visibility .save-post-visibility' );
		classicVisibilityInput && classicVisibilityInput.addEventListener( 'click', setClassicTitleVisibilityPrefix );

		if ( l10n.states.isPrivate ) {
			setTitleVisibilityPrefix( 'private' );
		} else if ( l10n.states.isProtected ) {
			setTitleVisibilityPrefix( 'password' );
		}

		/**
		 * Updates default title placeholder.
		 *
		 * @function
		 * @param {string} value
		 * @return {undefined}
		 */
		const updateDefaultTitle = ( val ) => {
			val = typeof val === 'string' && val.trim() || '';

			let defaultTitle = tsfTitle.stripTitleTags ? tsf.stripTags( val ) : val

			defaultTitle = defaultTitle || tsfTitle.untitledTitle;

			tsfTitle.updateStateOf( _titleId, 'defaultTitle', defaultTitle );
		}
		//= The homepage listens to a static preset value. Update all others.
		if ( ! l10n.params.isFront ) {
			const classicTitleInput = document.querySelector( '#titlewrap #title' );
			classicTitleInput && classicTitleInput.addEventListener( 'input', event => updateDefaultTitle( event.target.value ) );

			$( document ).on( 'tsf-updated-gutenberg-title', ( event, title ) => updateDefaultTitle( title ) );
		}

		tsfTitle.enqueueUnregisteredInputTrigger( _titleId );
	}

	/**
	 * Initializes description meta input listeners.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initDescriptionListeners = () => {

		let descInput = document.getElementById( _descId );
		if ( ! descInput ) return;

		let state = JSON.parse(
			document.getElementById( 'tsf-description-data_' + _descId ).dataset.state
		);

		tsfDescription.setInputElement( descInput );

		tsfDescription.updateStateOf( _descId, 'allowReferenceChange', ! state.refDescriptionLocked );
		tsfDescription.updateStateOf( _descId, 'defaultDescription', state.defaultDescription.trim() );
		tsfDescription.updateStateOf( _descId, 'hasLegacy', !! ( state.hasLegacy || false ) );

		// TODO set private/protected listeners, that will empty the generated description?
		// TODO set post-content (via ajax) listeners?

		tsfDescription.enqueueUnregisteredInputTrigger( _descId );
	}

	/**
	 * Initializes uncategorized general tab meta input listeners.
	 *
	 * @since 4.0.0
	 * @since 4.1.0 Removed postbox-toggled listener, since tsf-flex-resize is all-encapsulating now.
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initGeneralListeners = () => {

		const enqueueGeneralInputListeners = () => {
			tsfTitle.enqueueUnregisteredInputTrigger( _titleId );
			tsfDescription.enqueueUnregisteredInputTrigger( _descId );
		}

		// We can't bind to jQuery event listeners via native ES :(
		$( '#tsf-flex-inpost-tab-general' ).on( 'tsf-flex-tab-toggled', enqueueGeneralInputListeners );
		window.addEventListener( 'tsf-flex-resize', enqueueGeneralInputListeners );
	}

	/**
	 * Initializes tooltip boundaries.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initTooltipBoundaries = () => {

		if ( ! l10n.states.isGutenbergPage ) return;

		'tsfTT' in window && tsfTT.addBoundary( '#editor' );

		// Listen to the Gutenberg state changes.
		document.addEventListener( 'tsf-gutenberg-sidebar-opened', () => {
			'tsfTT' in window && tsfTT.addBoundary( '.edit-post-sidebar .components-panel' );
		} );
	}

	/**
	 * Updates the SEO Bar and meta description placeholders on successful save.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _initUpdateMetaBox = () => {

		if ( ! l10n.states.isGutenbergPage ) return;

		const seobar = document.querySelector( '.tsf-seo-bar' );

		// We only use this because it looks nice. The rest is implied via the counter updates.
		const seobarAjaxLoader = document.querySelector( '#tsf-doing-it-right-wrap .tsf-ajax' );

		const desc   = document.getElementById( _descId ),
			  ogDesc = document.getElementById( 'autodescription_og_description' ),
			  twDesc = document.getElementById( 'autodescription_twitter_description' );

		const imageUrl = document.getElementById( 'autodescription_socialimage-url' );

		const getData = {
			seobar:          !! seobar,
			metadescription: !! desc,
			ogdescription:   !! ogDesc,
			twdescription:   !! twDesc,
			imageurl:        !! imageUrl,
		};

		const onSuccess = response => {

			response = tsf.convertJSONResponse( response );

			switch ( response.type ) {
				case 'success':
					// Wait the same amount of time as the SEO Bar, so to sync the changes.
					const fadeTime = 75;

					setTimeout( () => {
						if ( tsfDescription ) {
							tsfDescription.updateStateOf( _descId, 'defaultDescription', response.data.metadescription.trim() );
						}
						if ( tsfSocial ) {
							tsfSocial.updateState( 'ogDescPlaceholder', response.data.ogdescription.trim() );
							tsfSocial.updateState( 'twDescPlaceholder', response.data.twdescription.trim() );
						}

						// Is this necessary? It's safer, though :)
						imageUrl.placeholder = tsf.decodeEntities( response.data.imageurl );
						imageUrl.dispatchEvent( new Event( 'change' ) );

						'tsfAys' in window && tsfAys.reset();
					}, fadeTime );

					$( seobar )
						.fadeOut( fadeTime, () => {
							seobarAjaxLoader && tsf.unsetAjaxLoader( seobarAjaxLoader, true );
						} )
						.html( response.data.seobar )
						.fadeIn( 500, () => {
							'tsfTT' in window && tsfTT.triggerReset();
						} );
					break;
				case 'failure':
					seobarAjaxLoader && tsf.unsetAjaxLoader( seobarAjaxLoader, false );
					break;
				default:
					seobarAjaxLoader && tsf.resetAjaxLoader( seobarAjaxLoader );
					break;
			}
		};

		const onFailure = () => {
			seobarAjaxLoader && tsf.unsetAjaxLoader( seobarAjaxLoader, false );
		};

		document.addEventListener( 'tsf-gutenberg-onsave', event => {

			// Reset ajax loader, we only do that for the SEO Bar.
			seobarAjaxLoader && tsf.resetAjaxLoader( seobarAjaxLoader );

			// Set ajax loader.
			seobarAjaxLoader && tsf.setAjaxLoader( seobarAjaxLoader );

			let settings = {
				method:   'POST',
				url:      ajaxurl,
				datatype: 'json',
				data:     {
					action:  'the_seo_framework_update_post_data',
					nonce:   tsf.l10n.nonces.edit_posts,
					post_id: l10n.states.id,
					get:     getData,
				},
				async:    true,
				timeout:  7000,
				success:  onSuccess,
				error:    onFailure,
			}

			$.ajax( settings );
		} );
	}

	/**
	 * Initializes settings scripts on TSF-load.
	 *
	 * @since 4.0.0
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _loadSettings = () => {
		_initCanonicalInput();
		_initTitleListeners();
		_initDescriptionListeners();
		_initGeneralListeners();
	}

	/**
	 * Initializes settings scripts on TSF-ready.
	 *
	 * @since 4.0.0
	 * @since 4.1.0 Now registers the refNa title input.
	 * @access private
	 *
	 * @function
	 * @return {undefined}
	 */
	const _readySettings = () => {
		// Initializes flex tab resize listeners.
		_doFlexResizeListener();

		// Initializes flex tab listeners and fixes positions.
		_initTabs();

		// Sets tooltip boundaries
		_initTooltipBoundaries();

		// Set Gutenberg update listeners.
		_initUpdateMetaBox();

		tsfSocial.initTitleInputs( {
			ref:   document.getElementById( 'tsf-title-reference_' + _titleId ),
			refNa: document.getElementById( 'tsf-title-noadditions-reference_' + _titleId ),
			meta:  document.getElementById( _titleId ),
			og:    document.getElementById( 'autodescription_og_title' ),
			tw:    document.getElementById( 'autodescription_twitter_title' ),
		} );

		tsfSocial.initDescriptionInputs( {
			ref:  document.getElementById( 'tsf-description-reference_' + _descId ),
			meta: document.getElementById( _descId ),
			og:   document.getElementById( 'autodescription_og_description' ),
			tw:   document.getElementById( 'autodescription_twitter_description' ),
		} );
	}

	return Object.assign( {
		/**
		 * Initialises all aspects of the scripts.
		 * You shouldn't call this.
		 *
		 * @since 4.0.0
		 * @access protected
		 *
		 * @function
		 * @return {undefined}
		 */
		load: () => {
			document.body.addEventListener( 'tsf-onload', _loadSettings );
			document.body.addEventListener( 'tsf-ready', _readySettings );
		}
	}, {
		// No public methods.
	}, {
		l10n
	} );
}( jQuery );
window.tsfPost.load();
