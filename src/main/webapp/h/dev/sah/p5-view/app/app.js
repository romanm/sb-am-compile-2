'use strict';
var BpmnViewer = require('bpmn-js');
var DmnViewer = require('dmn-js/lib/Viewer');
var angular = require('angular');

angular.module('HomeApp', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('HomeCtrl', function($scope, $http, $filter, $translate) {
	console.log('HomeCtrl');
	initAngularCommon($scope, $http);
	initDmnRule($scope);
	$scope.openOtherProtocol = true;

	readProtocolDir($scope, $http);

	$http.get("/v/readAllDeployment").success(function(response) {
		$scope.readAllDeployment = response;
	});

	$scope.showProcessActiviti = function(procDefId){
		$http.get("/v/showProcessActiviti/"+procDefId).success(function(response) {
			$scope.processActiviti = response;
		});
	}

	$scope.saveProcessVariable = function(procInstId, taskId){
		var variables = [];
		$scope.ask.dmnInputs.forEach(function(dmnInput){
			var varName = dmnInput.valueWithPath("inputExpression.text");
			var typeRef = dmnInput.valueWithPath("inputExpression@typeRef");
			variables.push({varName:varName,value:dmnInput.attr.value,typeRef:typeRef});
		});
		var nextTaskData = {
			nextTask:{
				nextTaskId:$scope.nextTask.attr.id
				,variables:variables
			}
			,procInstId:procInstId
			,taskId:taskId
		};
		$http({ method : 'POST', data : nextTaskData, url : '/v/nextTask'
		}).success(function(nextTaskData, status, headers, config){
			$scope.nextTaskData = nextTaskData;
			console.log($scope.nextTaskData);
		}).error(function(data, status, headers, config) {
			$scope.error = data;
		});
	}

	var setVariableValueToDmn = function(taskId){
		var values = {};
		$scope.processActiviti.varInstList.forEach(function(variable){
			if(variable.AITASKID == taskId){
				values[variable.NAME_] = variable.TEXT_;
			}
		});
		$scope.dmnsToTask.forEach(function(dmn){
			var dmnInputs = dmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
			dmnInputs.forEach(function(dmnInput){
				var varName = dmnInput.valueWithPath("inputExpression.text");
				if(values[varName]){
					dmnInput.attr.value = values[varName];
				}
			});
		});
	}

	var seekNextTask = function(taskDefKey, $scope){
		var camundaAppendix = $scope.collectData.protocol.init.camundaAppendix;
		var thisTask = null;
		camundaAppendix.bpmn.forEach(function(bpmn){
			bpmn.xmldoc.descendantWithPath('bpmn:process').children.forEach(function(bpmnElement){
				if(bpmnElement.attr.id == taskDefKey){
					thisTask = bpmnElement;
				}
			});
			var sequenceFlowId = thisTask.valueWithPath('bpmn:outgoing');
			var sequenceFlow = bpmn.xmldoc.descendantWithPath('bpmn:process').childWithAttribute('id',sequenceFlowId);
			$scope.nextTask = bpmn.xmldoc.descendantWithPath('bpmn:process').childWithAttribute('id',sequenceFlow.attr.targetRef);
		});
		if($scope.nextTask.name == 'bpmn:businessRuleTask'){
			var dmnName = $scope.nextTask.attr['camunda:decisionRef'];
			var path = 'dmn' + dmnName.split('_dmn')[1];
			$scope.ask = {};
			$scope.dmnsToTask = [];
			camundaAppendix.dmn.forEach(function(dmn){
				if(dmn.path == path){
					$scope.nextDmn = dmn;
					$scope.dmnsToTask.push(dmn);
					var dmnInputs = dmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
					$scope.ask.dmnInputs = dmnInputs;
				}
			});
		}
		console.log('from:' + thisTask.attr.name + taskDefKey + ' - > to:' + $scope.nextTask.attr.name);
	}

	$scope.collectMedData = function(procInstId, taskId){
		console.log('$http.get collectMedData:' + procInstId+'/'+taskId);
		$http.get('/v/collectData/'+procInstId+'-'+taskId).success(function(response) {
			$scope.collectData = response;
			console.log($scope.collectData);
			initBpmnDmnToId($scope.collectData.protocol);
			seekNextTask($scope.collectData.taskInst.TASK_DEF_KEY_, $scope);
	 		setVariableValueToDmn(taskId);
		});
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

//angular.module('Protocole5App', ['ngCookies', 'pascalprecht.translate'])
angular.module('Protocole5App', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('Protocole5Ctrl', function($scope, $http, $translate) {
	console.log('Protocole5Ctrl');
	initAngularCommon($scope, $http);
	console.log('Protocole5Ctrl');

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

function initDictionary($scope, $http){
	if(!$scope.dictionary){
		$scope.dictionary = {
			'drug':{'label':'ліки','typeRef':'string'}
		};
		$scope.protocolList.forEach(function(protocolFileName){
			$http.get('/v/readProtocol/' + protocolFileName).success(function(protocol) {
				for (var keyDmn in protocol) {
					if(keyDmn.indexOf('dmn')>=0){
						for (var key2 in protocol[keyDmn]) {
							if(key2.indexOf('dmnContent')>=0){
								var dmnInProtocol = protocol[keyDmn];
								var dmnXmldoc = new xmldoc.XmlDocument(dmnInProtocol.dmnContent);
								var dmnInputs = dmnXmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
								dmnInputs.forEach(function(dmnInput){
									var varName = dmnInput.valueWithPath("inputExpression.text");
									var typeRef = dmnInput.valueWithPath("inputExpression@typeRef");
									$scope.dictionary[varName] ={label:dmnInput.attr.label, typeRef:typeRef}; 
									//console.log($scope.dictionary);
								});
							}
						}
					}
				}
			});
		});
	}
}

function readProtocolDir($scope, $http){
	$http.get("/v/readProtocolDir").success(function(response) {
		$scope.protocolList = response;
		//console.log($scope.protocolList)
		$scope.openOtherProtocol = true;
		initDictionary($scope, $http);
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
	addAppendixDmn(keyDmn, dmnNr, camundaAppendix);
	initNewDmnId(dmnNr, $scope);
}

function addAppendixDmn(protocol, keyDmn, dmnNr, camundaAppendix){
	var dmnInProtocol = protocol[keyDmn];
	var dmnXmldoc = new xmldoc.XmlDocument(dmnInProtocol.dmnContent);
	dmnInProtocol.dmnName = dmnXmldoc.firstChild.attr.id;
	camundaAppendix.dmn.push({path: keyDmn
		, xmldoc: dmnXmldoc
		, container:{container:'#dmn-canvas-' + dmnNr}
	});
}

function initBpmnXml(protocol, key1, bpmnXmldoc){
	var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
	bpmnXmldoc.attr.targetNamespace = 'http://camunda.org/schema/1.0/bpmn';
	bpmnXmldoc.attr['xmlns:camunda'] = 'http://camunda.org/schema/1.0/bpmn';
	bpmnXmldoc.firstChild.attr.name = protocol.protocolName;
	bpmnXmldoc.firstChild.attr.id = protocol.fileName + '_' +key1;
	bpmnXmldoc.firstChild.attr.isExecutable = 'true';
	protocol[key1].bpmnContent = bpmnXmldoc.toString();
	return bpmnXmldoc;
}

function initBpmnDmnToId(protocol){
	var camundaAppendix = {bpmn:[],dmn:[]};
	var bpmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('bpmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('bpmnContent')>=0){
					var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
					bpmnXmldoc = initBpmnXml(protocol, key1, bpmnXmldoc);
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
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('dmnContent')>=0){
					addAppendixDmn(protocol, key1, dmnNr, camundaAppendix);
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
	console.log('Protocole5Ctrl');
	$http.get("/v/read_user").success(function(response) {
		$scope.userPrincipal = response;
		console.log($scope.userPrincipal);
	});
}

//console.log("params = " + location.search);
const params = require('query-string').parse(location.search);
console.log(params);

var Regex = require("regex");
var regex = new Regex(/[(\d+)..(\d+)]/);
function initDmnRule($scope){
	console.log($scope.dictionary);
	$scope.evalLogicExp = function(input, inputEntry){
		var value = input.attr.value;
		var expr = inputEntry.firstChild.val;
		var evalLogicExp = false;
		if(value){
			if(expr.indexOf('..') > 0){
				var endExpr = expr.replace('[',value + ' >= ').replace('..',' && ').replace(']',' >= ' + value);
				console.log(endExpr);
				evalLogicExp = eval(endExpr)
			}else{
				evalLogicExp = eval(value+expr)
			}
		}
		return evalLogicExp;
	}
}

function configTranslation($translateProvider){
	$translateProvider.useStaticFilesLoader({ prefix: '/v/i18n/', suffix: '.json' });
	//$translateProvider.useLocalStorage();
	var springCookieLocale = document.cookie.split('org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=')[1];
	if(springCookieLocale.indexOf(';') > 0){
		springCookieLocale = springCookieLocale.split(';')[0];
	}
	$translateProvider.preferredLanguage(springCookieLocale);
//	$translateProvider.preferredLanguage('en');
}

