module.exports = function (router, options) {

    function fullUrl(req, url) {
        var path = req.originalUrl.replace(/\/$/, '') + '/';
        return req.protocol + '://' + req.get('host') + path + url;
    }

    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        // return an array with all collection's names
        var json = [];
        for (var name in options.collections) {
            json.push({
                'name': name,
                'link': fullUrl(req, name)
            });
        }
        res.locals.status = 200;
        res.locals.json = json;
        next();
    });

    //--------------------------------------------------------------------------
    router.get('/:collection/:id?', function (req, res, next) {
        // count of documents requested
        if (typeof (req.query.$count) != 'undefined') {
            req.nedb.count(req.query.$filter, function (err, count) {
                if (err) {
                    return next(err);
                }
                res.locals.status = 200;
                res.locals.json = { count: count };
                next();
            });
        }
        // find single document
        else if (typeof (req.query.$single) != 'undefined') {
            req.nedb.findOne(req.query.$filter, function (err, doc) {
                if (err) {
                    return next(err);
                }
                if (!doc) {
                    return next({
                        status: 404, // Not found
                        message: 'document not found'
                    });
                }
                res.locals.status = 200;
                res.locals.json = doc;
                next();
            });
        }
        // normal query
        else {
            var query = req.nedb.find(req.query.$filter);
            if (req.query.$sort) {
                query.sort(req.query.$sort);
            }
            if (!isNaN(req.query.$skip)) {
                query.skip(parseInt(req.query.$skip));
            }
            if (!isNaN(req.query.$limit)) {
                query.limit(parseInt(req.query.$limit));
            }
            query.exec(function (err, docs) {
                if (err) {
                    return next(err);
                }
                res.locals.status = 200;
                res.locals.json = docs;
                next();
            });
        }
    });

    //--------------------------------------------------------------------------
    router.post('/:collection', function (req, res, next) {
        if (!req.body || typeof (req.body) != 'object') {
            return next({
                status: 400, // Bad Request
                message: 'bad request body'
            });
        }
        req.nedb.insert(req.body, function (err, doc) {
            if (err) {
                return next(err);
            }
            res.append('Location', fullUrl(req, doc._id));
            res.locals.status = 201;
            res.locals.json = doc;
            next();
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection/:id?', function (req, res, next) {
        if (Object.keys(req.query.$filter).length == 0) {
            return next({
                status: 400, // Bad Request
                message: '$filter is missing'
            });
        }
        if (!req.body || typeof (req.body) != 'object') {
            return next({
                status: 400, // Bad Request
                message: 'no request body'
            });
        }
        req.nedb.update(req.query.$filter, req.body, req.query.$option, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({
                    status: 404, // Not found
                    message: 'no document found to update'
                });
            }
            res.locals.status = 204;
            res.locals.json = { count: count };
            next();
        });
    });

    //--------------------------------------------------------------------------
    router.delete('/:collection/:id?', function (req, res, next) {
        req.nedb.remove(req.query.$filter, req.query.$option, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({
                    status: 404, // Not found
                    message: 'no document found to delete'
                });
            }
            res.locals.status = 204;
            res.locals.json = { count: count };
            next();
        });
    });

};
