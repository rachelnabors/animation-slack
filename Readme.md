# Web animation slack invite server

A simple web app allowing animators to sign up for the Slack Channel.

## Built with

- node.js
- hapi (app server) + various helper plugins
- handlebars (templating)
- HTML and CSS!

## To run this server

1. Clone repo
2. install dependencies with `npm install` (assuming you have a node + npm development environment)
3. set an environment variable named `SLACK_API_TOKEN` with your slack API TOKEN
   (*keep it private, don't publish it in the source code*)
4. run `node dist/index.js` to start the hapi server
5. visit the web address (for local testing this is `http://localhost:8000/invite`)

## Customising views

The views (user interface) are handlebars templates (HTML with variables).
You will find them in the `views/` folder.

There are views for the form, success message, and various possible errors.

Some error messages (e.g. invalid email) are not handled very nicely at present.
Most users should be covered by HTML5 validation in their browser anyway.

### Serving static files

Static files are served from the `htdocs/` folder. This is a good place to put CSS and any client-side JavaScript.

Access static files directly from the root of the webserver.
For example: `htdocs/invite.css` will be available on the server as `/invite.css`.


## Development

Source code is in `src/index.es6`. The file in `dist/` has been transpiled to ES5 for backwards compatibility.

Use `node run build` to generate `dist/index.js` from the ES6 source.

### Customising routes

The only route implemented is `/invite` (plus any static files).
To configure other routes or change the port the server runs on (default `8000`), edit `src/index.es6`.
