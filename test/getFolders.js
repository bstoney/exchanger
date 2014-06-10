var assert = require('assert');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var exchanger = require('../index');
var settings = require('./settings');

module.exports = {
    setUp: function (callback) {
        this.client = null;
        this.lastSoapRequest = null;
        var self = this;
        exchanger.initialize(settings).then(function (client) {
            self.client = client;
            client.FindFolder = function (soapRequest, callback) {
                self.lastSoapRequest = soapRequest;
                fs.readFile(path.join(__dirname, 'getFoldersSoapResponse.xml'), 'utf8', function (err, body) {
                    var result = '';
                    callback(null, result, body);
                });
            };

            callback();
        });
    },

    getFoldersWithNoClient: function (test) {
        exchanger.getFolders(null)
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    getFoldersWithAllArgs: function (test) {
        var self = this;
        exchanger.getFolders(this.client, 'sentitems', 'email@test.com')
            .then(function (folders) {
                test.ok(folders);
                test.ok(/DistinguishedFolderId Id="sentitems"/.test(self.lastSoapRequest));
                test.ok(/Mailbox><EmailAddress>email@test.com/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getFoldersWithFolderName: function (test) {
        var self = this;
        exchanger.getFolders(this.client, 'sentitems')
            .then(function (folders) {
                test.ok(folders);
                test.ok(/DistinguishedFolderId Id="sentitems"/.test(self.lastSoapRequest));
                test.ifError(/Mailbox><EmailAddress>email@test.com/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getFoldersWithNoArgs: function (test) {
        var self = this;
        exchanger.getFolders(this.client)
            .then(function (folders) {
                test.ok(folders);
                test.ok(/DistinguishedFolderId Id="inbox"/.test(self.lastSoapRequest));
                test.ifError(/Mailbox><EmailAddress>email@test.com/.test(self.lastSoapRequest));
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    getFoldersIdSet: function (test) {
        exchanger.getFolders(this.client)
            .then(function (folders) {
                test.ok(folders.length > 0);

                folders.forEach(function (item, idx) {
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