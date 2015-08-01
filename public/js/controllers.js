angular.module('RedditParser', ['cgBusy'])
	.controller('ParserFormController', function($scope, $http) {
		$scope.reddit = 'javascript';
		$scope.source = 'plain';

		$scope.settings = {
			format: 'csv',
			sort: 'title',
			order: 'asc',
			delimiter: ', ',
			table: 'articles',
			columns: 'id, title, created_at, score'
		};

		$scope.result = '// ';

		$scope.updateResult = function() {
			if ($scope.source == 'top') {
				$scope.updateResultPromise = $http.get('/api/v1/reddit/' + $scope.reddit + '/top', { params: $scope.settings })
					.success(function(data) {
						$scope.result = data;
					});
			} else {
				$scope.updateResultPromise = $http.get('/api/v1/reddit/' + $scope.reddit, { params: $scope.settings })
					.success(function(data) {
						$scope.result = data;
					});
			}
		}

		$scope.changeDepending = function() {
			if ($scope.source == 'top') {
				$scope.settings.sort = 'score';
				$scope.settings.columns = 'domain, count, score';
			} else {
				$scope.settings.sort = 'title';
				$scope.settings.columns = 'id, title, created_at, score';
			}
		}
	});