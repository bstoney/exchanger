(function (exports) {
    exports.enums = require('./lib/enums');

    exports.initialize = require('./lib/initailize');
    exports.getEmails = require('./lib/getEmails');
    exports.getEmail = require('./lib/getEmail');
    exports.getFolders = require('./lib/getFolders');

    function callbackHelper(func, funcArgs){
        var args = Array.prototype.slice.call(funcArgs, 0);
        var callback = args.pop();
        args.unshift(exports.withCallbacks.client);
        func.apply(exports.withCallbacks, args)
            .then(function (emails) {
                callback(null, emails);
            }, callback).done();
    }

    exports.withCallbacks = {
        client: null,
        initialize: function (settins, callback) {
            self = this;
            exports.initialize(settins)
                .then(function (client) {
                    self.client = client;
                    callback();
                }, callback).done();
        },
        getEmails: function () {
            callbackHelper(exports.getEmails, arguments);
        },
        getEmail: function () {
            callbackHelper(exports.getEmail, arguments);
        },
        getFolders: function () {
            callbackHelper(exports.getFolders, arguments);
        }
    };
})(this.exports || this);