var Q = require('q');
var common = require('./common');
var moment = require('moment');

function GetItemRequest(itemId) {
    this.GetItem = {
        $: {xmlns: "http://schemas.microsoft.com/exchange/services/2006/messages", 'xmlns:t': "http://schemas.microsoft.com/exchange/services/2006/types"},
        ItemShape: {
            't:BaseShape': 'Default',
            't:IncludeMimeContent': 'true'},
        ItemIds: {
            't:ItemId': {$: {Id: itemId.id, ChangeKey: itemId.changeKey}}
        }
    };
}

module.exports = function (client, itemId) {
    if (!client) {
        return Q.reject(new Error('Call initialize()'));
    }

    if ((!itemId.id || !itemId.changeKey) && itemId.indexOf('|') > 0) {
        var parts = itemId.split('|');

        itemId = {
            id: parts[0],
            changeKey: parts[1]
        };
    }

    if (!itemId.id || !itemId.changeKey) {
        return Q.reject(new Error('Id is not correct.'));
    }

    function processResult(result) {
        var responseMessage = result.GetItemResponse.ResponseMessages.GetItemResponseMessage;
        var responseCode = responseMessage.ResponseCode;

        if (responseCode !== 'NoError') {
            throw new Error(responseCode);
        }

        var item = responseMessage.Items.Message;

        var itemId = common.parseItemId(item.ItemId);
        var toRecipients = common.parseMailbox(item.ToRecipients);
        var ccRecipients = common.parseMailbox(item.CcRecipients);
        var from = common.parseMailbox(item.From);

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

    return client.getSoapResponse(client.GetItem, new GetItemRequest(itemId))
        .then(processResult);
};