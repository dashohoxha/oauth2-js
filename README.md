# oauth2-js

Get and manage OAuth2 tokens in JavaScript. For the time being it supports only the User Credentials (Password Authentication) flow. It saves the received token in the local storage and reuses it until it expires. When the token has expired, it tries to refresh it using the refresh_token. If this fails, then the authentication process starts from the beginning (get a username and password from the user, and use them to receive a new token).

## Interface

### Constructor

```javascript
var $token = new OAuth2.Token({
    app_id: 'app1',
    
    // OAuth2 settings
    token_endpoint: base_url + '/oauth2/token',
    client_id: 'client1',
    client_secret: 'secret1',
    scope: '',
    
    // Function to call for asking a username and password from the user.
    getPassword: function (callback) {
        var username = prompt('Please enter your username', '');
        var password = prompt('Please enter your password', '');
        callback(username, password);
    },
   
   // Function to call after getting an access token.
    done: function(access_token) {
        console.log('Access token: ' + access_token);
    }, 
    
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
     * the user password, when needed. Can be chained like this:
     *   $token.getPassword( ... ).get().done( ... );
     */
    this.getPassword = function (callback) {
        _settings.getPassword = callback;
        return this;
    };
```

### Expire the current token

```javascript
$token.expire();
```

### Erase the current token

```javascript
$token.erase();
```

### Get an access_token

```javascript
    /**
     * Get an access token and pass it to the callback function.
     * Returns the object itself, so that it can be chained like this:
     *   $token.get().done( ... ).fail( ... );
     */
    this.get = function () { ... };
```


## Example

For an example see:

- [config.js (1-20)](https://github.com/B-Translator/vocabulary-jquery/blob/master/app/config.js#L1-20)
```javascript
var $app_id = 'vocabulary';
var $base_url = 'https://btranslator.org';
var $oauth2_settings = {
    app_id: $app_id,
    token_endpoint: $base_url + '/oauth2/token',
    client_id: 'vocabulary-jquery-ict-sq',
    client_secret: 'Wadek9kAwgoovnepecOal8',
    scope: 'user_profile',
};
```

- [app.js (1-35)](https://github.com/B-Translator/vocabulary-jquery/blob/master/app/app.js#L1-35)
```javascript
/** Get a username and password and pass them to the callback function. */
var get_username_and_password = function (callback) {
    // Wait 1 sec so that any other popups are closed.
    setTimeout(function () {
        // Display the login template.
        var popup_html = $('#tmpl-login').html();
        $(popup_html)
            .appendTo($.mobile.activePage)
            .toolbar();
        $("#popup-login")
            .popup()           // init popup
            .popup('open');    // open popup

        // When the form is submitted, pass the username
        // and password to the callback function.
        $('#form-login').on('submit', function (event) {
            var username = $('#username')[0].value;
            var password = $('#password')[0].value;
            callback(username, password);
        });
    }, 1000);
};

/**
 * Create an oauth2 client that will get and manage an access_token.
 */
$oauth2_settings.getPassword = get_username_and_password;
$oauth2_settings.done = function (access_token) {
        console.log('Access Token: ' + access_token);
    };
var $token = new OAuth2.Token($oauth2_settings);
//$token.erase();  //test
//$token.expire();  //test

```

- [app.js (252-271)](https://github.com/B-Translator/vocabulary-jquery/blob/master/app/app.js#L252-271)
```javascript
/**
 * Send a vote for the translation with the given id.
 */
var vote_translation = function (tguid) {
    $token.get().done(
        function (access_token) {
            http_request('/btr/translations/vote', {
                method: 'POST',
                data: { tguid: tguid },
                headers: { 'Authorization': 'Bearer ' + access_token }
            })
                .done(function () {
                    console.log('Vote submitted successfully.');
                    refresh_translation_list();
                })
                .fail(function () {
                    console.log('Vote submition failed.');
                });
        });
};
```
