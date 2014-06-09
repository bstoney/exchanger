var Q = require('q');
var xml2js = require('xml2js');

function getSoapResponse(operation, soapRequest) {
    return Q.promise(function (resolve, reject) {
        var builder = new xml2js.Builder({explicitRoot: true, headless: true, renderOpts: {pretty: false}});
        var xml = builder.buildObject(soapRequest);
        operation.call(exports.client, xml, function (err, result, body) {
            if (err) {
                reject(err);
            }
            else {
                resolve(body);
            }
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

function parseItemId(item) {
    return {
        id: item.$.Id,
        changeKey: item.$.ChangeKey
    };
}

function parseMailbox(mailbox) {
    var mailboxes = [];

    if (!mailbox || !mailbox.Mailbox) {
        return mailboxes;
    }
    mailbox = mailbox.Mailbox;

    function getMailboxObj(mailboxItem) {
        return {
            name: mailboxItem.Name,
            emailAddress: mailboxItem.EmailAddress
        };
    }

    if (mailbox instanceof Array) {
        mailbox.forEach(function (m, idx) {
            mailboxes.push(getMailboxObj(m));
        });
    } else {
        mailboxes.push(getMailboxObj(mailbox));
    }

    return mailboxes;
}

module.exports.getSoapResponse = getSoapResponse;
module.exports.parseSoapResponse = parseSoapResponse;
module.exports.parseItemId = parseItemId;
module.exports.parseMailbox = parseMailbox;