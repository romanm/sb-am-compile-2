(function(angular) {
	'use strict';
	angular.module('MyApp', ['ng.jsoneditor'])
	.controller('NgCtrl', ['$scope', '$http', function($scope, $http) {
		$scope.pageTitle = "Протокол з BPMN & DMN";
		declareJsonSamples($scope);
		declareProtocol2($scope);
		$scope.obj = {
				data : {},
				options : { mode : 'tree' }
		};
		$http.get("/v/readContent").success(function(response) {
			console.log(response);
			$scope.obj = {
				data : response,
				options : { mode : 'tree' }
			};
		});
	}]);
})(window.angular);

var declareProtocol2 = function($scope){
	$scope.showRule = function() {
		console.log("-------showRule------------");
		console.log($scope.obj.data.dmn);
		if($scope.obj.data.dmn.jsonContent == null){
			var x2js = new X2JS();
			$scope.obj.data.dmn.jsonContent = x2js.xml_str2json($scope.obj.data.dmn.xmlContent);
		}
		var json = $scope.obj.data.dmn.jsonContent;
		console.log(json);
		console.log(json.definitions);
		console.log(json.definitions.decision);
		console.log(json.definitions.decision.decisionTable);
	}
	$scope.isObject = function(object) {
		return angular.isObject(object);
	};
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
	var notShowFields = ["xmlContent", "openChild", "editField"];
	$scope.isShowField = function(key) {
		return !(notShowFields.indexOf(key) >= 0);
	}
}

var declareJsonSamples = function($scope){
	console.log("---declareJsonSamples-------------");
	$scope.pretty = function(obj) {
		return angular.toJson(obj, true);
	}
}
