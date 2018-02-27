var Hapi = require('hapi'),
	Routes = require('./routes'),
	Db = require('./config/db'),
	bunyan = require('bunyan'),
	mongoStream = require('mongo-writable-stream'),
	inert = require('inert'),
	Config = process.env.NODE_ENV === undefined ? require('./config/development') : require('./config/' + process.env.NODE_ENV);


var app = {};
	app.config = Config;

var server = new Hapi.Server({ connections: { router: { stripTrailingSlash: true } } });

server.connection({ port: app.config.server.port });

server.register(require('inert'), (err) => {
	if (err) {
		throw err
	}

	server.route({
		method: 'GET',
		path: '/materials/{id}',
		handler: {
			file: function(request) {
				return `files/${request.params.id}.xlsx`
			}
		}
	})
})

server.route(Routes.endpoints);

var plugins = [
	{
		register: require('hapi-locale'),
		options: {
			scan: {
				path: __dirname + "/locales"
			},
			order: ['headers'],
			header: 'accept-language'
		}
	},
	{
		register: require('joi18n')
	},
	{
		register: require( "hapi-i18n" ),
		options: {
			locales: ["pt_BR", "en_US"],
			directory: __dirname + "/locales",
			languageHeaderField: "accept-language"
		}
	},
	{
		register: require('hapi-bunyan'),
		options: {
			logger: bunyan.createLogger({
				name: 'ServerLogger',
				level: 'debug',
				stream: new mongoStream({
					url: Db.logDB,
					collection: 'hapi'
				})
			}),
			includeTags: true
		}
	}
];

server.register(plugins, function ( err ){
	if ( err ){
		console.log( err );
	}
});

server.start(function () {
	console.log('Server started ', server.info.uri);
});

server.ext('onPreResponse', function (request, reply) {
    var response = request.response;
    if (!response.isBoom) {
        return reply.continue();
    }
    if (response.data){
        response.output.payload.data = response.output;
    }
    return reply(response);
});

module.exports = server;
