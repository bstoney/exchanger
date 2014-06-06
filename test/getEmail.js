var assert = require('assert');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var settings = require('./settings');
var exchanger = require('../index');

module.exports = {
    setUp: function (callback) {
        var self = this;
        exchanger.client = {
            GetItem: function (soapRequest, callback) {
                self.lastSoapRequest = soapRequest;
                fs.readFile(path.join(__dirname, 'getEmailSoapResponse.xml'), 'utf8', function (err, body) {
                    var result = '';
                    callback(null, result, body);
                });
            }
        };

        callback();
    },

    getEmailWithNoClient: function (test) {
        exchanger.client = null;

        exchanger.getEmail(settings.itemId)
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    getEmailWithItemId: function (test) {
        exchanger.getEmail(settings.itemId)
            .then(function (email) {
                test.ok(email);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getEmailWithId: function (test) {
        var id = settings.itemId.id + "|" + settings.itemId.changeKey;
        exchanger.getEmail(id)
            .then(function (email) {
                test.ok(email);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getEmailWithInvalidId: function (test) {
        var id = "blob";
        exchanger.getEmail(id)
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();

    },

    getEmailMailboxesSet: function (test) {
        exchanger.getEmail(settings.itemId)
            .then(function (email) {
                var mailboxTypes = [email.toRecipients, email.ccRecipients, email.from];

                _.forEach(mailboxTypes, function (m, idx) {
                    test.ok(m instanceof Array);
                    test.ok(m.length > 0);

                    _.forEach(m, function (i, idx2) {
                        test.ok(i.name);
                        test.ok(i.emailAddress);
                    });
                });
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    }
};