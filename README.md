# oauth2-js
Get and manage OAuth2 tokens in JavaScript.


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
