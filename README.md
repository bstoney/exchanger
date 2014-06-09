Query Microsoft's Exchange Web Services.
Only tested on Microsoft Exchange 2010.
With asynchronous promises.

##Install

Install with npm:

```
npm install exchanger
```

##Module

###exchanger.initialize(settings)

``` javascript
  var exchanger = require('exchanger');
  exchanger.initialize({ url: 'webmail.example.com', username: 'username', password: 'password' })
    .then(function(client) {
        console.log('Initialized!');
    });
```

###exchanger.getEmails(client, folderName, limit, emailAddress)

``` javascript
  var exchanger = require('exchanger');
  exchanger.initialize({ url: 'webmail.example.com', username: 'username', password: 'password' })
    .then(function(client) {
        return exchanger.getEmails(client, 'inbox', 50, 'email@test.com');
    })
    .then(function(emails){
        console.log(emails);
    });
```

###exchanger.getEmail(client, id)

``` javascript
  var exchanger = require('exchanger');
  exchanger.initialize({ url: 'webmail.example.com', username: 'username', password: 'password' })
    .then(function(client) {
        return [client, exchanger.getEmails(client, 'inbox', 50, 'email@test.com')];
    })
    .then(function(client, emails){
        return exchanger.getEmail(client, emails[0].id);
    })
    .then(function(email){
        console.log(email);
    });
```

###exchanger.getFolders(client, folderName, emailAddress)

``` javascript
    var exchanger = require('exchanger');
    exchanger.initialize({ url: 'webmail.example.com', username: 'username', password: 'password' })
        .then(function(client) {
            return exchanger.getFolders(client, 'inbox', 'email@test.com');
        })
        .then(function(folders){
            console.log(folders);
        });
```

##Support for callbacks rather then promises

``` javascript
    var exchanger = require('exchanger').withCallbacks;
    exchanger.initialize({ url: 'webmail.example.com', username: 'username', password: 'password' }, function(err) {
        console.log(err);
        exchanger.getEmails('inbox', 50, 'email@test.com', function(err, emails){
            if(err){
                console.log(err);
                return;
            }

            console.log(emails);
        });
    });
```

###Other Information
[EWS reference for Exchange](http://msdn.microsoft.com/en-us/library/office/bb204119\(v=exchg.150\).aspx)
