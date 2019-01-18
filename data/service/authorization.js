var Montage = require("core/core").Montage;

/**
 * An Authorization represents the details regarding access to a certain DataService.
 * Different type of DataServices that offer Authorization will provide different specialzied Authorization
 * subtypes. Login/Password and O-Auth are 2 examples.
 *
 * @class
 * @extends external:Montage
 */
var Authorization = exports.Authorization = Montage.specialize(/** @lends Authorization.prototype */ {

  logOut: {
    value: function () {
      console.warn("Authorization.logOut() must be overridden by the implementing object");
    }
  }

});

/*
    An example, GitHub Authorization:
    GET /authorizations/:id
    Response

    Status: 200 OK
    X-RateLimit-Limit: 5000
    X-RateLimit-Remaining: 4999
    {
      "id": 1,
      "url": "https://api.github.com/authorizations/1",
      "scopes": [
        "public_repo"
      ],
      "token": "",
      "token_last_eight": "12345678",
      "hashed_token": "25f94a2a5c7fbaf499c665bc73d67c1c87e496da8985131633ee0a95819db2e8",
      "app": {
        "url": "http://my-github-app.com",
        "name": "my github app",
        "client_id": "abcde12345fghij67890"
      },
      "note": "optional note",
      "note_url": "http://optional/note/url",
      "updated_at": "2011-09-06T20:39:23Z",
      "created_at": "2011-09-06T17:26:27Z",
      "fingerprint": "jklmnop12345678"
    }
*/
