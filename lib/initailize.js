var path = require('path');
var url = require('url');
var Q = require('q');
var soap = require('soap');
var enums = require('./enums');
var xml2js = require('xml2js');

function getSoapResponse(client, operation, soapRequest) {
    return Q.promise(function (resolve, reject) {
        var builder = new xml2js.Builder({explicitRoot: true, headless: true, renderOpts: {pretty: false}});
        var xml = builder.buildObject(soapRequest);
        operation.call(client, xml, function (err, result, body) {
            return err ? reject(err) : resolve(body);
        });
    });
}

function parseSoapResponse(body) {
    return Q.promise(function (resolve, reject) {
        var parser = new xml2js.Parser({explicitArray: false, attrNameProcessors: [xml2js.processors.stripPrefix], tagNameProcessors: [xml2js.processors.stripPrefix]});
        parser.parseString(body, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Envelope.Body);
            }
        });
    });
}

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
            client.getSoapResponse = function(operation, soapRequest) {
                return getSoapResponse(client, operation, soapRequest).then(parseSoapResponse);
            };
            deferred.resolve(client);
        }
    }, endpoint);

    return deferred.promise;
};
