'use strict';
var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
	var BpmnViewer = window.BpmnJS;
	var viewerBpm = new BpmnViewer({ container: '#bpmn-canvas', height: 690 });
	console.log(viewerBpm);
	var DmnViewer = window.DmnJS;
	var viewerDmn = new DmnViewer({ container: '#dmn-canvas' });
	console.log(viewerDmn);

//	$http.get("../resources/complex.bpmn").success(function(response) {
	$http.get("sepsis-LCGuideline-1.bpmn").success(function(response) {
		viewerBpm.importXML(response, function(err) {
			if (err) {
				console.error(err);
			} else {
				console.log('rendered');
//				viewer.get('js-canvas').zoom('fit-viewport');
			}
		});
	});
	$http.get("dmn-sepsis-1.xml").success(function(response) {
		viewerDmn.importXML(response, function(err) {
			if (err) {
				console.log('error rendering', err);
			} else {
				console.log('rendered');
			}
		});
	});

	$scope.firstName = "John";
	$scope.lastName = "Doe";
});
