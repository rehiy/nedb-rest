var fs = require('fs');

var express = require('express');
var expressAuth = require('express-basic-auth');
var expressNedbRest = require('./main/rest')();

var optfile = process.env.OPTFILE || process.cwd() + '/options.json';
var datadir = process.env.DATADIR || process.cwd() + '/storage';
var webroot = process.env.WEBROOT || process.cwd() + '/public';
var webport = process.env.WEBPORT || 8010;

fs.existsSync(optfile) || (optfile = __dirname + '/options.json');
fs.existsSync(datadir) || (datadir = __dirname + '/storage');
fs.existsSync(webroot) || (webroot = __dirname + '/public');

//--------------------------------------------------------------------------

var options = require(optfile);
var app = express();

if (options.auth) {
    app.use('*', expressAuth(options.auth));
}

if (options.datastore) {
    options.datastore.forEach(function (args) {
        args[1].filename = datadir + '/' + args[1].filename;
        expressNedbRest.addDatastore(args[0], args[1]);
    });
    app.use('/nedb', expressNedbRest);
}

app.use(express.static(webroot));

app.get('*', function (req, res) {
    res.sendFile(webroot + '/index.html');
});

app.listen(webport, function () {
    console.log('you may use nedb rest api at port', webport);
    console.log('\n\n');
});

module.exports = app;
