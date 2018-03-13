var order = require('./parser');

module.exports = function (router, config) {

    function fullUrl(req, suffix) {
        suffix = req.originalUrl.replace(/\/$/, '') + '/' + suffix;
        return req.protocol + '://' + req.get('host') + suffix;
    }

    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        res.locals.json = [];
        for (var name in config.collections) {
            res.locals.json.push({
                'name': name,
                'link': fullUrl(req, name)
            });
        }
        res.locals.count = res.locals.json.length;
        next();
    });

    //--------------------------------------------------------------------------
    router.get('/:collection', function (req, res, next) {
        // count of documents requested
        if (typeof (req.query.$count) != 'undefined') {
            req.nedb.count(req.$filter, function (err, count) {
                if (err) {
                    return next(err);
                }
                res.locals.count = count;
                res.status(200).send(count.toString());
            });
            return;
        }
        // find single document
        if (typeof (req.query.$single) != 'undefined') {
            req.nedb.findOne(req.$filter, function (err, doc) {
                if (err) {
                    return next(err);
                }
                if (doc) {
                    res.locals.count = 1;
                    res.locals.json = doc;
                    return next();
                }
                next({
                    status: 404, // Not found
                    message: 'document not found'
                });
            });
            return;
        }
        // normal query
        var query = req.nedb.find(req.$filter);
        // parse orderby
        if (req.query.$orderby) {
            try {
                var $order = order(req.query.$orderby);
                if ($order) {
                    query.sort($order);
                }
            }
            catch (e) {
                return next({
                    status: 400, // Bad Request
                    message: 'unvalid $orderby ' + e.message
                });
            }
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
            res.locals.count = docs.length;
            res.locals.json = docs;
            next();
        });
    });

    //--------------------------------------------------------------------------
    router.get('/:collection/:id', function (req, res, next) {
        req.nedb.findOne({ _id: req.id }, function (err, doc) {
            if (err) {
                return next(err);
            }
            if (!doc) {
                return next({
                    status: 404, // Not found
                    message: 'document ' + req.collection + ' _id=' + req.id + ' not found'
                });
            }
            res.locals.json = doc;
            next();
        });
    });

    //--------------------------------------------------------------------------
    router.post('/:collection', function (req, res, next) {
        if (!req.body || typeof (req.body) != 'object') {
            return next({
                status: 400, // Bad Request
                message: 'No Request Body'
            });
        }
        req.nedb.insert(req.body, function (err, doc) {
            if (err) {
                return next(err);
            }
            res.locals.json = doc;
            res.status(201); // Created
            res.append('Location', fullUrl(req, doc._id));
            next();
        });
    });

    //--------------------------------------------------------------------------
    router.delete('/:collection/:id', function (req, res, next) {
        req.nedb.remove({ _id: req.id }, { multi: false }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                return next({
                    status: 404, // Not found
                    message: 'document ' + req.collection + ' _id=' + req.id + ' not found'
                });
            }
            res.locals.count = count;
            res.status(204).send('deleted entries: ' + count);
        });
    });

    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        if (!req.$filter || Object.keys(req.$filter).length == 0) {
            return next({
                status: 400, // Bad Request
                message: '$filter is missing'
            });
        }
        req.nedb.remove(req.$filter, { multi: true }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({
                    status: 404, // Not found
                    message: 'no document found to delete'
                });
            }
            res.locals.count = count;
            res.status(204).send('deleted entries: ' + count);
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection/:id', function (req, res, next) {
        if (!req.body || typeof (req.body) != 'object') {
            return next({
                status: 400, // Bad Request
                message: 'No Request Body'
            });
        }
        req.nedb.update({ _id: req.id }, req.body, { multi: false }, function (err, count) {
            if (err) {
                return next(err);
            }
            if (count != 1) {
                return next({
                    status: 404, // Not found
                    message: 'document ' + req.collection + ' _id=' + req.id + ' not found'
                });
            }
            res.locals.count = count;
            res.status(204).send('updated entries: ' + count);
        });
    });

    //--------------------------------------------------------------------------
    router.put('/:collection', function (req, res, next) {
        if (!req.body || typeof (req.body) != 'object') {
            return next({
                status: 400, // Bad Request
                message: 'No Request Body'
            });
        }
        req.nedb.update(req.$filter, req.body, { multi: true }, function (err, count, docs) {
            if (err) {
                return next(err);
            }
            if (count == 0) {
                return next({
                    status: 404, // Not found
                    message: 'no document found to update'
                });
            }
            res.locals.count = count;
            res.status(204).send('updated entries: ' + count);
        });
    });

    //--------------------------------------------------------------------------
    router.patch('/:collection', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });

    //--------------------------------------------------------------------------
    router.delete('/:collection', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });

    //--------------------------------------------------------------------------
    router.post('/:collection/:id', function (req, res, next) {
        res.status(405).send(); // Method Not Allowed
    });

};
