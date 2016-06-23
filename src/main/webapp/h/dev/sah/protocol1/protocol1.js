var myAppModule = angular.module('MyApp', [ 'ng.jsoneditor' ]);
angular .module('MyApp', [ 'ng.jsoneditor' ]) .controller( 'ngCtrl', function($scope, $http) {
	$scope.obj = {
			data : {},
			options : { mode : 'tree' }
	};
	$http.get("/v/readContent").success(function(response) {
		var protocol1 = response;
		console.log(protocol1);
		$scope.obj = {
			data : protocol1,
			options : { mode : 'tree' }
		};
	});
	$scope.saveFile = function(){
		console.log("-------saveFile--------");
		$http.post("/saveCommonContent", $scope.obj.data ).success(function(response) {
			console.log(response);
		});
	}
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
		if(object.editField == fieldName)
			object.editField = "";
		else
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
