var Q = require('q');
var common = require('./common');

function FindFolderRequest(parentFolderName, emailAddress) {
    this.FindFolder = {
        $: {Traversal: "Shallow", xmlns: "http://schemas.microsoft.com/exchange/services/2006/messages", 'xmlns:t': "http://schemas.microsoft.com/exchange/services/2006/types"},
        FolderShape: { 't:BaseShape': 'Default'},
        ParentFolderIds: {
            DistinguishedFolderId: {$: {Id: parentFolderName, xmlns: "http://schemas.microsoft.com/exchange/services/2006/types"}}
        }
    };

    if (emailAddress) {
        this.FindFolder.ParentFolderIds.DistinguishedFolderId.Mailbox = {EmailAddress: emailAddress};
    }
}

module.exports = function (client, parentFolderName, emailAddress) {
    if (!client) {
        return Q.reject(new Error('Call initialize()'));
    }

    parentFolderName = parentFolderName || 'inbox';

    function processResult(result) {
        var responseMessage = result.FindFolderResponse.ResponseMessages.FindFolderResponseMessage;
        var responseCode = responseMessage.ResponseCode;
        if (responseCode !== 'NoError') {
            throw new Error(responseCode);
        }

        var rootFolder = responseMessage.RootFolder;

        var folders = [];

        function parseFolder(folder) {
            var itemId = common.parseItemId(folder.FolderId);
            folders.push({
                id: itemId.id + '|' + itemId.changeKey,
                name: folder.DisplayName
            });
        }

        switch (rootFolder.$.TotalItemsInView) {
            case "0":
                break;
            case "1":
                parseFolder(rootFolder.Folders.Folder);
                break;
            default:
                rootFolder.Folders.Folder.forEach(parseFolder);
                break;
        }

        return folders;
    }

    return client.getSoapResponse(client.FindFolder, new FindFolderRequest(parentFolderName, emailAddress))
        .then(processResult);
};