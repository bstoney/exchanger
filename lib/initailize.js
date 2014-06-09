var path = require('path');
var url = require('url');
var Q = require('q');
var soap = require('soap');
var enums = require('./enums');

module.exports = function (settings) {
    if(!settings){
        return Q.reject(new Error("settings are required"));
    }
    if(!settings.url){
        return Q.reject(new Error("an endpoint URL is required"));
    }
    if(!settings.username || !settings.password){
        return Q.reject(new Error("a username and password is required"));
    }

    // TODO: Handle different locations of where the asmx lives.
    var endpoint = url.resolve('https://' + settings.url, '/EWS/Exchange.asmx');
    var definitionUrl = path.join(__dirname, 'schema/Services_' + (settings.exchangeVersion || enums.exchangeVersion.exchange2010) + '.wsdl');

    var deferred = Q.defer();

    soap.createClient(definitionUrl, {}, function (err, client) {
        if (err) {
            deferred.reject(err);
        }
        else if (!client) {
            deferred.reject(new Error('Could not create client'));
        }
        else {
            client.setSecurity(new soap.BasicAuthSecurity(settings.username, settings.password));
            deferred.resolve(client);
        }
    }, endpoint);

    return deferred.promise;
};
