var path = require('path');
var url = require('url');
var crypto = require('crypto');
var moment = require('moment');
var xml2js = require('xml2js');
var fs = require('fs');
var Q = require('q');
var soap = require('soap');
var jade = require('jade');

(function (exports) {
//    'use strict';
    exports.client = null;

    var enums = {
        exchangeVersion: {
            exchange2010: '2010',
            exchange2007: '2007'
        },
        distinguishedFolderId: {
            inbox: 'inbox',
            outbox: 'outbox',
            sentItems: 'sentitems',
            drafts: 'drafts',
            deletedItems: 'deleteditems'
        }
    };

    exports.enums = enums;

    exports.initialize = function (settings) {
        var deferred = Q.defer();

        // TODO: Handle different locations of where the asmx lives.
        var endpoint = url.resolve('https://' + settings.url, '/EWS/Exchange.asmx');
        var definitionUrl = path.join(__dirname, 'Services_' + (settings.exchangeVersion || enums.exchangeVersion.exchange2010) + '.wsdl');

        soap.createClient(definitionUrl, {}, function (err, client) {
            if (err) {
                deferred.reject(err);
            }
            else if (!client) {
                deferred.reject(new Error('Could not create client'));
            }
            else {
                exports.client = client;
                exports.client.setSecurity(new soap.BasicAuthSecurity(settings.username, settings.password));

                deferred.resolve();
            }
        }, endpoint);

        return deferred.promise;
    };

    exports.getEmails = function (folderName, limit, emailAddress) {
        if (!exports.client) {
            return Q.reject(new Error('Call initialize()'));
        }

        var options = {
            folderName: folderName || enums.distinguishedFolderId.inbox,
            limit: limit || 10,
            emailAddress: emailAddress
        };

        function processResult(result) {
            var responseMessage = result.Envelope.Body.FindItemResponse.ResponseMessages.FindItemResponseMessage;
            var responseCode = responseMessage.ResponseCode;

            if (responseCode !== 'NoError') {
                throw new Error(responseCode);
            }

            var rootFolder = responseMessage.RootFolder;

            var emails = [];
            rootFolder.Items.Message.forEach(function (item, idx) {
                var md5hasher = crypto.createHash('md5');

                md5hasher.update(item.Subject + item.DateTimeSent);
                var hash = md5hasher.digest('hex');

                var itemId = {
                    id: item.ItemId.$.Id,
                    changeKey: item.ItemId.$.ChangeKey
                };

                var email_item = {
                    id: itemId.id + '|' + itemId.changeKey,
                    hash: hash,
                    subject: item.Subject,
                    dateTimeReceived: moment(item.DateTimeReceived).format("MM/DD/YYYY, h:mm:ss A"),
                    size: item.Size,
                    importance: item.Importance,
                    hasAttachments: item.HasAttachments === 'true',
                    from: item.From.Mailbox.Name,
                    isRead: item.IsRead === 'true',
                    meta: {
                        itemId: itemId
                    }
                };
                emails.push(email_item);
            });

            return emails;
        }

        function findItem(soapRequest) {
            return getSoapResponse(exports.client.FindItem, soapRequest);
        }

        return getSoapRequest(path.join(__dirname, 'resources/find_item.jade'), options)
            .then(findItem)
            .then(parseSoapResponse)
            .then(processResult);
    };

    exports.getEmail = function (itemId) {
        if (!exports.client) {
            return Q.reject(new Error('Call initialize()'));
        }

        if ((!itemId.id || !itemId.changeKey) && itemId.indexOf('|') > 0) {
            var s = itemId.split('|');

            itemId = {
                id: itemId.split('|')[0],
                changeKey: itemId.split('|')[1]
            };
        }

        if (!itemId.id || !itemId.changeKey) {
            return Q.reject(new Error('Id is not correct.'));
        }

        function processResult(result) {
            var responseMessage = result.Envelope.Body.FindItemResponse.ResponseMessages.GetItemResponseMessage;
            var responseCode = responseMessage.ResponseCode;

            if (responseCode !== 'NoError') {
                throw new Error(responseCode);
            }

            var item = responseMessage.Items.Message;

            var itemId = {
                id: item.ItemId.$.Id,
                changeKey: item.ItemId.$.ChangeKey
            };

            function handleMailbox(mailbox) {
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

            var toRecipients = handleMailbox(item.ToRecipients);
            var ccRecipients = handleMailbox(item.CcRecipients);
            var from = handleMailbox(item.From);

            var email = {
                id: itemId.id + '|' + itemId.changeKey,
                subject: item.Subject,
                bodyType: item.Body.BodyType,
                body: item.Body._,
                size: item.Size,
                dateTimeReceived: item.DateTimeReceived ? moment(item.DateTimeReceived).format("MM/DD/YYYY, h:mm:ss A") : null,
                dateTimeSent: moment(item.DateTimeSent).format("MM/DD/YYYY, h:mm:ss A"),
                dateTimeCreated: moment(item.DateTimeCreated).format("MM/DD/YYYY, h:mm:ss A"),
                toRecipients: toRecipients,
                ccRecipients: ccRecipients,
                from: from,
                isRead: item.IsRead === 'true',
                meta: {
                    itemId: itemId
                }
            };

            return email;
        }

        function getItem(soapRequest) {
            return getSoapResponse(exports.client.GetItem, soapRequest);
        }

        return getSoapRequest(path.join(__dirname, 'resources/get_item.jade'), itemId)
            .then(getItem)
            .then(parseSoapResponse)
            .then(processResult);
    };

    exports.getFolders = function (id, callback) {
        if (typeof(id) === 'function') {
            callback = id;
            id = 'inbox';
        }

        var soapRequest =
            '<tns:FindFolder xmlns:tns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
                '<tns:FolderShape>' +
                '<t:BaseShape>Default</t:BaseShape>' +
                '</tns:FolderShape>' +
                '<tns:ParentFolderIds>' +
                '<t:DistinguishedFolderId Id="inbox"></t:DistinguishedFolderId>' +
                '</tns:ParentFolderIds>' +
                '</tns:FindFolder>';

        exports.client.FindFolder(soapRequest, function (err, result) {
            if (err) {
                callback(err);
            }

            if (result.ResponseMessages.FindFolderResponseMessage.ResponseCode === 'NoError') {
                var rootFolder = result.ResponseMessages.FindFolderResponseMessage.RootFolder;

                rootFolder.Folders.Folder.forEach(function (folder) {
                    // console.log(folder);
                });

                callback(null, {});
            }
        });
    };

    function getSoapRequest(filename, options) {
        return Q.promise(function (resolve, reject) {
            jade.renderFile(filename, options, function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }

    function getSoapResponse(operation, soapRequest) {
        return Q.promise(function (resolve, reject) {
            operation.call(exports.client, soapRequest, function (err, result, body) {
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
                    resolve(data);
                }
            });
        });
    }

})(this.exports || this);