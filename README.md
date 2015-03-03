# oauth2-js

Get and manage OAuth2 tokens in JavaScript.

For the time being it supports only the User Credentials (Password Authentication) flow. It saves the received token in the local storage and reuses it until it expires. When the token has expired, it tries to refresh it using the refresh_token. If this fails, then the authentication process starts from the beginning (get a username and password from the user, and use them to receive a new token). There is also a 'proxy' authorization flow which uses a server based oauth2 client. 

## Interface

### Constructor

```javascript
var $token = new OAuth2.Token({
    app_id: 'app1',
    
    // OAuth2 settings
    auth_flow: 'password',                  // password | proxy
    proxy_endpoint: 'https://example.org/oauth2/proxy',
    token_endpoint: 'https://example.org/oauth2/token',
    client_id: 'client1',
    client_secret: 'secret1',
    scope: '',

    // Function to call for asking a username and password from the user.
    getPassword: function (callback) {
	var username = prompt('Please enter your username', '');
	var password = prompt('Please enter your password', '');
	callback(username, password);
    },

    // Function to call for opening a new window
    // (used in the case of proxy auth flow).
    openLoginWindow: function (url, callback) {
	var win = window.open(url);
	callback(url, win);
    },

    // Function to call after getting an access token.
    done: function() {},

    // Function to call when getting an access token fails.
    fail: function(jqXHR, textStatus, errorThrown ) {
	console.log(textStatus + ' ' + jqXHR.status + ': ' + errorThrown);
    },
});
```

### Set callback function

```javascript
    /**
     * Set the function that will use the access token.
     * Can be used like this:
     *   $token.get().done(function (access_token) { ... });
     */
    this.done = function (callback) {
        _settings.done = callback;
        return this;
    };
```

### Set failure function

```javascript
    /**
     * Set the function that will be called on failure.
     * Can be chained like this:
     *   $token.get().done( ... ).fail( ... );
     */
    this.fail = function (callback) {
        _settings.fail = callback;
        return this;
    };
```

### Set the password function

```javascript
    /**
     * Set the function that will be called for getting
     * the user password, when needed.
     */
    this.getPassword = function (callback) {
        _settings.getPassword = callback;
        return this;
    };

    /**
     * Set the function that will be called for opening
     * a new window with the proxy login.
     */
    this.openLoginWindow = function (callback) {
        _settings.openLoginWindow = callback;
        return this;
    };
```

### Return the current access token

```javascript
$token.access_token();
```

### Expire the current token

```javascript
$token.expire();
```

### Erase the current token

```javascript
$token.erase();
```

### Get an access token

```javascript
    /**
     * Get an access token and pass it to the callback function.
     *
     * @param get_new {boolean}
     *     If true, it will also try to get a new token when refreshing fails.
     *
     * Returns the object itself, so that it can be chained like this:
     *   $token.get().done( ... ).fail( ... );
     */
    this.get = function () { ... };
```


## Example

For an example see: 
 - http://dashohoxha.github.io/oauth2-js/example/
 - https://github.com/dashohoxha/oauth2-js/tree/master/example

Some highlights from the example:

- [example/js/config.js](https://github.com/dashohoxha/oauth2-js/blob/master/example/js/config.js)
```javascript
var $config = {
    api_url: 'https://btranslator.org',

    // Settings for oauth2 authentication.
    oauth2: {
	app_id: 'example',
	auth_flow: 'proxy',     // password | proxy
	proxy_endpoint: 'https://l10n.org.al/oauth2/proxy',
	token_endpoint: 'https://btranslator.org/oauth2/token',
	client_id: 'vocabulary-jquery-ict-sq',
	client_secret: 'Wadek9kAwgoovnepecOal8',
	scope: 'user_profile',
    },
};
```

- [example/js/user.js (123-125)](https://github.com/dashohoxha/oauth2-js/blob/master/example/js/user.js#L123-125)
```javascript
    this.token = new OAuth2.Token($config.oauth2);
    this.token.getPassword(_getPassword);
    this.token.openLoginWindow(_openLoginWindow);
```

- [example/js/app.js (47-76)](https://github.com/dashohoxha/oauth2-js/blob/master/example/js/app.js#L47-76)
```javascript
    var add_new_term = function () {
        var term = $('#search-term')[0].value;
        if (!term)  return false;

        // Get the access_token.
        var access_token = $user.token.access_token();
        if (!access_token) {
            $user.token.get().done(add_new_term);
            return false;
        }

        // Add the new term.
        http_request('/btr/project/add_string', {
            type: 'POST',
            data: {
                origin: 'vocabulary',
                project: 'ICT_sq',
                string: term,
                context: 'vocabulary',
                notify: true,
            },
            headers: {
                'Authorization': 'Bearer ' + access_token,
            }
        })
            .done(function (result) {
                display_translations(result.sguid);
                message('New term added.');
            });
    };
```

Note that we first try to use an existing access_token, but if there is no valid access_token we get a new one and call back this function when it is done:
```javascript
    var add_new_term = function () {

        // Get the access_token.
        var access_token = $user.token.access_token();
        if (!access_token) {
            $user.token.get().done(add_new_term);
            return false;
        }

        // Do what we need to do with the access_token
        // [ . . . . . . . . . . ]
    };
```
