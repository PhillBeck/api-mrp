var Hapi = require('hapi'),
  Routes = require('./routes'),
  Db = require('./config/db'),
  Config = require('./config/config');

var app = {};
app.config = Config;

var server = new Hapi.Server();

server.connection({ port: app.config.server.port });

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
