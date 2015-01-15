
/** @namespace OAuth2 */
var OAuth2 = {};

/**
 * @class OAuth2.Token
 */
OAuth2.Token = function (settings) {
    /** Settings of the client. */
    var _settings = {
        app_id: 'app1',

        // OAuth2 settings
        token_endpoint: '/oauth2/token',
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
    };

    // Save the key/value pairs from the given parameter.
    for (var key in settings)  _settings[key] = settings[key];

    /** @const */
    var _nullToken = {
        access_token: null,
        expires_in: null,
        token_type: null,
        scope: null,
        refresh_token: null,
        expiration_time: 0,
    };

    /** Keeps data about the current access token. */
    var _token = _nullToken;

    /** Set a new token and save it in local storage. */
    var _save = function(token) {
        // Set to the class variable '_token'.
        _token = token;

        // Calculate the expiration time.
        var now = Math.round(new Date().getTime()/1000.0);
        _token.expiration_time = now + _token.expires_in;

        // Save the class variable in local storage.
        localStorage.setItem(_key(), JSON.stringify(_token));
    };

    /** Return the key for lcal storage. */
    var _key = function () {
        return (_settings.app_id + '.token.' + _settings.client_id);
    };

    /** Get token from local storage, if it exists. */
    var _load = function() {
        var str_value = localStorage.getItem(_key());
        if (!str_value || str_value == 'undefined') {
            return _nullToken;
        }
        return JSON.parse(str_value);
    };

    /**
     * Set the function that will use the access token.
     * Can be used like this:
     *   $token.get().done(function (access_token) { ... });
     */
    this.done = function (callback) {
        _settings.done = callback;
        return this;
    };

    /**
     * Set the function that will be called on failure.
     * Can be chained like this:
     *   $token.get().done( ... ).fail( ... );
     */
    this.fail = function (callback) {
        _settings.fail = callback;
        return this;
    };

    /**
     * Set the function that will be called for getting
     * the user password, when needed. Can be chained like this:
     *   $token.getPassword( ... ).get().done( ... );
     */
    this.getPassword = function (callback) {
        _settings.getPassword = callback;
        return this;
    };

    /** Expire the existing token. */
    this.expire = function () {
        var token = _load();
        token.expires_in = 0;
        _save(token);
        return this;
    };

    /** Erase the existing token. */
    this.erase = function () {
        localStorage.removeItem(_key());
        _token = _nullToken;
        return this;
    };

    /**
     * Get an access token and pass it to the callback function.
     * Returns the object itself, so that it can be chained like this:
     *   $token.get().done( ... ).fail( ... );
     */
    this.get = function () {
        // If there is no token, try to get it from local store.
        if (!_token.access_token)  _token = _load();

        // If the current token is a valid one, use it.
        if (_valid()) {
            setTimeout(function () {
                _settings.done(_token.access_token);
            }, 10);
            return this;
        }

        // Otherwise try to get another one.
        if (_token.refresh_token) {
            _refreshExisting();
        }
        else {
            _getNew();
        }

        return this;
    };


    /** Return true if there is a valid token. */
    var _valid = function () {
        // Check that we have an access_token.
        if (!_token)  return false;
        if (!_token.access_token)  return false;

        // Check that the token has not expired.
        if (!_token.expiration_time)  return false;
        var now = Math.round(new Date().getTime()/1000.0);
        if (_token.expiration_time < now + 5)  return false;

        // All checks passed successfully.
        return true;
    };

    /** Try to get a new token by using the refresh_token. */
    var _refreshExisting = function () {
        console.log('refresh_existing_token()'); //debug
        _get({
            grant_type: 'refresh_token',
            refresh_token: _token.refresh_token,
        })
            .fail(_getNew)
            .done(
                function (response) {
                    _save(response);
                    if (_token.access_token) {
                        _settings.done(_token.access_token);
                    }
                    else {
                        _getNew();
                    }
                });
    };

    /** Get a new token from the oauth2 server. */
    var _getNew = function (username, password) {
        console.log('_getNew()'); //debug

        if (!username || !password) {
            _settings.getPassword(_getNew);
            return;
        }

        _get({
            grant_type: 'password',
            username: username,
            password: password,
        })
            .fail(_settings.fail)
            .done(
                function (response) {
                    _save(response);
                    if (_token.access_token) {
                        _settings.done(_token.access_token);
                    }
                    else {
                        _settings.fail(this);
                    }
                });
    };

    /** Make an http request to the token endpoint. */
    var _get = function (post_data) {
        if (_settings.scope) {
            post_data.scope = _settings.scope;
        };
        var client_key = btoa(_settings.client_id + ':' 
                              + _settings.client_secret);  // base64_encode
        var request = $.ajax(_settings.token_endpoint, {
            type: 'POST',
            data: post_data,
            headers: {
                'Authorization': 'Basic ' + client_key, 
            },
            //dataType: 'json',
        });
        return request;
    };
}
