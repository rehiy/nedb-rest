var bodyParser = require('body-parser');

var util = require('./util');

module.exports = function (router, options) {

    // parse body of request
    router.use(bodyParser.json({ reviver: util.reviver }));

    // find datastore of collection and add it to request object
    router.param('collection', function collectionParam(req, res, next, collection) {

        req.collection = collection;
        req.nedb = options.collections[collection];

        if (!req.nedb) {
            return next({
                status: 404, // Bad Request
                message: 'unknown collection ' + req.collection
            });
        }

        if (req.query.$sort) {
            try {
                var $sort = decodeURIComponent(req.query.$sort);
                req.query.$sort = util.unserialize($sort);
            }
            catch (e) {
                return next({
                    status: 400, // Bad Request
                    message: 'unvalid $sort. ' + e.message
                });
            }
        }

        if (req.query.$filter) {
            try {
                var $filter = decodeURIComponent(req.query.$filter);
                req.query.$filter = util.unserialize($filter);
            }
            catch (e) {
                return next({
                    status: 400, // Bad Request
                    message: 'unvalid $filter. ' + e.message
                });
            }
        }
        req.query.$filter || (req.query.$filter = {});

        next();
    });

    // add object id from uri to request
    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

};
