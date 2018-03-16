var util = {

    replacer: function (k, v) {
        if (k && v) {
            if (typeof this[k].test === 'function') {
                return '$regex:' + this[k].toString();
            }
            if (typeof this[k].getTime === 'function') {
                return '$date:' + this[k].getTime();
            }
        }
        return v;
    },

    reviver: function (k, v) {
        if (typeof (v) === 'string') {
            if (v.indexOf('$date:') === 0) {
                v = v.replace('$date:', '');
                return new Date(parseInt(v, 10));
            }
            if (v.indexOf('$regex:') === 0) {
                v = v.replace('$regex:', '').split('/');
                var flags = v.pop();
                var regex = v.slice(1).join('/');
                return new RegExp(regex, flags);
            }
        }
        return v;
    },

    serialize: function (obj) {
        return JSON.stringify(obj, util.replacer);
    },

    unserialize: function (raw) {
        return JSON.parse(raw, util.reviver);
    }

};

module.exports = util;