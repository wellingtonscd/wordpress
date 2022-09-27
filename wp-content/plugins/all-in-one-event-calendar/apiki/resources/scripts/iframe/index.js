import '@styles/iframe';

$( document ).ready( () => {
	const iframe = document.createElement( 'iframe' );
	const iframeContainer = document.getElementById(
		'timely-iframe-container'
	);

  if ( iframeContainer ) {
	  const currentUrl = window.location.href;
    iframe.id = 'timely-iframe';
    iframe.src = ajax_object ? ajax_object.iframe_url : `https://app.time.ly/login?cms=1&callback=${currentUrl}`;
    iframe.style.display = 'none';
		iframe.onload = () => {
			iframe.style.display = 'block';
		};

		iframeContainer.appendChild( iframe );

		/* adjust height */
		const pageHeight = $( document ).height();
		const iframeHeight = $( iframe ).height();
		if ( iframeHeight + 32 < pageHeight ) {
			$( iframe ).height( pageHeight );
			$( '#timely-iframe-container' ).height( pageHeight );
		}

		window.addEventListener( 'message', receiveMessage, false );
		function receiveMessage( event ) {
      const timelyLoader = document.getElementById( 'timely-loader' );
			const timelyExternal = event.data.timely_external;
			const timelyData = timelyExternal.data;
			let authToken = null;
			let expiryDate = null;
			if ( timelyData ) {
				authToken = timelyData[ 'X-Auth-Token' ];
				expiryDate = timelyData.expiryDate;
			}
			const { action } = timelyExternal;

			const data = {
				action: 'auth_token',
				auth_token_nonce: ajax_object.auth_token_nonce,
				timely_token: authToken,
				expiry_date: expiryDate,
				timely_action: action,
			};

      timelyLoader.style.zIndex = 9999;

			jQuery.post( ajax_object.xhr_url, data, ( response ) => {
				if ( response !== 'logged out' ) {
					document.getElementById( 'timely-iframe' ).style.display =
						'none';
					location.reload();
				} else {
          timelyLoader.style.zIndex = 0;
        }
			} );
		}
	}

	/* open links in another tab */
	const submenuTimelyTarget = $( "ul.wp-submenu a[href*='#timely']" );
	submenuTimelyTarget.attr( 'target', '_blank' );
	submenuTimelyTarget.each( ( index ) => {
		const element = submenuTimelyTarget[ index ];
		const elHref = element.href;
		element.href = 'https://'.concat(
			elHref.substring( elHref.indexOf( '#timely=' ) + '#timely='.length )
		);
	} );

	/* links reload iframe */
	const submenuTimely = $( "ul.wp-submenu a[href*='page=timely']" );
	let elementActive = null;
	submenuTimely.each( ( index ) => {
		const element = submenuTimely[ index ];
		const elHref = element.href;
		if ( element.classList.contains( 'current' ) ) {
			elementActive = element;
		}

		element.addEventListener( 'click', ( e ) => {
			const submenuTimelyName = elHref.substring(
				elHref.indexOf( 'page=' ) + 'page='.length
			);
			const timelyLoader = document.getElementById( 'timely-loader' );
			const src = $( '#'.concat( submenuTimelyName ) ).val();
			const currentUrl = window.location.href;

			timelyLoader.style.zIndex = 9999;
			iframe.src =
				src ||
				`https://app.time.ly/login?cms=1&callback_url=${ encodeURI( currentUrl ) }`;
			iframe.onload = () => {
				setTimeout( () => {
					timelyLoader.style.zIndex = 0;
				}, 1000 );
			};

			/* change active on menu */
			elementActive.classList.remove( 'current' );
			elementActive.parentElement.classList.remove( 'current' );
			element.classList.add( 'current' );
			element.parentElement.classList.add( 'current' );
			elementActive = element;

			e.preventDefault();
		} );
	} );

	document.getElementById( 'timely-update-message-button' ).addEventListener( 'click', () => {
	  document.getElementById( 'timely-update-message' ).style.display = 'none';
  } )
} );
