var assert = require('assert');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var settings = require('./settings');
var exchanger = require('../index');

module.exports = {
    initializeWithNoSettings: function (test) {
        exchanger.initialize()
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    initializeWithNoUrl: function (test) {
        exchanger.initialize({})
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    initializeWithNoUsername: function (test) {
        exchanger.initialize({url: settings.url, password: settings.password})
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    initializeWithNoPassword: function (test) {
        exchanger.initialize({url: settings.url, username: settings.username})
            .then(test.ifError, test.ok)
            .finally(function () {
                test.expect(1);
                test.done();
            })
            .done();
    },

    initializeWithExchange2010: function (test) {
        exchanger.initialize({url: settings.url, username: settings.username, password: settings.password, exchangeVersion: exchanger.enums.exchangeVersion.exchange2010})
            .then(function (client) {
                test.ok(client);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    initializeWithExchange2007: function (test) {
        exchanger.initialize({url: settings.url, username: settings.username, password: settings.password, exchangeVersion: exchanger.enums.exchangeVersion.exchange2007})
            .then(function (client) {
                test.ok(client);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },

    initializeHasClientWithFindItem: function (test) {
        exchanger.initialize(settings)
            .then(function (client) {
                test.ok(client.FindItem);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },


    initializeHasClientWithFindFolder: function (test) {
        exchanger.initialize(settings)
            .then(function (client) {
                test.ok(client.FindFolder);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    },


    initializeHasClientWithGetItem: function (test) {
        exchanger.initialize(settings)
            .then(function (client) {
                test.ok(client.GetItem);
            })
            .catch(test.ifError)
            .finally(test.done)
            .done();
    }
};