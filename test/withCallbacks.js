var assert = require('assert');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var _ = require('underscore');
var promiseExchanger = require('../index');
var exchanger = require('../index').withCallbacks;
var settings = require('./settings');

module.exports = {
    setUp: function (callback) {
        this.throwError = false;
        var self = this;

        function testPromise() {
            if (self.throwError) {
                return Q.reject(new Error());
            }

            return Q.resolve('a result');
        }

        promiseExchanger.initialize = function () {
            self.call = {name: 'initialize', args: arguments};
            return testPromise();
        };
        promiseExchanger.getEmails = function () {
            self.call = {name: 'getEmails', args: arguments};
            return testPromise();
        };
        promiseExchanger.getEmail = function () {
            self.call = {name: 'getEmail', args: arguments};
            return testPromise();
        };
        promiseExchanger.getFolders = function () {
            self.call = {name: 'getFolders', args: arguments};
            return testPromise();
        };
        callback();
    },

    withCallbacksInitialize: function (test) {
        var self = this;
        exchanger.initialize(settings, function (err) {
            test.ok(self.call.name == 'initialize');
            test.ok(self.call.args[0] == settings);
            test.ifError(err);
            test.ok(exchanger.client);
            test.done();
        });
    },

    withCallbacksInitializeFailure: function (test) {
        this.throwError = true;
        exchanger.initialize({}, function (err) {
            test.ok(err);
            test.done();
        });
    },

    withCallbacksGetEmails: function (test) {
        var self = this;
        exchanger.client = 'client';
        exchanger.getEmails('folderName', 'limit', 'email', function (err, emails) {
            test.ok(self.call.name == 'getEmails');
            test.ok(self.call.args[0] == 'client');
            test.ok(self.call.args[1] == 'folderName');
            test.ok(self.call.args[2] == 'limit');
            test.ok(self.call.args[3] == 'email');
            test.ifError(err);
            test.ok(emails);
            test.done();
        });
    },

    withCallbacksGetEmailsWithDefaults: function (test) {
        var self = this;
        exchanger.client = 'client';
        exchanger.getEmails('folderName', function (err, emails) {
            test.ok(self.call.name == 'getEmails');
            test.ok(self.call.args[0] == 'client');
            test.ok(self.call.args[1] == 'folderName');
            test.ok(!self.call.args[2]);
            test.ok(!self.call.args[3]);
            test.ifError(err);
            test.ok(emails);
            test.done();
        });
    },

    withCallbacksGetEmailsFailure: function (test) {
        this.throwError = true;
        exchanger.getEmails('folderName', 'limit', 'email', function (err) {
            test.ok(err);
            test.done();
        });
    },

    withCallbacksGetEmail: function (test) {
        var self = this;
        exchanger.client = 'client';
        exchanger.getEmail('id', function (err, emails) {
            test.ok(self.call.name == 'getEmail');
            test.ok(self.call.args[0] == 'client');
            test.ok(self.call.args[1] == 'id');
            test.ifError(err);
            test.ok(emails);
            test.done();
        });
    },

    withCallbacksGetEmailFailure: function (test) {
        this.throwError = true;
        exchanger.getEmail('id', function (err) {
            test.ok(err);
            test.done();
        });
    },

    withCallbacksGetFolders: function (test) {
        var self = this;
        exchanger.client = 'client';
        exchanger.getFolders('folderName', 'email', function (err, emails) {
            test.ok(self.call.name == 'getFolders');
            test.ok(self.call.args[0] == 'client');
            test.ok(self.call.args[1] == 'folderName');
            test.ok(self.call.args[2] == 'email');
            test.ifError(err);
            test.ok(emails);
            test.done();
        });
    },

    withCallbacksGetFoldersFailure: function (test) {
        this.throwError = true;
        exchanger.getEmails('folderName', 'email', function (err) {
            test.ok(err);
            test.done();
        });
    }
};