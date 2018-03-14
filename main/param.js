module.exports = function (router, config) {

    // find datastore of collection and add it to request object
    router.param('collection', function collectionParam(req, res, next, collection) {

        req.collection = collection;
        req.nedb = config.collections[collection];

        if (!req.nedb) {
            return next({
                status: 404, // Bad Request
                message: 'unknown collection ' + req.collection
            });
        }

        if (req.query.$filter) {
            try {
                var $filter = req.query.$filter;
                req.$filter = JSON.parse(decodeURIComponent($filter), function (k, v) {
                    return k == '$regex' ? new RegExp(v) : v;
                });
            }
            catch (e) {
                next({
                    status: 400, // Bad Request
                    message: 'unvalid $filter ' + e.message
                });
            }
        }
        req.$filter || (req.$filter = {});

        if (req.query.$orderby) {
            try {
                var $orderby = req.query.$orderby;
                req.$orderby = JSON.parse(decodeURIComponent($orderby));
            }
            catch (e) {
                return next({
                    status: 400, // Bad Request
                    message: 'unvalid $orderby ' + e.message
                });
            }
        }

        next();
    });

    // add object id from uri to request
    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

};
