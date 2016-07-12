'use strict';
var BpmnViewer = require('bpmn-js');
var DmnViewer = require('dmn-js/lib/Viewer');
var angular = require('angular');


angular.module('HomeApp', [])
.controller('HomeCtrl', function($scope, $http) {
	console.log('HomeCtrl');
	$scope.openOtherProtocol = true;

	readProtocolDir($scope, $http);

	$http.get("/v/readAllDeployment").success(function(response) {
		$scope.readAllDeployment = response;
		console.log($scope.readAllDeployment)
	});
});

var app = angular.module('Protocole5App', [])
.controller('Protocole5Ctrl', function($scope, $http) {
	console.log('protocole5');
	initAngularCommon($scope, $http);
	console.log($scope.params.p);
	
	var urlForContent = '/v/readContent';
	if($scope.params.p){
		urlForContent = '/v/readProtocol/' + $scope.params.p;
	}
	console.log(urlForContent);
	
	$http.get(urlForContent).success(function(protocol) {
		console.log(protocol);
		$scope.obj = {
			data : protocol,
			options : { mode : 'tree' }
		};
		editor.set($scope.obj.data);
		initBpmnDmnToId($scope.obj.data);
		viewerBpmnDmn($scope.obj.data);
	});

	function getMaxNr(keyPart){
		var maxN = 0;
		for (var key1 in $scope.obj.data) {
			if(key1.indexOf('dmn')>=0){
				var n = key1.split('dmn')[1];
				if(!isNaN(n)){
					maxN = Math.max(maxN, n);
				}
			}
		}
		maxN++;
		return maxN;
	}

	$scope.createNewDMN = function(){
		console.log("-------createNewDMN--------");
		var maxN = getMaxNr('dmn');
		console.log(maxN);
		$http.get("/h/dev/sah/p4/resources/newDMN.dmn").success(function(response) {
			$scope.obj.data['dmn'+maxN] = {dmnContent:response};
			console.log($scope.obj.data);
			if($scope.useJsonEditor){
				editor.set($scope.obj.data);
			}
			$scope.saveFile();
		});
	}

	$scope.createNewBpmn = function(){
		console.log("-------createNewBpmn--------");
		var maxN = getMaxNr('bpmn');
		console.log(maxN);
		$http.get("/h/dev/sah/p4/resources/newDiagram.bpmn").success(function(response) {
			$scope.obj.data['bpmn'+maxN] = {height:200, bpmnContent:response};
			console.log($scope.obj.data);
			if($scope.useJsonEditor){
				editor.set($scope.obj.data);
			}
			$scope.saveFile();
		});
	}

	$scope.editJson = function(){
		console.log("-------editJson--------");
		if($scope.useJsonEditor){
			editor.set($scope.obj.data);
		}else{
			$scope.obj.data = editor.get();
			$scope.saveFile();
			location.reload();
		}
	}

	var JSONEditor = require('jsoneditor');
	var container = document.getElementById("jsoneditor");
	var editor = new JSONEditor(container, { });

	$scope.deployFile = function(){
		console.log("-------deployFile--------");
		var urlToSave = '/v/deployProtocol';
		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}

	$scope.saveFile = function(){
		console.log("-------saveFile--------");
		console.log($scope.useJsonEditor);
		if($scope.useJsonEditor){
			$scope.obj.data = editor.get();
		}
		
		var urlToSave = '/saveCommonContent';
		if($scope.obj.data.fileName){
			urlToSave = '/saveProtocol';
		}
		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}

	readProtocolDir($scope, $http);
});

function readProtocolDir($scope, $http){
	$http.get("/v/readProtocolDir").success(function(response) {
		$scope.protocolList = response;
		console.log($scope.protocolList)
		$scope.openOtherProtocol = true;
	});
}

function addProtocol(){
	if(params.p){
		return '&p='+params.p;
	}
	return '';
}
function viewerBpmnDmn(protocol){
	for (var dmnNr in protocol.init.camundaAppendix.dmn){
		var dmnViewerInitData = protocol.init.camundaAppendix.dmn[dmnNr];
		var caElement = angular.element(document.querySelector(dmnViewerInitData.container.container));
		caElement.prepend(angular.element('<a id="/'
				+dmnViewerInitData.path+'" href="/h/dev/sah/p5-view/dist/p5dmn.html?jsonpath='
				+dmnViewerInitData.path+addProtocol()+'">' +dmnViewerInitData.path+ '</a>'));
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
		var caElement = angular.element(document.querySelector(bpmnViewerInitData.container.container));
		caElement.prepend(angular.element('<a id="/'
				+bpmnViewerInitData.path+'" href="/h/dev/sah/p4/dist/index.html?jsonpath='
				+bpmnViewerInitData.path+addProtocol()+'">' +bpmnViewerInitData.path+ '</a>'));
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


//Controler
angular.module('P5DmnApp', [])
.controller('P5DmnCtrl', function($scope, $http) {
	console.log('p5Dmn');
	initAngularCommon($scope, $http);
	var DmnModeler = require('dmn-js/lib/Modeler');
	console.log(DmnModeler);
	var renderer = new DmnModeler({ container: '#dmn-canvas' });
	console.log(renderer);
	var urlForContent = '/v/readContent';
	if($scope.params.p){
		urlForContent = '/v/readProtocol/' + $scope.params.p;
	}
	console.log(urlForContent);
	$http.get(urlForContent).success(function(response) {
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
		function exportArtifacts() {
			saveDiagram(function(err, xml) {
				console.log("-----2-------------------");
				setBpmnContent($scope.obj.data, params.jsonpath, xml);
			});
		}
		renderer.on('commandStack.changed', exportArtifacts);

	});
	$scope.saveFile = function(){
		console.log("-------saveFile--------");
		var urlToSave = '/saveCommonContent';
		if($scope.obj.data.fileName){
			urlToSave = '/saveProtocol';
		}
		console.log($scope.obj.data);
		console.log(urlToSave);
		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}
	
	$scope.addProtocolUrl = function(){
		if(params.p){
			return '?p='+params.p;
		}
		return '';
	}

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

function initAngularCommon($scope, $http){
	$scope.params = params;
}

//console.log("params = " + location.search);
const params = require('query-string').parse(location.search);
console.log(params);
