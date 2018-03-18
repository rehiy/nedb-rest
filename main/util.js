var Util = {

    replacer: function (k, v) {
        if (k && v) {
            if (this[k] instanceof Date) {
                return { $$date: this[k].getTime() };
            }
            if (this[k] instanceof RegExp) {
                return { $$regex: this[k].toString() };
            }
        }
        return v;
    },

    reviver: function (k, v) {
        if (k && v) {
            if (!isNaN(v.$$date)) {
                return new Date(parseInt(v.$$date));
            }
            if (k == '$regex' || v.$$regex) {
                v = v.$$regex || v;
                v = v.split('/');
                var flags = v.pop();
                var regex = v.slice(1).join('/');
                return new RegExp(regex, flags);
            }
            if (k == '$where' && !/[\(\)]/.test(v)) {
                return new Function('return ' + v);
            }
        }
        return v;
    },

    serialize: function (obj) {
        return JSON.stringify(obj, Util.replacer);
    },

    unserialize: function (raw) {
        return JSON.parse(raw, Util.reviver);
    }

};

module.exports = Util;
