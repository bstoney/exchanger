var assert = require('assert');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var exchanger = require('../index');

module.exports = {
    setUp: function (callback) {
        var self = this;
        exchanger.client = {
            FindItem: function (soapRequest, callback) {
                self.lastSoapRequest = soapRequest;
                fs.readFile(path.join(__dirname, 'getEmailsSoapResponse.xml'), 'utf8', function (err, body) {
                    var result = '';
                    callback(null, result, body);
                });
            }
        };

        callback();
    },

    getEmailsWithNoClient: function (test) {
        exchanger.client = null;

        exchanger.getEmails()
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    getEmailsWithAllArgs: function (test) {
        var self = this;
        exchanger.getEmails('sentitems', 4)
            .then(function (emails) {
                test.ok(emails);
                test.ok(/DistinguishedFolderId Id="sentitems"/.test(self.lastSoapRequest));
                test.ok(/MaxEntriesReturned="4"/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getEmailsWithFolderName: function (test) {
        var self = this;
        exchanger.getEmails('sentitems')
            .then(function (emails) {
                test.ok(emails);
                test.ok(/DistinguishedFolderId Id="sentitems"/.test(self.lastSoapRequest));
                test.ok(/MaxEntriesReturned="10"/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getEmailsWithCallback: function (test) {
        var self = this;
        exchanger.getEmails()
            .then(function (emails) {
                test.ok(emails);
                test.ok(/DistinguishedFolderId Id="inbox"/.test(self.lastSoapRequest));
                test.ok(/MaxEntriesReturned="10"/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getEmailsIdSet: function (test) {
        exchanger.getEmails()
            .then(function (emails) {
                test.ok(emails.length > 0);

                emails.forEach(function (item, idx) {
                    test.ok(item.id);

                    test.ok(item.id.split('|').length === 2);
                    var itemId = item.id.split('|')[0];
                    var changeKey = item.id.split('|')[1];

                    test.ok(itemId);
                    test.ok(changeKey);
                });
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    }
};