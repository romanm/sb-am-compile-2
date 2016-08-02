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

	$scope.showProcessActiviti = function(procDefId){
		console.log(procDefId);
		$http.get("/v/showProcessActiviti/"+procDefId).success(function(response) {
			$scope.processActiviti = response;
			console.log($scope.processActiviti);
		});
	}

	$scope.collectData = function(procInstId, taskId){
		console.log(procInstId+'/'+taskId);
		$http.get('/v/collectData/'+procInstId+'-'+taskId).success(function(response) {
			$scope.collectData = response;
			console.log($scope.collectData);
		});
		/*
		 * */
	}

	$scope.executeTask = function(procInstId, taskId){
		console.log(procInstId);
		$http.get("/v/executeTask/"+procInstId).success(function(response) {
			$scope.processActiviti = response;
			console.log($scope.processActiviti);
		});
	}

	$scope.startProcess = function(key){
		console.log(key);
		$http.post('/v/startProcess/'+key).success(function(response) {
			console.log(response);
		});
	};

});

var app = angular.module('Protocole5App', [])
.controller('Protocole5Ctrl', function($scope, $http) {
	console.log('Protocole5Ctrl');
	initAngularCommon($scope, $http);

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
		initBpmnDmnToId($scope);
		viewerBpmnDmn($scope.obj.data);
		console.log($scope.obj.data);
	});

	function getMaxNr(keyPart){
		var maxN = 0;
		for (var key1 in $scope.obj.data) {
			if(key1.indexOf(keyPart)>=0){
				var n = key1.split(keyPart)[1];
				if(!isNaN(n)){
					maxN = Math.max(maxN, n);
				}
			}
		}
		maxN++;
		return maxN;
	}

	$scope.addDmnToBpmn = function(dmnXmldoc, businessRuleTask, editorBpmnNr){
//		console.log(dmn.toString());
		console.log(dmnXmldoc.firstChild.attr.id);
		console.log(dmnXmldoc.descendantWithPath('decision').toString());
		console.log(dmnXmldoc.descendantWithPath('decision.decisionTable.output').toString());
		var dmnId = dmnXmldoc.descendantWithPath('decision').attr.id;
		console.log(dmnId);
		var outputName = dmnXmldoc.descendantWithPath('decision.decisionTable.output').attr.name;
		businessRuleTask.attr['camunda:decisionRef'] = dmnId;
		businessRuleTask.attr['camunda:resultVariable'] = dmnId+'__'+outputName;
		businessRuleTask.attr['camunda:mapDecisionResult'] = 'singleEntry';
		console.log(businessRuleTask.toString());
		var bpmnJS = $scope.obj.data.init.camundaAppendix.bpmn[editorBpmnNr];
		console.log(bpmnJS);
		var bpmnKey = bpmnJS.path.split('.')[0];
		var bpmnObj = $scope.obj.data[bpmnKey];
		bpmnObj.bpmnContent = bpmnJS.xmldoc.toString();
		console.log(bpmnObj);
	}

	$scope.createNewDMN = function(){
		console.log("-------createNewDMN--------");
		var maxN = getMaxNr('dmn');
		console.log(maxN);
		$http.get("/h/dev/sah/p4/resources/newDMN.dmn").success(function(response) {
			var keyDmn = 'dmn'+maxN;
			$scope.obj.data[keyDmn] = {dmnContent:response};
			initNewDmn(keyDmn, $scope);
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
		console.log("-------editJson--------" + $scope.useJsonEditor);
		if($scope.useJsonEditor){
			editor.set($scope.obj.data);
		}else{
			console.log("-------editJson--------");
			$scope.obj.data = editor.get();
			$scope.saveFile();
			//location.reload();
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
//		console.log($scope.useJsonEditor);
		if($scope.useJsonEditor){
			$scope.obj.data = editor.get();
		}
		
		var urlToSave = '/saveCommonContent';
		if($scope.obj.data.fileName){
			urlToSave = '/saveProtocol';
		}
		console.log(urlToSave+'/{' +editor.get().fileName+'}?' + $scope.obj.data.fileName);
 		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}

	readProtocolDir($scope, $http);
});

function readProtocolDir($scope, $http){
	$http.get("/v/readProtocolDir").success(function(response) {
		$scope.protocolList = response;
		//console.log($scope.protocolList)
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
		var dmnContext = jsonPath(protocol, dmnViewerInitData.path+'.dmnContent');
		viewerDmn.importXML(dmnContext, function(err) {
			if (err) {
				console.log('error rendering', err);
			} else {
				console.log('rendered: '+dmnViewerInitData.path);
			}
		});
	}

	for (var bpmnNr in protocol.init.camundaAppendix.bpmn){
		//console.log(bpmnNr);
		var bpmnViewerInitData = protocol.init.camundaAppendix.bpmn[bpmnNr];
		//console.log(protocol.init.camundaAppendix.bpmn[bpmnNr].xmldoc);
		//console.log(protocol.init.camundaAppendix.bpmn[bpmnNr].xmldoc
//		.descendantWithPath('bpmn:process').childNamed('bpmn:businessRuleTask').toString());
		/*
		var caElement = angular.element(document.querySelector(bpmnViewerInitData.container.container));
		caElement.prepend(angular.element('<a id="/'
				+bpmnViewerInitData.path+'" href="/h/dev/sah/p4/dist/index.html?jsonpath='
				+bpmnViewerInitData.path+addProtocol()+'">' +bpmnViewerInitData.path+ '</a>'));
		 * */
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

var xmldoc = require('xmldoc');

function initNewDmnId(dmnNr, $scope){
	var appendixDmn = $scope.obj.data.init.camundaAppendix.dmn[dmnNr];
	var dmnKey = appendixDmn.path;
	var dmnId = $scope.obj.data.fileName + '_' + dmnKey;
	appendixDmn.xmldoc.firstChild.attr.id = dmnId;
	$scope.obj.data[dmnKey].dmnContent = appendixDmn.xmldoc.toString();
}

function initNewDmn(keyDmn, $scope){
	var camundaAppendix = $scope.obj.data.init.camundaAppendix;
	var dmnNr = camundaAppendix.dmn.length;
	addAppendixDmn(keyDmn, dmnNr, camundaAppendix, $scope);
	initNewDmnId(dmnNr, $scope);
}

function addAppendixDmn(keyDmn, dmnNr, camundaAppendix, $scope){
	var dmnXmldoc = new xmldoc.XmlDocument($scope.obj.data[keyDmn].dmnContent);
	console.log(dmnXmldoc);
	console.log(dmnXmldoc.firstChild.attr.id);
	$scope.obj.data[keyDmn].dmnName = dmnXmldoc.firstChild.attr.id;
	console.log("------------");
//	camundaAppendix.dmn.push({path: keyDmn+'.dmnContent'
	camundaAppendix.dmn.push({path: keyDmn
		, xmldoc: dmnXmldoc
		, container:{container:'#dmn-canvas-' + dmnNr}
	});
}

function initBpmnXml(protocol, key1, bpmnXmldoc){
	var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
	console.log(bpmnXmldoc.attr.targetNamespace);
	bpmnXmldoc.attr.targetNamespace = 'http://camunda.org/schema/1.0/bpmn';
	bpmnXmldoc.attr['xmlns:camunda'] = 'http://camunda.org/schema/1.0/bpmn';
	bpmnXmldoc.firstChild.attr.name = protocol.protocolName;
	bpmnXmldoc.firstChild.attr.id = protocol.fileName + '_' +key1;
	bpmnXmldoc.firstChild.attr.isExecutable = 'true';
	/*
	 * */
	console.log(bpmnXmldoc.firstChild.attr);
	protocol[key1].bpmnContent = bpmnXmldoc.toString();
	return bpmnXmldoc;
}

function initBpmnDmnToId($scope){
	var protocol = $scope.obj.data;
	var camundaAppendix = {bpmn:[],dmn:[]};
	var bpmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('bpmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('bpmnContent')>=0){
					var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
					bpmnXmldoc = initBpmnXml(protocol, key1, bpmnXmldoc);
//					console.log($scope.obj.data.bpmn3.bpmnContent);
//					xd.attr.newatt1 = "value new attribute 1";
//					xd.attr['ns:newatt2'] = "value new attribute 2";
					camundaAppendix.bpmn.push(
						{path: key1+'.bpmnContent'
						, xmldoc: bpmnXmldoc
						, container:
							{container:'#bpmn-canvas-' + bpmnNr
							, height: protocol[key1].height
							}
						}
					);
					bpmnNr++;
				}
			}
		}
	}
	var dmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('dmn')>=0){
			console.log(key1);
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('dmnContent')>=0){
					var dmnContent = protocol[key1].dmnContent;
					addAppendixDmn(key1, dmnNr, camundaAppendix, $scope);
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
	console.log('P5DmnCtrl');
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
		var dmnContent = jsonPath($scope.obj.data, params.jsonpath+'.dmnContent');
		console.log(dmnContent);
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
				setBpmnContent($scope.obj.data, params.jsonpath+'.dmnContent', xml);
			});
		}
		renderer.on('commandStack.changed', exportArtifacts);

	});
	$scope.saveFileTheDMN = function(){
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

function jsonPath_stop(obj, path){
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
