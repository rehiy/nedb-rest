var bodyParser = require('body-parser');
var express = require('express');
var nedb = require('nedb');

var addRestParams = require('./param');
var addRestMethods = require('./method');

module.exports = function (config) {

    var router = express.Router();

    if (typeof config.collections != 'array') {
        config.collections = [];
    }

    //  enabling cross domain calls
    router.all('*', function (req, res, next) {
        if (req.headers.origin) {
            res.set('Access-Control-Allow-Origin', req.headers.origin);
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,,PATCH');
            res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        }
        if ('OPTIONS' == req.method) {
            return res.sendStatus(204);
        }
        next();
    });

    // parse body of request
    router.use(bodyParser.json());

    // register param and methods
    addRestParams(router, config);
    addRestMethods(router, config);

    // at last send json result or error
    router.use(function (req, res, next) {
        if (res.locals.count) {
            res.append('X-Total-Count', res.locals.count);
        }
        if (res.locals.json) {
            res.json(res.locals.json);
        }
        next();
    });

    // error handling
    router.use(function (err, req, res, next) {
        if (typeof (err) === 'object') {
            res.status(err.status || 400);
            res.send(err.message || 'unknown error');
        }
        else {
            res.status(400);
            res.send(err.toString());
        }
    });

    /**
     * add a NeDB datastore to REST collections
     * @param {string} collection's name, wich is used for publication in REST calls
     * @param {object) NeDB Datastore options
     */
    router.addDatastore = function (collection, options) {
        options.compareStrings = function (a, b) {
            return (a + '').localeCompare(b);
        };
        config.collections[collection] = new nedb(options);
    };

    // return router
    return router;

};
