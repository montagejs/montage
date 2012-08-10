/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage/core/core").Montage;

var API_KEY = "gp967ctbkuhh32ztc2knmj9p";

exports.Remotemediator = Montage.create( Montage, {
    TRAILERS_FEED: {
        value: "https://gdata.youtube.com/feeds/api/videos?q=%s+official+trailer&max-results=1&v=2&alt=json"
    },

    BOXOFFICE_FEED: {
        value: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?limit=15&country=us&apikey=" + API_KEY
    },

    UPCOMING_FEED: {
        value: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/upcoming.json?page_limit=30&page=1&country=us&apikey=" + API_KEY
    },

    TOPRENTALS_FEED: {
        value: "http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/top_rentals.json?limit=20&country=us&apikey=" + API_KEY
    },

    INTHEATERS_FEED: {
        value: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?page_limit=30&page=1&country=us&apikey=" + API_KEY
    },

    load: {
        value: function() {
            this.loadLatestBoxofficeMovies();
            this.loadUpcomingMovies();
            this.loadTopDvdRentals();
            this.loadInTheaters();
        }
    },

    jsonpCall: {
        value: function(url, callback) {
            var callbackName = "scriptCallback" + callback.uuid.replace(/-/g, "_"),
                script = document.createElement("script");

            window[callbackName] = function(data) {
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                callback.apply(this, arguments);
            };

            script.type = 'text/javascript';
            script.src = url + "&callback=" + callbackName;
            // naughty...
            document.head.appendChild(script);
        }
    },

    searchYoutubeTrailer: {
        value: function(title, callback) {
            var title_array = title.split(" "),
                search_string = "",
                word;

            for (var i = 0, length=title_array.length; i < length; i++) {
                word = title_array[i];
                if( i != 0 ){
                    search_string += "+";
                }
                search_string += word;
            };

             var search_url = this.TRAILERS_FEED.replace("%s", search_string);
             this.jsonpCall(search_url, function(event) {
                 callback(event.feed.entry[0].media$group.yt$videoid.$t);
             });
        }

    },

    loadLatestBoxofficeMovies: {
        value: function( data ){
             this.jsonpCall(this.BOXOFFICE_FEED, this.latestBoxofficeMoviesCallback);
        }

    },

    latestBoxofficeMoviesCallback: {
        value: function(event) {
            var movies = event.movies;

            if( !movies ){
                alert( "flixter api error, please try again" );
            } else {
                this.dispatchEventNamed("remoteDataReceived", true, true, { type: "latestBoxofficeMovies", data: movies })

            }

        }
    },

    loadUpcomingMovies: {
        value: function( data ){
             this.jsonpCall(this.UPCOMING_FEED, this.upcomingMoviesCallback);
        }
    },

    upcomingMoviesCallback: {
        value: function(event) {
            var movies = event.movies;

            if( !movies ){
                alert( "flixter api error, please try again" );
            } else {
                this.dispatchEventNamed("remoteDataReceived", true, false, { type: "upcomingMovies", data: movies })
            }

        }
    },

    loadTopDvdRentals: {
        value: function( data ){
             this.jsonpCall(this.TOPRENTALS_FEED, this.topDvdRentalsCallback);
        }

    },

    topDvdRentalsCallback: {
        value: function(event) {
            var movies = event.movies;

            if( !movies ){
                alert( "flixter api error, please try again" );
            } else {
                this.dispatchEventNamed("remoteDataReceived", true, false, { type: "topDvdRentals", data: movies })
            }

        }
    },

    loadInTheaters: {
        value: function( data ){
             this.jsonpCall(this.INTHEATERS_FEED, this.inTheatersCallback);
        }
    },

    inTheatersCallback: {
        value: function(event) {
            var movies = event.movies;

            if( !movies ){
                alert( "flixter api error, please try again" );
            } else {
                this.dispatchEventNamed("remoteDataReceived", true, false, { type: "inTheaters", data: movies })
            }

        }
    }
});
