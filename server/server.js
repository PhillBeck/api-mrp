var Hapi = require('hapi'),
  Routes = require('./routes'),
  Db = require('./config/db'),
  Config = require('./config/config');

var app = {};
app.config = Config;

var server = new Hapi.Server();

server.connection({ port: app.config.server.port });

server.route(Routes.endpoints);

server.register({
   register: require( "hapi-i18n" ),
    options: {
      locales: ["pt", "en", "es"],
      directory: __dirname + "/locales",
      languageHeaderField: "language"
    }
  }, function ( err ){
    if ( err ){
      console.log( err );
    }
});

server.start(function () {
  console.log('Server started ', server.info.uri);
});
