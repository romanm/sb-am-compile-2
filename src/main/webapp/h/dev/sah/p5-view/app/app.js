'use strict';
var BpmnViewer = require('bpmn-js');
var DmnViewer = require('dmn-js/lib/Viewer');
var angular = require('angular');

angular.module('P5DmnApp', [])
.controller('P5DmnCtrl', function($scope, $http) {
	console.log('p5Dmn');
	var DmnModeler = require('dmn-js/lib/Modeler');
	console.log(DmnModeler);
	var renderer = new DmnModeler({ container: '#dmn-canvas' });
	console.log(renderer);
	$http.get("/v/readContent").success(function(response) {
		var protocol1 = response;
		$scope.obj = {
			data : protocol1,
			options : { mode : 'tree' }
		};
		var dmnContent = jsonPath($scope.obj.data, params.jsonpath)
//		console.log(dmnContent);
		renderer.importXML(dmnContent, function(err) {
			if (err) {
				console.log('error rendering', err);
			} else {
				console.log('rendered: ' + params.jsonpath);
			}
		});
		function saveDiagram(done) {
			renderer.saveXML({ format: true }, function(err, xml) {
				done(err, xml);
			});
		}
		var exportArtifacts = function() {
			saveDiagram(function(err, xml) {
				console.log("-----2-------------------");
				setBpmnContent($scope.obj.data, params.jsonpath, xml);
			});
		}
		renderer.on('commandStack.changed', exportArtifacts);
		
		initAngularCommon($scope, $http);

	});
});

function setBpmnContent(obj, path, xml){
//	console.log(xml);
	var pathList = path.split('.');
	if(pathList.length == 1){
		obj[pathList[0]] = xml;
	} else if(pathList.length == 2){
		obj[pathList[0]][pathList[1]] = xml;
	}
}

function jsonPath(obj, path){
	var findObj = obj;
	var pathList = path.split('.');
	pathList.forEach(function(key){
		findObj = findObj[key];
	});
	return findObj;
}

var app = angular.module('Protocole5App', []);
app.controller('Protocole5Ctrl', function($scope, $http) {
	console.log('protocole5');

	$http.get("/v/readContent").success(function(response) {
		var protocol1 = response;
		$scope.obj = {
			data : protocol1,
			options : { mode : 'tree' }
		};
		editor.set($scope.obj.data);
		initBpmnDmnToId($scope.obj.data);
		viewerBpmnDmn($scope.obj.data);
//		var bpmnContent = jsonPath($scope.obj.data, params.jsonpath)
//		openDiagram(bpmnContent);
	});

	$scope.editJson = function(){
		console.log("-------editJson--------");
		if($scope.useJsonEditor){
			editor.set($scope.obj.data);
		}else{
			$scope.obj.data = editor.get();
		}
	}

	var JSONEditor = require('jsoneditor');
	var container = document.getElementById("jsoneditor");
	var editor = new JSONEditor(container, { });

	initAngularCommon($scope, $http);
});

function initAngularCommon($scope, $http){
	$scope.params = params;
	$scope.saveFile = function(){
		console.log("-------saveFile--------");
//		$http.post("/saveCommonContent", editor.get() ).success(function(response) {
		$http.post("/saveCommonContent", $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}
}

function viewerBpmnDmn(protocol){
	console.log(protocol.init.camundaAppendix);
	for (var dmnNr in protocol.init.camundaAppendix.dmn){
		var dmnViewerInitData = protocol.init.camundaAppendix.dmn[dmnNr];
		console.log(dmnViewerInitData);
		var caElement = angular.element(document.querySelector(dmnViewerInitData.container.container));
		caElement.prepend(angular.element('<a id="/'
				+dmnViewerInitData.path+'" href="/h/dev/sah/p5-view/dist/p5dmn.html?jsonpath='
				+dmnViewerInitData.path+'">' +dmnViewerInitData.path+ '</a>'));
		var viewerDmn = new DmnViewer(dmnViewerInitData.container);
		var dmnContext = jsonPath(protocol, dmnViewerInitData.path);
		viewerDmn.importXML(dmnContext, function(err) {
			if (err) {
				console.log('error rendering', err);
			} else {
				console.log('rendered: '+dmnViewerInitData.path);
			}
		});
	}
	for (var bpmnNr in protocol.init.camundaAppendix.bpmn){
		var bpmnViewerInitData = protocol.init.camundaAppendix.bpmn[bpmnNr];
		console.log(bpmnViewerInitData.container.container);
		var caElement = angular.element(document.querySelector(bpmnViewerInitData.container.container));
		caElement.prepend(angular.element('<a id="/'
				+bpmnViewerInitData.path+'" href="/h/dev/sah/p4/dist/index.html?jsonpath='
				+bpmnViewerInitData.path+'">' +bpmnViewerInitData.path+ '</a>'));
		var viewerBpm = new BpmnViewer(bpmnViewerInitData.container);
		var bpmnContext = jsonPath(protocol, bpmnViewerInitData.path);
		viewerBpm.importXML(bpmnContext, function(err) {
			if (err) {
				console.error(err);
			} else {
				console.log('rendered: ' + bpmnViewerInitData.path);
			}
		});
	}
}

function jsonPath(obj, path){
	var findObj = obj;
	var pathList = path.split('.');
	pathList.forEach(function(key){
		findObj = findObj[key];
	});
	return findObj;
}

function initBpmnDmnToId(protocol){
	var camundaAppendix = {bpmn:[],dmn:[]};
	var bpmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('bpmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('bpmnContent')>=0){
					camundaAppendix.bpmn.push({path: key1+'.'+key2 
						, container:{container:'#bpmn-canvas-' + bpmnNr, height: protocol[key1].height}}); 
					bpmnNr++;
				}
			}
		}
	}
	var dmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('dmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('dmnContent')>=0){
					camundaAppendix.dmn.push({path: key1+'.'+key2 
						, container:{container:'#dmn-canvas-' + dmnNr}}); 
					dmnNr++;
				}
			}
		}
	}
	protocol['init'] = {'camundaAppendix':camundaAppendix};
}

//console.log("params = " + location.search);
const params = require('query-string').parse(location.search);
console.log(params);
