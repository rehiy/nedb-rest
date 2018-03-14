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
                req.$filter = JSON.parse(decodeURIComponent($filter));
            }
            catch (e) {
                next({
                    status: 400, // Bad Request
                    message: 'unvalid $filter ' + e.message
                });
            }
        }

        req.$filter || (req.$filter = {});
        next();
    });

    // add object id from uri to request
    router.param('id', function (req, res, next, id) {
        req.id = id;
        next();
    });

};
