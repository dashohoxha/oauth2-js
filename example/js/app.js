
var $app = (function () {

    /**
     * When the page with id 'example' is created,
     * do the things that are listed in the function.
     */
    $(document).on('pagecreate', '#example', function() {
        // Setup menu items.
        menu_setup();

        // Remove a dynamic-popup after it has been closed.
        $(document).on('popupafterclose', '.dynamic-popup', function() {
            $(this).remove();
        });
    });

    /**
     * Setup menu items.
     */
    var menu_setup = function () {
        // Close the menu when an item is clicked.
        $('#popupMenu li').on('click', function() {
            $('#popupMenu').popup('close');
        });

        $('#menuButton').on('click', function() {
            if ($user.isLoged()) {
                $('#login').hide();
                $('#logout').show();
            }
            else {
                $('#login').show();
                $('#logout').hide();
            }
        });

        $('#login').on('click', function () {
            $user.login();
        });

        $('#logout').on('click', function () {
            $user.logout();
        });
    };

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

    /**
     * Display status and error messages.
     * 
     * @param msg {string}
     *   The message to be displayed.
     * @param type {string}
     *     The type of the message: status|error|warning
     * @params time {number}
     *     The time in seconds to display the message.
     */
    var message = function (msg, type, time) {
        // Set some default values, if params are missing.
        type = type || 'status';
        time = time || 5;

        // Create and add the message element.
        var $el = $('<p class="message ' + type + ' ui-mini">' + msg + '</p>');
        $('#messages').append($el).hide().slideToggle('slow');

        // After some seconds remove this message.
        setTimeout(function () {
            $el.slideToggle('slow', function () {
                $(this).remove();
            });
        }, time * 1000);

        // If the message is clicked, remove it.
        $('.message').on('click', function (event) {
            $(this).slideToggle('fast', function () {
                $(this).remove();
            });
        });
    };

    /**
     * Extend the function $.ajax().
     */
    var http_request = function(url, settings) {
        // If parameter settings is not given, assign a default value.
        var settings = settings || {};

        // Set some parameters of the ajax request.
        settings.url = $config.api_url + url;
        settings.dataType = 'json';
        // Before sending the request display a loading icon.
        settings.beforeSend = function() {
            $.mobile.loading('show');
            return true;
        };

        // Make the request and handle some common cases.
        var request = $.ajax(settings);
        request.always(function(){
            // Hide the loading icon.
            $.mobile.loading('hide');
        });
        request.fail(function(jqXHR, errorThrown, textStatus) {
            //console.log(jqXHR);  //debug
            //console.log(textStatus);  //debug
            //console.log(errorThrown);  //debug
            if (jqXHR.responseJSON) {
                if (jqXHR.responseJSON.error) {
                    message(jqXHR.responseJSON.error + ': ' + jqXHR.responseJSON.error_description, 'error');
                }
                else {
                    message(jqXHR.responseJSON[0], 'error');
                }
            }
            else {
                message(textStatus, 'error');
            }
        });

        return request;
    }

})();
