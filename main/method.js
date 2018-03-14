module.exports = function (router, config) {

    function fullUrl(req, url) {
        var path = req.originalUrl.replace(/\/$/, '') + '/';
        return req.protocol + '://' + req.get('host') + path + url;
    }

    //--------------------------------------------------------------------------
    router.get('/', function (req, res, next) {
        // return an array with all collection's names
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
        if (req.$orderby) {
            query.sort(req.$orderby);
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
    router.delete('/:collection', function (req, res, next) {
        if (Object.keys(req.$filter).length == 0) {
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

};
