var services = angular.module('serviceModule', []);

services.service('Youtube', ['$q', '$window', 'Helper', function($q, $window, Helper) {

	this.clientId = '743605158714-vfjtaobdqlgshs7157r43e1ohntdkbe6.apps.googleusercontent.com';
	this.scopes = 'https://www.googleapis.com/auth/youtube';

	this.setupApi = function() {
		gapi.client.setApiKey('AIzaSyBKB-CGWlr3id6q4SObfRPrYrAIHcACPuk');
		$window.setTimeout(this.checkAuth,1);
	};

	this.checkAuth = function() {
		var deferred = $q.defer();
		gapi.auth.authorize({client_id: this.clientId, scope: this.scopes, immediate: true}, function(authResult) {
			if (authResult && !authResult.error) {
				deferred.resolve(true);
			} else if (!authResult) {
				deferred.resolve(false);
			} else {
				deferred.resolve(authResult.error);
			}
		});
		return deferred.promise;
	}

	this.login = function(event) {
		var deferred = $q.defer();
        // Step 3: get authorization to use private data
        gapi.auth.authorize({client_id: this.clientId, scope: this.scopes, immediate: false}, function(authResult) {
        	if (authResult && !authResult.error) {
				deferred.resolve(true);
			} else if (!authResult) {
				deferred.resolve(false);
			} else {
				deferred.resolve(authResult.error);
			}
        });
        return deferred.promise;
    }

    this.createPlaylist = function(playlistName) {
    	var deferred = $q.defer();
    	var request = gapi.client.youtube.playlists.insert({
    		part: 'snippet,status',
    		resource: {
    			snippet: {
    				title: playlistName,
    				description: 'A private playlist created with the YouTube API'
    			},
    			status: {
    				privacyStatus: 'private'
    			}
    		}
    	});
    	request.execute(function(response) {
    		var result = response.result;
    		if (result) {
    			deferred.resolve(result);
    		} else {
				deferred.resolve(false);
    		}
    	});
    	return deferred.promise;
    };

    this.addVideoToPlaylist = function(videoId, playlistId) {
    	var deferred = $q.defer();
    	var details = {
    		videoId: id,
    		kind: 'youtube#video'
    	}
    	var request = gapi.client.youtube.playlistItems.insert({
    		part: 'snippet',
    		resource: {
    			snippet: {
    				playlistId: playlistId,
    				resourceId: details
    			}
    		}
    	});
    	request.execute(function(response) {
    		deferred.resolve(result);
    	});
    	return deferred.promise;
    };

	this.loadApi = function(callback) {
		if(gapi.client){
			if (!gapi.client.youtube){
				gapi.client.load('youtube', 'v3', function() {
					callback();
				});
			} else {
				callback();
			}
		} else {
			Helper.sleep(2000);
			console.info('waiting for Google API to be loaded');
			this.loadApi(callback);
		}
	};

	this.searchVideo = function(track) {
		var deferred = $q.defer();
		this.loadApi(function() {
			var q = track.artists + " " + track.name;
			var request = gapi.client.youtube.search.list({
				q: q,
				part: 'id'
			});
			request.then(function(response) {
				deferred.resolve(response);
			});	
		});
		return deferred.promise;
	};

	this.searchVideos = function(tracks) {
		var responses = [];
		angular.forEach(tracks, function(track){
			this.searchVideo(track)
			.then(function(response) {
				responses.push(response);
			});
		});
		return $q.when(responses);
	};
}]);

services.service('Spotify', ['$q', '$http', 'Helper', 'Youtube', function($q, $http, Helper, Youtube) {
	this.getTracks = function (ids){
		var chunks = [];
		var promises = [];
		var tracks = [];

		if (ids.length > 1000){
			return;
		}

		// Workaround to avoid limit of 50 tracks
		if (ids.length > 50){
			for (var i=0,j=ids.length; i<j; i+=50){
				chunks.push(ids.slice(i,i+50));
			}
		} else {
			chunks = [ids];
		}
		
		for (var k=0; k<chunks.length; k+=1) {
			promises.push(
				$http.get('https://api.spotify.com/v1/tracks', {
					params: {ids: chunks[k].join()},
				})
			);
		}
		return promises;
	};
}]);

services.service('Helper', ['$q', function($q) {
	this.extractSpotifyId = function (urls){
		var ids = [];
		urls = urls.split(/\n/);

		angular.forEach(urls, function(url){
			var type = 0;								// 0: not set, 1: http, 2: spotify uri
			var a = url.trim().split(':');			// Split lines and remove whitespaces
			// Check if the url is http link or spotify uri
			type = (a[0] === 'http') ? ( 
					1
				) : (
					(a[0] === 'spotify')?2:0
				);
			if (type === 0){
				console.log('Url ' + url.trim() + ' is not valid!');
			} else {
				var id = a[a.length - 1].split('/');
				id = id[id.length - 1];
				ids.push(id);
			}
		});

		return ids;
	};

	this.getTracksInfo = function(tracks) {
		var temp = [];

		console.log(tracks);
		for (var i=0; i<tracks.length; i+=1){
			if (tracks[i]){
				var artists = [];
				for (var j=0; j<tracks[i].artists.length; j+=1){
					artists.push(tracks[i].artists[j].name);
				}
				artists = artists.join(', ');
				temp.push({
					'album': 		tracks[i].album,
					'artists': 		artists,
					'name': 		tracks[i].name,
					'spotifyUrl': 	tracks[i].external_urls.spotify,
				});
			}
		}

		return $q.when(temp);
	};

	this.sleep = function (milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	};
}]);

services.directive('youtube', ['$window', function($window) {
  return {
    restrict: "E",

    scope: {
      height: "@",
      width: "@",
      videoid: "="
    },

    template: '<div></div>',

    link: function(scope, element) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;

      $window.onYouTubeIframeAPIReady = function() {

        player = new YT.Player(element.children()[0], {
          playerVars: {
            autoplay: 1,
            html5: 1,
            theme: "light",
            modesbranding: 1,
            color: "white",
            iv_load_policy: 3,
            showinfo: 1,
            controls: 1,
            // playlist: scope.videoid.join(),
          },
          height: 300,
          width: 570,
        });

      }

      scope.$watch('videoid', function(newValue, oldValue) {
        if (newValue == oldValue || newValue === '' || newValue === []) {
          return;
        }

        console.log(newValue);
        player.loadPlaylist({
        	playlist: scope.videoid,
        });

      }); 

      scope.$watch('height + width', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }

        player.setSize(scope.width, scope.height);

      });
    }  
  };
}]);