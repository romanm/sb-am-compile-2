var myAppModule = angular.module('MyApp', [ 'ng.jsoneditor' ]);
angular .module('MyApp', [ 'ng.jsoneditor' ]) .controller( 'ngCtrl', function($scope) {
	$scope.obj = {
		data : protocol1,
		options : { mode : 'tree' }
	};
	var notShowFields = ["xmlContent", "openChild", "editField"];
	$scope.isShowField = function(key) {
		return !(notShowFields.indexOf(key) >= 0);
	}
	$scope.openChild = function(object) {
		if(angular.isObject(object)){
			object.openChild = !object.openChild;
			console.log("-------------"+object.openChild);
		}
		console.log(object);
	};
	$scope.editField = function(object, fieldName) {
		object.editField = fieldName;
	};
	$scope.isObject = function(object) {
		return angular.isObject(object);
	};
	$scope.onLoad = function(instance) {
		instance.expandAll();
	};

	//other
	$scope.pretty = function(obj) {
		return angular.toJson(obj, true);
	}
});
