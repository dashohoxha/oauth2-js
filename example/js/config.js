/** Used for the local storage, etc. */
var $app_id = 'example';

/** Base URL of the server that offers the API. */
var $base_url = 'https://btranslator.org';

/** Settings for oauth2 authentication. */
var $oauth2_settings = {
    app_id: $app_id,
    token_endpoint: $base_url + '/oauth2/token',
    client_id: 'vocabulary-jquery-ict-sq',
    client_secret: 'Wadek9kAwgoovnepecOal8',
    scope: 'user_profile',
};
