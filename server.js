var exists = require('fs').existsSync;

var optfile = process.env.OPTFILE || process.cwd() + '/options.json';
var datadir = process.env.DATADIR || process.cwd() + '/storage';
var plugmod = process.env.PLUGMOD || process.cwd() + '/plugin';
var webroot = process.env.WEBROOT || process.cwd() + '/public';
var webport = process.env.WEBPORT || 8010;

exists(optfile) || (optfile = __dirname + '/options.json');
exists(datadir) || (datadir = __dirname + '/storage');
exists(webroot) || (webroot = __dirname + '/public');

var options = require(optfile);
var express = require('express');
var expressAuth = require('express-basic-auth');
var expressNedbRest = require('./main/rest')(options);

//--------------------------------------------------------------------------

var app = express();

if (options.auth) {
    app.use('*', expressAuth(options.auth));
}

if (exists(plugmod)) {
    app.use('/plug', require(plugmod)(options));
}

app.use('/nedb', expressNedbRest);
options.datastore.forEach(function (args) {
    args[1].filename = datadir + '/' + args[1].filename;
    expressNedbRest.addDatastore(args[0], args[1]);
});

app.use(express.static(webroot));
app.get('*', function (req, res) {
    res.sendFile(webroot + '/index.html');
});

app.disable('x-powered-by');
app.listen(webport, function () {
    console.log('you may use nedb rest api at port', webport);
    console.log('\n\n');
});
