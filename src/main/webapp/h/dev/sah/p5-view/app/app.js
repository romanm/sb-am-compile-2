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

	initUserState($scope, $http);
	readProtocolDir($scope, $http);

	$http.get("/v/readAllDeployment").success(function(response) {
		$scope.readAllDeployment = response;
	});

	$scope.setTabs1 = function(tabs1){
		$scope.userState.tabs1 = tabs1;
	}

	$scope.getVarValText = function(varInst){
		var varName = varInst.NAME_;
		if(varInst.NAME_.indexOf('__')>0){
			var vnSplit = varInst.NAME_.split('__');
			varName = vnSplit[vnSplit.length - 1];
		}
		
		var varVal = setVarValue(varInst);

		var varLabel = $scope.dictionary[varName]?$scope.dictionary[varName].label:varName;
		if(varLabel.indexOf('(')>0){
			return varLabel.replace('(',varVal + ' (');
		}
		return varLabel + ' ' + varVal;
	}

	$scope.showProcessActiviti = function(procDefId){
		$scope.userState.tabs1 = 'home_performed';
		$scope.userState.procDefId = procDefId;
		console.log(procDefId);
		var url = '/v/showProcessActiviti/' + procDefId;
		$http.get(url).success(function(response) {
			$scope.processActiviti = response;
			console.log($scope.processActiviti);
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

	$scope.collectMedData = function(procInstId, taskId){
		$scope.openDmnVariable = taskId == $scope.openDmnVariable?0:taskId;
		console.log('$http.get collectMedData:' + procInstId+'/'+taskId);
		$scope.userState.taskId = taskId;
		readCollectMedData($scope, $http, procInstId, taskId);
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


/*
function initEditorBpmn($scope, $http){
	$scope.getFlowVerticalTable = function(editorBpmnNr){
		var bpmnInit = $scope.obj.data.init.camundaAppendix.bpmn[editorBpmnNr];
	}
}
 * */
angular.module('DevFlowAsTreeApp', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('DevFlowAsTreeCtrl', function($scope, $http, $translate) {
	console.log('DevFlowAsTreeCtrl');
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
		console.log($scope.obj.data);
//		editor.set($scope.obj.data);
		initBpmnDmnToId($scope.obj.data, $scope);
//		viewerBpmnDmn($scope.obj.data);
	});
	
});

//angular.module('Protocole5App', ['ngCookies', 'pascalprecht.translate'])
angular.module('Protocole5App', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('Protocole5Ctrl', function($scope, $http, $translate) {
	console.log('Protocole5Ctrl');
	//initEditorBpmn($scope, $http);
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
		initBpmnDmnToId($scope.obj.data, $scope);
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

	$scope.lastParentId = function(parentIds){
		var parentIds = parentIds.split(' '); 
		var lastParentId = parentIds[parentIds.length - 1];
		return lastParentId;
	}

	/*
	 * */
	$scope.setRuleState = function(parallelOneTable, rule, ruleHead){
		console.log("----------------");
		var ruleOutput = parallelOneTable.dmn.xmldoc.descendantWithPath('decision.decisionTable.output');
		var valOutput = rule.descendantWithPath('outputEntry.text').val;
		var valInput = rule.descendantWithPath('inputEntry.text').val;
		ruleOutput.attr.value = valOutput;
		ruleOutput.attr.expInput = valInput;
		parallelOneTable.flowTableElement.valueRule = rule.descendantWithPath('description').val;
	}

	$scope.getParallelOneTable = function(flowTableElement, bpmnInit){
		var parentId = $scope.lastParentId(flowTableElement.parentIds);
		var flowElementConfig = $scope.obj.data.config[bpmnInit.path][parentId];
		if(!flowElementConfig.parallelOneTable){
			flowElementConfig.parallelOneTable = [];
			flowTableElement.children.forEach(function(c){
				c.nodeTree.forEach(function(flowTableElement2){
					if(flowTableElement2.node.name == 'bpmn:sequenceFlow'){
						var parallelOneTableElement = {flowTableElement:flowTableElement2};
						var parallelOneTableElement2 = {flowTableElement:flowTableElement2};
						var businessRuleTask = bpmnInit.processElements[flowTableElement2.node.attr.targetRef].obj;
						$scope.obj.data.init.camundaAppendix.dmn.forEach(function(nextDmn){
							if(businessRuleTask.attr['camunda:decisionRef'] == nextDmn.xmldoc.firstChild.attr.id){
								parallelOneTableElement.dmn = nextDmn;
								parallelOneTableElement2.dmn = nextDmn;
							}
						});
						flowElementConfig.parallelOneTable.push(parallelOneTableElement);
						flowElementConfig.parallelOneTable.push(parallelOneTableElement2);
					}
				});
			});
		}
		return flowElementConfig.parallelOneTable;
	}

	$scope.showAsOneTable = function(flowTableElement, editorBpmnNr){
		var parentId = $scope.lastParentId(flowTableElement.parentIds);
		var bpmnInit = $scope.obj.data.init.camundaAppendix.bpmn[editorBpmnNr];
		if(!$scope.obj.data.config[bpmnInit.path]){
			$scope.obj.data.config[bpmnInit.path] = {};
		}
		if(!$scope.obj.data.config[bpmnInit.path][parentId]){
			$scope.obj.data.config[bpmnInit.path][parentId] = {showAs:''};
		}
		$scope.obj.data.config[bpmnInit.path][parentId].showAs 
			= $scope.obj.data.config[bpmnInit.path][parentId].showAs != 'oneTable'?'oneTable':'';
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
		$scope.protocolListMap = {};
		$scope.protocolList.forEach(function(protocolFileName){
			$http.get('/v/readProtocol/' + protocolFileName).success(function(protocol) {
				if(protocol.protocolName){
					$scope.protocolListMap[protocolFileName]={protocolName:protocol.protocolName};
				}
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
		caElement.prepend(angular.element('<b>Редактор: </b><a id="/'
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
		var bpmnContext = jsonPath(protocol, bpmnViewerInitData.path + '.bpmnContent');
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
	//console.log(dmnXmldoc.toString());
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

function walkIds($scope, bpmnInit, nodeTree, parentNodeTree, elementId, parentIds){
	if(!parentIds) parentIds = '';
	var walkElement = {node:bpmnInit.processElements[elementId].obj, parentIds:parentIds};
	if(elementId.indexOf('0r7dqpr')>0||elementId.indexOf('1mfpnxj')>0||elementId.indexOf('0m7k0au')>0){
	}
	if(walkElement.node.name == 'bpmn:exclusiveGateway'){
		var incomings = walkElement.node.childrenNamed('bpmn:incoming');
//		console.log("--------exclusiveGateway--------------------"+incomings.length);
//		console.log("--------exclusiveGateway--------------------"+walkElement.node.attr.id);
//		console.log("--------exclusiveGateway--------------------"+walkElement.parentIds);
		if(incomings.length > 1){
			if(bpmnInit.alreadyProcessed.indexOf(walkElement.node.attr.id)<0){
				bpmnInit.alreadyProcessed.push(walkElement.node.attr.id);
				console.log(parentNodeTree);
				parentNodeTree.push(walkElement);
				console.log('parentNodeTree');
				console.log(parentNodeTree);
				console.log($scope.isWalkElementSequenceFlow(walkElement));
				return;
			}
		}else{
			nodeTree.push(walkElement);
			console.log(nodeTree);
			
		}
	}else
	if($scope.isWalkElementSequenceFlow(walkElement)){
		//console.log("--------sequenceFlow--------------------"+walkElement.node.attr.id);
		var targetRef = walkElement.node.attr.targetRef;
//		if($scope.isUserToRuleSequenceFlow(walkElement)){
			//UserToRule walkElement
		if($scope.isToRuleSequenceFlow(walkElement)){
		//AllToRule walkElement
			nodeTree.push(walkElement);
		}else
		if($scope.isToEndEventSequenceFlow(walkElement)){
		//EndEvent walkElement
			//console.log("--------sequenceFlow---------to----EndEvent-------"+walkElement.node.attr.id);
			nodeTree.push(walkElement);
		}else
		if(targetRef.indexOf('ExclusiveGateway')==0){
			//console.log("--------sequenceFlow---------to----ExclusiveGateway-------"+walkElement.node.attr.id);
		}
		walkIds($scope, bpmnInit, nodeTree, parentNodeTree, targetRef, parentIds);
	}else
	if(walkElement.node.name == 'bpmn:parallelGateway'){
		//console.log(walkElement.node.toString());
		nodeTree.push(walkElement);
		console.log(nodeTree);
	}
	var outgoings = walkElement.node.childrenNamed('bpmn:outgoing');
	if(outgoings.length > 1){
		walkElement.children = [];
		parentIds += ' ';
		outgoings.forEach(function(outgoing, idx){
			var sequenceFlowId = outgoing.val;
			var childParentIds = parentIds + sequenceFlowId;
			var childElement = {parentIds:childParentIds,nodeTree:[]};
			walkElement.children.push(childElement);
			walkIds($scope, bpmnInit, childElement.nodeTree, nodeTree, sequenceFlowId, childParentIds);
		});
	}else
		if(outgoings.length == 1){
			outgoings.forEach(function(outgoing, idx){
				var sequenceFlowId = outgoing.val;
				walkIds($scope, bpmnInit, nodeTree, parentNodeTree, sequenceFlowId, parentIds);
		});
	}
}

function initBpmnTreeWalker(bpmnInit, $scope){
	bpmnInit.bpmnProcessElements = {};
	//key is elementFlow
	bpmnInit.processBranches = {};
	bpmnInit.mergerBranches = {};
	
	//key is sequenceFlow
	bpmnInit.processChains = {};
	bpmnInit.config = {startId:null};

	var bpmnProcess = bpmnInit.xmldoc.descendantWithPath('bpmn:process');
	bpmnProcess.children.forEach(function(processElement){
		var elementId = processElement.attr.id;
		bpmnInit.bpmnProcessElements[elementId] = processElement;
		var elementName = processElement.name;
		var incomings = processElement.childrenNamed('bpmn:incoming');
		if(incomings.length > 1){
			bpmnInit.mergerBranches[elementId] = [];
			bpmnInit.processChains[elementId] = [];
		}
		var outgoings = processElement.childrenNamed('bpmn:outgoing');
		if(outgoings.length > 1){
			var processBranches = [];
			outgoings.forEach(function(outgoing){
				processBranches.push(outgoing.val);
				bpmnInit.processChains[outgoing.val] = [];
			});
			bpmnInit.processBranches[elementId] = {branches:processBranches};
		}
		if(elementId.indexOf('StartEvent')==0){
			bpmnInit.config.startId = elementId;
			if(outgoings.length == 1){
				bpmnInit.processChains[outgoings[0].val] = [];
			}
		}
	});
	Object.keys(bpmnInit.processChains).forEach(function(sequenceFlowId){
		composeChain(bpmnInit, sequenceFlowId, bpmnInit.processChains[sequenceFlowId]);
	});
	console.log(bpmnInit.processBranches);
	Object.keys(bpmnInit.processBranches).forEach(function(brancheId){
		console.log(brancheId);
		bpmnInit.bpmnProcessElements[brancheId]
		.childrenNamed('bpmn:outgoing').forEach(function(outgoing){
			var chain = bpmnInit.processChains[outgoing.val];
			var lastChainElementId = chain[chain.length - 1];
			if(bpmnInit.mergerBranches[lastChainElementId]){
				bpmnInit.mergerBranches[lastChainElementId].push(outgoing.val);
				var processBranche = bpmnInit.processBranches[brancheId];
				if(!processBranche.merger){
					processBranche.merger = {};
				}
				if(!processBranche.merger[lastChainElementId]){
					processBranche.merger[lastChainElementId] = [];
				}
				processBranche.merger[lastChainElementId].push(outgoing.val);
				console.log(lastChainElementId);
			}
		});
		console.log(bpmnInit.processBranches[brancheId]);
	});
	
	function composeChain(bpmnInit, elementId, chain){
		var processElement = bpmnInit.bpmnProcessElements[elementId];
		chain.push(elementId);
		if(processElement.attr.targetRef){//bpmn:sequenceFlow
			composeChain(bpmnInit, processElement.attr.targetRef, chain);
		}
		var incomings = processElement.childrenNamed('bpmn:incoming');
		var outgoings = processElement.childrenNamed('bpmn:outgoing');
		if(incomings.length > 1){
			if(chain.length == 1 && outgoings.length == 1){
				composeChain(bpmnInit, outgoings[0].val, chain);
			}else{
			//end of chain and start to continue in other merged chain
			}
		}else{
			if(outgoings.length == 1){
				composeChain(bpmnInit, outgoings[0].val, chain);
			}
		}
	}

	$scope.getBpmnInit = function(nr){
		return $scope.obj.data.init.camundaAppendix.bpmn[nr];
	}

}

function initBpmnVerticalTable(bpmnInit, $scope){

$scope.isToEndEventSequenceFlow = function(walkElement){
	return walkElement.node.attr.targetRef.indexOf('EndEvent')==0;
}

$scope.isToRuleSequenceFlow = function(walkElement){
	return walkElement.node.attr.targetRef.indexOf('BusinessRuleTask')==0;
}

$scope.isUserToRuleSequenceFlow = function(walkElement){
	return walkElement.node.attr.sourceRef.indexOf('UserTask')==0 
	&& walkElement.node.attr.targetRef.indexOf('BusinessRuleTask')==0;
}

$scope.isWalkElementSequenceFlow = function(walkElement){
	return walkElement.node.name == 'bpmn:sequenceFlow';
}
	bpmnInit.nodeTree = [];
	bpmnInit.processElements = {};
	bpmnInit.alreadyProcessed = [];
	var bpmnProcess = bpmnInit.xmldoc.descendantWithPath('bpmn:process');
	bpmnInit.config = {startId:null};
	bpmnProcess.children.forEach(function(processElement){
		var elementId = processElement.attr.id;
		if(elementId.indexOf('StartEvent')==0){
			bpmnInit.config.startId = elementId;
		}
		if($scope.obj){
			if(!$scope.obj.data.config[bpmnInit.path]){
				$scope.obj.data.config[bpmnInit.path] = {};
			}
			var flowElementConfig = $scope.obj.data.config[bpmnInit.path][elementId];
			if(flowElementConfig){
				delete flowElementConfig['parallelOneTable']
			}
		}
		bpmnInit.processElements[elementId] = {obj:processElement,elementId:elementId};
	});
	walkIds($scope, bpmnInit, bpmnInit.nodeTree, null, bpmnInit.config.startId);
}

function initBpmnDmnToId(protocol, $scope){
console.log("-------initBpmnDmnToId---------------------");
	if(!protocol.config)
		protocol.config = {};
	var camundaAppendix = {bpmn:[],dmn:[]};
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
	var bpmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('bpmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('bpmnContent')>=0){
					var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
					bpmnXmldoc = initBpmnXml(protocol, key1, bpmnXmldoc);
					//var bpmnInit = {path: key1+'.bpmnContent'
					console.log(key1);
					var bpmnInit = {path: key1
							, xmldoc: bpmnXmldoc
							, container:
								{container:'#bpmn-canvas-' + bpmnNr
								, height: protocol[key1].height
								}
							};
					console.log(bpmnInit);
					initBpmnTreeWalker(bpmnInit, $scope);
					// to delete
					initBpmnVerticalTable(bpmnInit, $scope);
					camundaAppendix.bpmn.push(bpmnInit);
					bpmnNr++;
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
		$scope.dmnXmldoc = new xmldoc.XmlDocument(dmnContent);
		console.log($scope.dmnContent);
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

	$scope.addHitPolicySum = function(){
		var dmnInProtocol = $scope.obj.data[params.jsonpath];
//		var dmnXmldoc = new xmldoc.XmlDocument(dmnInProtocol.dmnContent);
//		var decisionTable = dmnXmldoc.descendantWithPath('decision.decisionTable');
		var decisionTable = $scope.dmnXmldoc.descendantWithPath('decision.decisionTable');
		decisionTable.attr['hitPolicy'] = 'COLLECT';
		decisionTable.attr['aggregation'] = 'SUM';
		dmnInProtocol.dmnContent = dmnXmldoc.toString();

	}

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
	$http.get("/v/read_user").success(function(response) {
		$scope.userPrincipal = response;
		//console.log($scope.userPrincipal);
	});
}

//console.log("params = " + location.search);
const params = require('query-string').parse(location.search);
//console.log(params);

var Regex = require("regex");
var regex = new Regex(/[(\d+)..(\d+)]/);
function initDmnRule($scope){
	console.log($scope.dictionary);

	$scope.evalLogicExp = function(input, inputEntry){
		var value = input.attr.value;
		var expr = inputEntry.firstChild.val;
//		console.log(input.firstChild.attr.typeRef+'/'+value+'/'+expr);
		var evalLogicExp = false;
		if(value){
			if(expr.indexOf('..') > 0){
				var endExpr = expr.replace('[',value + ' >= ').replace('..',' && ').replace(']',' >= ' + value);
				console.log(endExpr);
				evalLogicExp = eval(endExpr)
			}else if(input.firstChild.attr.typeRef == 'boolean'){
				evalLogicExp = eval(value+'=='+expr)
			}else{
				evalLogicExp = eval(value+expr)
			}
		}
		return evalLogicExp;
	}
}

function configTranslation($translateProvider){
	console.log("-------configTranslation-----------------------------------");
	$translateProvider.useStaticFilesLoader({ prefix: '/v/i18n/', suffix: '.json' });
	//$translateProvider.useLocalStorage();
	var myLocale = 'ua'
	var springCookieLocale = document.cookie.split('org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=')[1];
	console.log(springCookieLocale);
	if(springCookieLocale){
		if(springCookieLocale.indexOf(';') > 0){
			myLocale = springCookieLocale.split(';')[0];
		}else{
			myLocale = springCookieLocale;
		}
	}
	$translateProvider.preferredLanguage(myLocale);
//	$translateProvider.preferredLanguage('en');
}

function readCollectMedData($scope, $http, procInstId, taskId){
	//console.log(procInstId + '/' + taskId);
	if(procInstId.indexOf(':')>0){
		procInstId = procInstId.split(':')[2];
	}
	var url = '/v/collectData/'+procInstId+'-'+taskId;
	console.log(url);
	$http.get(url).success(function(response) {
		$scope.collectData = response;
		console.log($scope.collectData);
		$scope.openDmnVariable = taskId;
		initBpmnDmnToId($scope.collectData.protocol, $scope);
		seekNextTask($scope.collectData.taskInst.TASK_DEF_KEY_, $scope);
		setVariableValueToDmn(taskId, $scope);
	});
}

function setVarValue(varInst){
	var varVal = varInst.TEXT_;
	if(varInst.DOUBLE_){
		varVal = varInst.DOUBLE_;
	}else if(varInst.LONG_){
		varVal = varInst.LONG_;
	}
	return varVal;
}

function setVariableValueToDmn(taskId, $scope){
	var values = {};
	if($scope.processActiviti){
		$scope.processActiviti.varInstList.forEach(function(variable){
			if(variable.AITASKID == taskId){
				var varVal = setVarValue(variable);
				values[variable.NAME_] = varVal;
			}
		});
	}
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


function seekNextTask(taskDefKey, $scope){
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


var initUserState = function($scope, $http){
	$scope.$watch("userState.taskId", function handleChange( newValue, oldValue ) {
		saveUserState(oldValue);
	});
	$scope.$watch("userState.tabs1", function handleChange( newValue, oldValue ) {
		saveUserState(oldValue);
	});
	function saveUserState(oldValue){
		if($scope.userPrincipal && oldValue){
			$http.post('/saveProtocol', $scope.userState);
		}
	}
	$scope.userState = {tabs1:'home_writing_file',fileName:'userState'};
	//
	//read user state onload
	//
	$http.get('/v/readProtocol/userState').success(function(userState) {
		$scope.userState = userState;
		if($scope.userState.procDefId){
			$http.get("/v/showProcessActiviti/"+$scope.userState.procDefId).success(function(response) {
				$scope.processActiviti = response;
				console.log($scope.processActiviti);
				console.log($scope.processActiviti.varInstList);
			});
			if($scope.userState.taskId){
				readCollectMedData($scope, $http, $scope.userState.procDefId, $scope.userState.taskId);
			}
		}
	});

};
