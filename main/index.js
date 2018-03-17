
var express = require('express');
var nedb = require('nedb');

var util = require('./util');
var setRestParams = require('./param');
var setRestMethods = require('./method');

module.exports = function (options) {

    var router = express.Router();

    if (typeof options.collections != 'object') {
        options.collections = {};
    }

    //  enabling cross domain calls
    router.all('*', function (req, res, next) {
        if (req.headers.origin) {
            res.set('Access-Control-Allow-Origin', req.headers.origin);
            res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        }
        if ('OPTIONS' == req.method) {
            return res.status(204).end();
        }
        next();
    });

    // register param and methods
    setRestParams(router, options);
    setRestMethods(router, options);

    // at last send json result or error
    router.use(function (req, res, next) {
        if (res.locals.status) {
            res.status(res.locals.status);
        }
        if (res.locals.json) {
            res.type('application/json');
            res.send(util.serialize(res.locals.json));
        }
        else {
            next();
        }
    });

    // error handling
    router.use(function (err, req, res, next) {
        let error = {
            status: err && err.status || 400,
            message: err && err.toString() || 'unknown error'
        };
        res.status(error.status);
        res.send(util.serialize(error));
    });

    /**
     * add a NeDB datastore to REST collections
     * @param {string} collection's name, wich is used for publication in REST calls
     * @param {object) NeDB Datastore options
     */
    router.addDatastore = function (collection, config) {
        config.compareStrings = function (a, b) {
            return (a + '').localeCompare(b);
        };
        options.collections[collection] = new nedb(config);
    };

    // return router
    return router;

};
