'use strict';

const env   = require( 'process' ).env;
const https = require( 'https' );
const query = require( 'querystring' );

// Hapi server
const Hapi  = require( 'hapi' );
const Hoek  = require( 'hoek' );
const Joi   = require( 'joi' );



// Create a server with a host and port
const server = new Hapi.Server();

server.connection({
	host: 'localhost',
	port: 8000
});


// views
// http://hapijs.com/tutorials/views
server.register(require( 'vision' ), ( err ) => {
	Hoek.assert( ! err, err );

	server.views({
		engines: {
			html: require( 'handlebars' )
		},
		relativeTo: __dirname,
		path: '../views'
	});
});


// GET invite
// show invite form
server.route({
	method: 'GET',
	path: '/invite',
	handler: function( request, reply ) {
		reply.view( 'invite/invite-form.html' );
	}
});


// POST invite
// invite a user
server.route({
	method: 'POST',
	path: '/invite',
	config: {
		validate: {
			payload: {
				email: Joi.string().email(),
				first_name: Joi.string().min( 1 )
			}
		}
	},
	handler: function( request, reply ) {
		// check for API token environment variable
		if ( ! env.SLACK_API_TOKEN ) {
			reply.view( 'error/not-authed.html' );
			return;
		}

		// data for the invite API
		let inviteData = query.stringify({
			token: env.SLACK_API_TOKEN,
			email: request.payload.email,
			first_name: request.payload.first_name,
		});

		// API to invite email to slack
		// https://levels.io/slack-typeform-auto-invite-sign-ups/
		let apiRequest = {
			hostname: 'slack.com',
			path: '/api/users.admin.invite?t=' + Math.round( Date.now() / 1000 ),
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength( inviteData )
			}
		};

		// handle slack API response
		function responseHandler( res ) {
			res.setEncoding( 'utf8' );
			res.on( 'data', function( responseData ) {
				console.log( 'data', responseData );

				if ( responseData ) {
					responseData = JSON.parse( responseData );

					if ( responseData.ok ) {
						reply.view( 'invite/invite-success.html', request.payload );

					} else if ( responseData.error === 'already_in_team' ) {
						reply.view( 'invite/invite-duplicate.html', request.payload );

					} else if ( responseData.error === 'not_authed' ) {
						reply.view( 'error/not-authed.html' );

					} else if ( responseData.error ) {
						reply.view( 'error/slack-error.html', responseData );
					} else {
						reply.view( 'error/slack-unknown.html' );
					}

				} else {
					reply.view( 'error/no-data.html' );
				}
			});
		}

		// call the slack API
		let req = https.request( apiRequest, responseHandler );
		req.write( inviteData );
		req.end();
	}
});


// static files
server.register(require( 'inert' ), ( err ) => {
	if ( err ) {
		throw err;
	}

	server.route({
		method: 'GET',
		path: '/{param*}',
		handler: {
			directory: {
				path: require( 'path' ).join( __dirname, '../htdocs/' )
			}
		}
	});
});


// Start the server
server.start(( err ) => {
	if ( err ) {
		throw err;
	}

	console.log( 'Server running at:', server.info.uri );
});
