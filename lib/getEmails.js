var Q = require('q');
var crypto = require('crypto');
var moment = require('moment');
var common = require('./common');
var enums = require('./enums');

function FindItemRequest(folderName, limit, emailAddress) {
    this.FindItem = {$: {Traversal: "Shallow", xmlns: "http://schemas.microsoft.com/exchange/services/2006/messages", 'xmlns:t': "http://schemas.microsoft.com/exchange/services/2006/types"},
        ItemShape: {
            't:BaseShape': 'IdOnly',
            AdditionalProperties: {$: {xmlns: "http://schemas.microsoft.com/exchange/services/2006/types"},
                FieldURI: [
                    { $: { FieldURI: "item:ItemId" }},
                    { $: { FieldURI: "item:DateTimeCreated" }},
                    { $: { FieldURI: "item:DateTimeSent" }},
                    { $: { FieldURI: "item:HasAttachments" }},
                    { $: { FieldURI: "item:Size" }},
                    { $: { FieldURI: "message:From" }},
                    { $: { FieldURI: "message:IsRead" }},
                    { $: { FieldURI: "item:Importance" }},
                    { $: { FieldURI: "item:Subject" }},
                    { $: { FieldURI: "item:DateTimeReceived" }}
                ]
            }},
        IndexedPageItemView: {$: {BasePoint: "Beginning", Offset: "0", MaxEntriesReturned: limit}},
        ParentFolderIds: {
            DistinguishedFolderId: {$: {Id: folderName, xmlns: "http://schemas.microsoft.com/exchange/services/2006/types"}}
        }};

    if (emailAddress) {
        this.FindItem.ParentFolderIds.DistinguishedFolderId.Mailbox = {EmailAddress: emailAddress };
    }
}

module.exports = function (client, folderName, limit, emailAddress) {
    if (!client) {
        return Q.reject(new Error('Call initialize()'));
    }

    folderName = folderName || enums.distinguishedFolderId.inbox;
    limit = limit || 10;

    function processResult(result) {
        var responseMessage = result.FindItemResponse.ResponseMessages.FindItemResponseMessage;
        var responseCode = responseMessage.ResponseCode;

        if (responseCode !== 'NoError') {
            throw new Error(responseCode);
        }

        var rootFolder = responseMessage.RootFolder;

        var emails = [];

        function parseEmail(item, idx) {
            var md5hasher = crypto.createHash('md5');

            md5hasher.update(item.Subject + item.DateTimeSent);
            var hash = md5hasher.digest('hex');

            var itemId = common.parseItemId(item.ItemId);

            var email_item = {
                id: itemId.id + '|' + itemId.changeKey,
                hash: hash,
                subject: item.Subject,
                dateTimeReceived: moment(item.DateTimeReceived).format("MM/DD/YYYY, h:mm:ss A"),
                size: item.Size,
                importance: item.Importance,
                hasAttachments: item.HasAttachments === 'true',
                from: common.parseMailbox(item.From),
                isRead: item.IsRead === 'true',
                meta: {
                    itemId: itemId
                }
            };
            emails.push(email_item);
        }

        switch (rootFolder.$.TotalItemsInView) {
            case "0":
                break;
            case "1":
                parseEmail(rootFolder.Items.Message);
                break;
            default:
                rootFolder.Items.Message.forEach(parseEmail);
                break;
        }

        return emails;
    }

    return client.getSoapResponse(client.FindItem, new FindItemRequest(folderName, limit, emailAddress))
        .then(processResult);
};