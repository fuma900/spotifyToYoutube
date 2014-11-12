function init () {
	window.init();
}

var app = angular.module('app', ['serviceModule']);

app.controller('appCtrl', ['$scope', '$http', '$q', '$window', 'Youtube', 'Helper', 'Spotify', 
	function($scope, $http, $q, $window, Youtube, Helper, Spotify) {
	$scope.gapiReady = false;
	$scope.isLoggedIn = false;

	$window.init= function() {
		Youtube.setupApi();
		$scope.gapiReady = true;
		Youtube.checkAuth()
		.then(function(authResult) {
			if (authResult === true){
				$scope.isLoggedIn = true;
			} else {
				$scope.isLoggedIn = false;
			}
		});
	};

	$scope.checkAuth = function() {
		Youtube.checkAuth()
		.then(function(authResult) {
			if (authResult === true){
				$scope.isLoggedIn = true;
			} else {
				$scope.isLoggedIn = false;
			}
		});
	};

	$scope.login = function() {
		console.info('logging in');
		Youtube.login()
		.then(function(authResult) {
			if (authResult === true){
				$scope.isLoggedIn = true;
			}
		});
	};

	$scope.addToPlaylist = function() {
		$scope.checkAuth();
	};

	$scope.reset= function(){
		$scope.urls = "";
		$scope.results = [];
		$scope.youtubeIds = [];
	};

	$scope.run = function (){
		var tracks = [];
		var youtubeIds = [];

		if ($scope.urls !== '') {
			var ids = Helper.extractSpotifyId($scope.urls);
			var promises = Spotify.getTracks(ids);

			$q.all(promises)
			.then(function(results) {
				angular.forEach(results, function(v,k){
					tracks = tracks.concat(results[k].data.tracks);
				});
			})
			.then(function() {
				return Helper.getTracksInfo(tracks);
			})
			.then(function(tracks) {
				var promises = [];
				angular.forEach(tracks, function(track, i){
					promises.push(Youtube.searchVideo(track));
					// .then(function(response) {
					// 	tracks[i].youtubeId = response.result.items[0].id.videoId;
					// });
				});
				$q.all(promises)
				.then(function(response) {
					angular.forEach(tracks, function(track, i){
						tracks[i].youtubeId = response[i].result.items[0].id.videoId;
						youtubeIds.push(tracks[i].youtubeId);
					});
					$scope.results = tracks;
					$scope.youtubeIds = youtubeIds;
				});
			});
		}
	};

	$scope.urls = 	"http://open.spotify.com/track/0ifSeVGUr7py5GggttDhXw \nhttp://open.spotify.com/track/6c6OMbNVGHxGZWGc9ubHwq \nhttp://open.spotify.com/track/6gp3RHhdZlrPGaf5qcgFSg \nhttp://open.spotify.com/track/7pNC5ZIKtwUK0ReSpM3P9f";

	// $scope.run();

}]);