var express = require('express');
var expressAuth = require('express-basic-auth');
var expressNedbRest = require('./main/rest')();

var options = require(
    process.env.OPTFILE || __dirname + '/options.json'
);
var webroot = process.env.WEBROOT || options.webroot || __dirname + '/public';
var webport = process.env.WEBPORT || options.webport || 8010;

///////////////////////////////////////////////////////////////////////

var app = express();

if (options.auth) {
    app.use('*', expressAuth(options.auth));
}

if (options.datastore) {
    options.datastore.forEach(function (args) {
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
