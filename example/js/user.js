
/**
 * Create an object to manage the user and its state.
 */
var $user = new (function () {
    var that = this;

    /** The username of the currently signed-in user. */
    this.name = null;

    /** Set the name of the user and display it on the status. */
    var _setName = function (name) {
        that.name = name;
        if (name) {
            $('#status-line').html('<strong>' + name + '</strong>').show();
        }
        else {
            $('#status-line').hide().html('');
            $('#picture').hide().attr('src', '');
        }
    };

    /**
     * Get a username and password and pass them
     * to the given callback function.
     */
    var _getPassword = function (callback) {
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
                _setName(username);
                callback(username, password);
                $('#popup-login').popup('close');
            });
        }, 1000);
    };

    this.token = new OAuth2.Token($oauth2_settings);
    this.token.getPassword(_getPassword);
    //this.token.erase();  //test
    //this.token.expire();  //test

    /** Return true if the cuurrent user is signed-in. */
    this.isLoged = function () {
        return this.name;
    };

    /** Reload the page. */
    var _reload = function () {
        location.href = location.href.replace(/(\?|#).*/, '');
        location.reload();
    };

    /** Function to login. */
    this.login = function () {
        if (this.isLoged())  return;
        this.token.get().done(_reload);
    };

    /** Function to logout. */
    this.logout = function () {
        _setName(null);
        this.token.erase();
        setTimeout(_reload, 100);
    };

    // User permissions.
    this.permissions = [];

    // Check the current token and update the user name.
    var _update = function () {
        // Try to refresh the token using refresh_token.
        var _refresh = function () {
            _setName(null);
            that.token.get(false).done(_update);
        };

        // Check that the given token is valid,
        // then update the user name and user profile.
        var _check_token = function (access_token) {
            $.ajax($base_url + '/oauth2/tokens/' + access_token)
                .fail(_refresh)
                .done(function (response) {
                    _setName(response.user_id);
                    _get_user_profile(access_token);
                });
        }

        // Get the user profile and save his permissions.
        var _get_user_profile = function (access_token) {
            $.ajax($base_url + '/oauth2/user/profile', {
                type: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                },
                dataType: 'json',
            })
                .done(function (response) {
                    that.permissions = response.permissions;
                    response.picture ?
                        $('#picture').attr('src', response.picture.url).show() :
                        $('#picture').hide();
                });
        }

        // The main code of _update() function.
        if (!that.token) {
            _setName(null);
            return;
        }
        var access_token = that.token.access_token();
        access_token ? _check_token(access_token) : _refresh();
    };
    
    $(document).on('pagecreate', '#example', function() {
        // Check the current token and update the status every few minutes. 
        _update();  setInterval(_update, 2*60*1000);  // check every 2 minutes
    });
})();
