var Q = require('q');

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

module.exports.parseItemId = parseItemId;
module.exports.parseMailbox = parseMailbox;