
var json = {
		"Array" : [ 1, 2, 3 ],
		"Boolean" : true,
		"Null" : null,
		"Number" : 123,
		"Object" : {
			"a" : "b",
			"c" : "d"
		},
		"String" : "Hello World"
};

var myAppModule = angular.module('MyApp', [ 'ng.jsoneditor' ]);
angular .module('MyApp', [ 'ng.jsoneditor' ]) .controller( 'ngCtrl', function($scope) {
	$scope.obj = {
			data : json,
			options : { mode : 'tree' }
	};
	$scope.onLoad = function(instance) {
		instance.expandAll();
	};
	$scope.changeData = function() {
		$scope.obj.data = { foo : 'bar' };
	};
	$scope.changeOptions = function() {
		$scope.obj.options.mode = $scope.obj.options.mode == 'tree' ? 'code' : 'tree';
	};

	//other
	$scope.pretty = function(obj) {
		return angular.toJson(obj, true);
	}
});
