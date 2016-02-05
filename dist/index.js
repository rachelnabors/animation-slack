'use strict';

var env = require('process').env;
var https = require('https');
var query = require('querystring');

// Hapi server
var Hapi = require('hapi');
var Hoek = require('hoek');
var Joi = require('joi');

// Create a server with a host and port
var server = new Hapi.Server();

server.connection({
	host: 'localhost',
	port: port: env.PORT || 8000
});

// views
// http://hapijs.com/tutorials/views
server.register(require('vision'), function (err) {
	Hoek.assert(!err, err);

	server.views({
		engines: {
			html: require('handlebars')
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
	handler: function handler(request, reply) {
		reply.view('invite/invite-form.html');
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
				first_name: Joi.string().min(1)
			}
		}
	},
	handler: function handler(request, reply) {
		// check for API token environment variable
		// if (!env.SLACK_API_TOKEN) {
		// 	reply.view('error/not-authed.html');
		// 	return;
		// }

		// data for the invite API
		var inviteData = query.stringify({
			token: "xoxp-15870743268-15875780385-20390262178-9ab797d9f0",
			email: request.payload.email,
			first_name: request.payload.first_name
		});

		// API to invite email to slack
		// https://levels.io/slack-typeform-auto-invite-sign-ups/
		var apiRequest = {
			hostname: 'slack.com',
			path: '/api/users.admin.invite?t=' + Math.round(Date.now() / 1000),
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(inviteData)
			}
		};

		// handle slack API response
		function responseHandler(res) {
			res.setEncoding('utf8');
			res.on('data', function (responseData) {
				console.log('data', responseData);

				if (responseData) {
					responseData = JSON.parse(responseData);

					if (responseData.ok) {
						reply.view('invite/invite-success.html', request.payload);
					} else if (responseData.error === 'already_in_team') {
						reply.view('invite/invite-duplicate.html', request.payload);
					} else if (responseData.error === 'not_authed') {
						reply.view('error/not-authed.html');
					} else if (responseData.error) {
						reply.view('error/slack-error.html', responseData);
					} else {
						reply.view('error/slack-unknown.html');
					}
				} else {
					reply.view('error/no-data.html');
				}
			});
		}

		// call the slack API
		var req = https.request(apiRequest, responseHandler);
		req.write(inviteData);
		req.end();
	}
});

// static files
server.register(require('inert'), function (err) {
	if (err) {
		throw err;
	}

	server.route({
		method: 'GET',
		path: '/{param*}',
		handler: {
			directory: {
				path: require('path').join(__dirname, '../htdocs/')
			}
		}
	});
});

// Start the server
server.start(function (err) {
	if (err) {
		throw err;
	}

	console.log('Server running at:', server.info.uri);
});