'use strict';
var BpmnViewer = require('bpmn-js');
var DmnViewer = require('dmn-js/lib/Viewer');
var angular = require('angular');

angular.module('HomeApp', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('HomeCtrl', function($scope, $http, $filter, $translate) {
	console.log('HomeCtrl');
	initAngularCommon($scope, $http);
	initEditorBpmn($scope, $http);

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

var Regex = require("regex");
var regex = new Regex(/[(\d+)..(\d+)]/);
function initDmnRule($scope){

	$scope.getSelectedRuleDmnInputs = function(nextDmn){
		var ruleUserChooce = $scope.getRuleUserSelected(nextDmn);
		var dmnInputs = nextDmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
		var ruleInputIndexes = [];
		ruleUserChooce.childrenNamed('inputEntry').forEach(function(inputEntry, inputEntryIndex) {
			if(inputEntry.firstChild.val){
				var dmnInput = dmnInputs[inputEntryIndex];
				ruleInputIndexes.push(dmnInput);
			}
		});
		return ruleInputIndexes;
	}

	$scope.equalInputToSelectedResult = function(nextDmn){
		var equals = false;
		if($scope.hasInputForRule(nextDmn)){
			var ruleFromOwnDmnInputs = $scope.getRuleFromOwnDmnInputs(nextDmn);
			var ruleUserChooce = $scope.getRuleUserSelected(nextDmn);
			if(ruleUserChooce){
				if(ruleUserChooce.attr.id == ruleFromOwnDmnInputs.attr.id){
					equals = true;
				}
			}
		}
		return equals
	}
	$scope.hasInputForRule = function(nextDmn){
		var isInputForRule = true;
		var dmnInputs = nextDmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
		var ruleUserChooce = $scope.getRuleUserSelected(nextDmn);
//		console.log(ruleUserChooce.toString());
		ruleUserChooce.childrenNamed('inputEntry').forEach(function(inputEntry, inputEntryIndex) {
			if(inputEntry.firstChild.val){
				var dmnInput = dmnInputs[inputEntryIndex];
//				console.log(dmnInput.toString());
				if(!dmnInput.attr.value){
					isInputForRule = false;
				}
			}
		});
		return isInputForRule;
	}

	$scope.isRuleNrUserSelected = function(nextDmn, ruleNr){
		var isRuleNrUserSelected = false;
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		if(ruleNr == decisionTable.attr.ruleIndexUserChooce){
			isRuleNrUserSelected = true;
		}else if(decisionTable.attr.ruleIndexesUserChooce){
			isRuleNrUserSelected = decisionTable.attr.ruleIndexesUserChooce.indexOf(ruleNr) >= 0;
		}
		return isRuleNrUserSelected;
	}

	$scope.existRuleUserSelected = function(nextDmn){
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		if($scope.isDmnTypeAggregationSUM(nextDmn)
		&& decisionTable.attr.ruleIndexesUserChooce
		&& decisionTable.attr.ruleIndexesUserChooce.length > 0
		){
			return decisionTable.attr.ruleIndexesUserChooce;
		}else{
			return decisionTable.childrenNamed('rule')[decisionTable.attr.ruleIndexUserChooce];
		}
	}

	$scope.getRuleUserSelected = function(nextDmn){
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		return decisionTable.childrenNamed('rule')[decisionTable.attr.ruleIndexUserChooce];
	}

	$scope.sumDmn = function(nextDmn){
		var sum = null;
		if($scope.isDmnTypeAggregationSUM(nextDmn)){
			var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
			if(decisionTable.attr.ruleIndexesUserChooce){
				sum = 0;
				var rules = decisionTable.childrenNamed('rule');
				var ruleSelectedIndexes = decisionTable.attr.ruleIndexesUserChooce;
				ruleSelectedIndexes.forEach(function(ruleIndex){
					var rule = rules[ruleIndex];
					var valOutput = rule.descendantWithPath('outputEntry.text').val;
					sum += parseInt(valOutput);
				});
			}
		}
		return sum;
	}

	$scope.isDmnTypeAggregationSUM = function(nextDmn){
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		var isDmnTypeAggregationSUM =  decisionTable.attr.aggregation == 'SUM';
		return isDmnTypeAggregationSUM;
	}

	$scope.getRuleInputsVariablen = function(rule, nextDmn){
		var ruleInputsVariablen = [];
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		var dmnInputs = decisionTable.childrenNamed('input');
		var inputEntrys = rule.childrenNamed('inputEntry');
		inputEntrys.forEach(function(inputEntry, inputEntryIndex){
			var expr = inputEntry.firstChild.val;
			if(expr){//the rule used this input
				var inputExpression = dmnInputs[inputEntryIndex].firstChild;
				console.log(inputExpression);
				ruleInputsVariablen.push({
					variableName:inputExpression.firstChild.val
					, 
					decisionTableInputIndex:inputEntryIndex
					});
			}
		});
		return ruleInputsVariablen;
	}

	$scope.setRuleIndexUserSelected = function(nextDmn, ruleIndexUserChooce){
		var decisionTable = nextDmn.xmldoc.descendantWithPath('decision.decisionTable');
		if($scope.isDmnTypeAggregationSUM(nextDmn)){
			if(!decisionTable.attr.ruleIndexesUserChooce){
				decisionTable.attr.ruleIndexesUserChooce = [];
			}
			var isLast = 
				ruleIndexUserChooce ==
				decisionTable.attr.ruleIndexesUserChooce[decisionTable.attr.ruleIndexesUserChooce.length - 1];
			var index = decisionTable.attr.ruleIndexesUserChooce.indexOf(ruleIndexUserChooce)
			if(index >= 0){
				decisionTable.attr.ruleIndexesUserChooce.splice(index,1);
			}
			if(!isLast){
				decisionTable.attr.ruleIndexesUserChooce.push(ruleIndexUserChooce);
			}
			var sumDmn = $scope.sumDmn(nextDmn);
			var output = decisionTable.descendantWithPath('output');
			output.attr.value = sumDmn;
		}else{
			if(decisionTable.attr.ruleIndexUserChooce == ruleIndexUserChooce){
				delete decisionTable.attr['ruleIndexUserChooce'];
			}else{
				decisionTable.attr.ruleIndexUserChooce = ruleIndexUserChooce;
			}
		}
	}

/*
 * Unique rules type in DMN
 * get first true rule.
 * */
	$scope.getRuleFromOwnDmnInputs = function(nextDmn){
		var dmnInputs = nextDmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
		var rule = null;
		var dmnRules = nextDmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('rule');
		dmnRules.forEach(function(dmnRule, dmnRuleIndex){
			if(!rule){
				if(evalRuleFromDmnInputs(dmnRule, dmnInputs)){
					rule = dmnRule;
				}
			}
		})
		return rule;
	}

/*
 * Check it's rule true or not.
 * */
	$scope.evalRuleFromOwnDmnInputs = function(nextDmn, rule){
		var dmnInputs = nextDmn.xmldoc.descendantWithPath('decision.decisionTable').childrenNamed('input');
		return evalRuleFromDmnInputs(rule, dmnInputs);
	}

	/*
	 * Check rule to own DMN inputs.
	 * */
	function evalRuleFromDmnInputs(rule, dmnInputs){
		var evalRuleLogicValue = true;
		var inputEntrys = rule.childrenNamed('inputEntry');
		inputEntrys.forEach(function(inputEntry, inputEntryIndex){
			var expr = inputEntry.firstChild.val;
			if(expr){//the rule used this input
				var evalLogicExp = $scope.evalLogicExp(dmnInputs[inputEntryIndex], inputEntry);
				evalRuleLogicValue = evalRuleLogicValue && evalLogicExp;
			}
		});
		return evalRuleLogicValue;
	}

	function evalRuleFromDmnInputs2(rule, dmnInputs){
		var evalRuleLogicValue = true;
		var inputEntrys = rule.childrenNamed('inputEntry');
		dmnInputs.forEach(function(dmnInput, dmnInputIndex){
			var evalInputLogicValue = false;
			if(dmnInput.attr.value){
				var evalLogicExp = $scope.evalLogicExp(dmnInput, inputEntrys[dmnInputIndex]);
				evalRuleLogicValue = evalRuleLogicValue && evalLogicExp;
				console.log(evalLogicExp +'/'+ evalRuleLogicValue+'/'+dmnInput.attr.value+'/'+dmnInputIndex+'/'+inputEntrys[dmnInputIndex].firstChild.val);
			}else{
				evalRuleLogicValue = false;
			}
		});
		return evalRuleLogicValue;
	}

	$scope.evalLogicExpForOutputVariable = function(expr, dmnOutput){
		var evalLogicExpForVariable = false;
		if(expr){
			var value = dmnOutput.attr.value
			if(value){
				var variable = dmnOutput.attr.name
				if(expr.indexOf(variable) >= 0){
					var expr2 = expr.replace(variable, value);
					evalLogicExpForVariable = eval(expr2);
				}
			}
		}
		return evalLogicExpForVariable;
	}

	$scope.evalLogicExp = function(input, inputEntry){
		var value = input.attr.value;
		var expr = inputEntry.firstChild.val;
//		console.log(input.firstChild.attr.typeRef+'/'+value+'/'+expr);
		var evalLogicExp = false;
		if(value){
			if(expr.indexOf('..') > 0){
				var endExpr = expr.replace('[',value + ' >= ').replace('..',' && ').replace(']',' >= ' + value);
				//console.log(endExpr);
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


function initEditorBpmn($scope, $http){
	initDmnRule($scope);

	$scope.getObjectKeys = function(parallelOneTable){
		return Object.keys(parallelOneTable);
	}

	//$scope.getParallelGatewayOneTable = function(flowTableElement, bpmnInit)
	$scope.getParallelGatewayOneTable =  function(bpmnNr, parallelGatewayElement){
		var bpmnInit = $scope.getBpmnInit(bpmnNr);
		var flowElementConfig = $scope.obj.data.config[bpmnInit.path][parallelGatewayElement.attr.id];
		console.log('---------------------------flowElementConfig--------------------------');
		console.log(flowElementConfig);
		console.log('---------------------------flowElementConfig--------------------------');
		if(!flowElementConfig.parallelOneTable){
			flowElementConfig.parallelOneTable = [];
			var outgoings = parallelGatewayElement.childrenNamed('bpmn:outgoing');
			outgoings.forEach(function(outgoing){
				var sequenceFlowElement = bpmnInit.bpmnProcessElements[outgoing.val];
				var userTaskElement = bpmnInit.bpmnProcessElements[sequenceFlowElement.attr.targetRef];
				userTaskElement.childrenNamed('bpmn:outgoing').forEach(function(outgoing2){
					var sequenceFlow2Element = bpmnInit.bpmnProcessElements[outgoing2.val];
					var businessRuleTaskElement = bpmnInit.bpmnProcessElements[sequenceFlow2Element.attr.targetRef];
					if(businessRuleTaskElement.attr['camunda:decisionRef']){
						var parallelOneTableElement = {businessRuleTaskId:businessRuleTaskElement.attr.id,userTaskId:userTaskElement.attr.id};
						var parallelOneTableElement2 = {businessRuleTaskId:businessRuleTaskElement.attr.id,userTaskId:userTaskElement.attr.id};
						$scope.obj.data.init.camundaAppendix.dmn.forEach(function(nextDmn){
							if(businessRuleTaskElement.attr['camunda:decisionRef'] == nextDmn.xmldoc.firstChild.attr.id){
								parallelOneTableElement.dmn = nextDmn;
								parallelOneTableElement2.dmn = nextDmn;
							}
						});
						flowElementConfig.parallelOneTable.push(parallelOneTableElement);
						flowElementConfig.parallelOneTable.push(parallelOneTableElement2);
					}
				});
			});
			if(false)
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

	$scope.isViewBasic = function(bpmnNr, chainElement){
		if($scope.isViewParallelGatewaOneTable(bpmnNr, chainElement)){
			return false;
		}
		return true;
	}
	$scope.getConfigParameter = function(bpmnNr, chainElement, key){
		if(!chainElement)
			return false;
		if(!$scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id])
			return false;
		return $scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id][key]
	}
	$scope.isClosedParallelGatewaOneTable = function(bpmnNr, chainElement){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id]){
			return $scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id].openParallelGateway == 'no';
		}
		return false;
	}
	$scope.isViewParallelGatewaOneTable = function(bpmnNr, chainElement){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path]){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id]){
			return $scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id].showAs == 'oneTable';
		}
		}
		return false;
	}
	$scope.isViewBusinesRule = function(bpmnNr, chainElement){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path]){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id]){
			return $scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id].showBusinessRule == 'yes';
		}
		}
		return false;
	}
	$scope.isViewChoiceDmn = function(bpmnNr, chainElement){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path]){
		if($scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id]){
			return $scope.obj.data.config[$scope.getBpmnInit(bpmnNr).path][chainElement.attr.id].showChoiceDmn == 'yes';
		}
		}
		return false;
	}

	var getConfigChainElement = function(bpmnNr, chainElement, key){
		var bpmnInit = $scope.getBpmnInit(bpmnNr);
		if(!$scope.obj.data.config[bpmnInit.path]){
			$scope.obj.data.config[bpmnInit.path] = {};
		}
		if(!$scope.obj.data.config[bpmnInit.path][chainElement.attr.id]){
			$scope.obj.data.config[bpmnInit.path][chainElement.attr.id] = {};
			//$scope.obj.data.config[bpmnInit.path][chainElement.attr.id] = {showAs:''};
		}
		if(!$scope.obj.data.config[bpmnInit.path][chainElement.attr.id][key]){
			$scope.obj.data.config[bpmnInit.path][chainElement.attr.id][key] = '';
		}
		return $scope.obj.data.config[bpmnInit.path][chainElement.attr.id];
	}

	$scope.showChoiceDmn = function(bpmnNr, chainElement){
		var configChainElement = getConfigChainElement(bpmnNr, chainElement, 'showChoiceDmn');
		console.log(configChainElement);
		configChainElement.showChoiceDmn = configChainElement.showChoiceDmn != 'yes'?'yes':'no';
		console.log(configChainElement);
	}

	$scope.showBusinessRule = function(bpmnNr, chainElement){
		var configChainElement = getConfigChainElement(bpmnNr, chainElement, 'showBusinessRule');
		configChainElement.showBusinessRule = configChainElement.showBusinessRule != 'yes'?'yes':'no';
	}

	$scope.openParallelGatewayAsOneTable = function(bpmnNr, chainElement){
		var configChainElement = getConfigChainElement(bpmnNr, chainElement, 'openParallelGateway');
		configChainElement.openParallelGateway = configChainElement.openParallelGateway != 'no'?'no':'yes';
	}

	$scope.showParallelGatewayAsOneTable = function(bpmnNr, chainElement){
		var configChainElement = getConfigChainElement(bpmnNr, chainElement, 'showAs');
		configChainElement.showAs = configChainElement.showAs != 'oneTable'?'oneTable':'';
	}

	$scope.isChainPEToViewForVariableClick = function(processElement){
		return $scope.isPEToRuleSequenceFlow(processElement)
		|| $scope.isBranchePE(processElement)
		|| $scope.isScriptTaskPE(processElement)
//		|| $scope.isExclusiveGatewayPE(processElement)
		;
	}

	$scope.isChainPEToView = function(processElement){
		return $scope.isPEToRuleSequenceFlow(processElement) 
		|| $scope.isUserTaskPE(processElement)
		|| $scope.isSubProcessPE(processElement)
		|| $scope.isBusinessRuleTaskPE(processElement)
		|| $scope.isPEEndEvent(processElement)
		|| $scope.isBranchePE(processElement)
		|| $scope.isScriptTaskPE(processElement)
		|| $scope.isMergerPE(processElement)
		;
	}

	$scope.isMergerPE = function(processElement){
		var incomings = processElement.childrenNamed('bpmn:incoming');
		return incomings.length > 1;
	}

	$scope.isExclusiveGatewayPE = function(processElement){
		return processElement.name == 'bpmn:exclusiveGateway';
	}

	$scope.isBusinessRuleTaskPE = function(processElement){
		return processElement.name == 'bpmn:businessRuleTask';
	}

	$scope.isUserTaskPE = function(processElement){
		return processElement.name == 'bpmn:userTask';
	}

	$scope.isSubProcessPE = function(processElement){
		return processElement.name == 'bpmn:subProcess';
	}


	$scope.isBranchePE = function(processElement){
		var outgoings = processElement.childrenNamed('bpmn:outgoing');
		return outgoings.length > 1;
	}

	$scope.isPEToRuleSequenceFlow = function(processElement){
		if(!processElement.attr.sourceRef)
			return false;
		return  processElement.attr.targetRef.indexOf('BusinessRuleTask')==0;
	}

	$scope.isPEUserToRuleSequenceFlow = function(processElement){
		if(!processElement.attr.sourceRef)
			return false;
		return processElement.attr.sourceRef.indexOf('UserTask')==0 
		&& processElement.attr.targetRef.indexOf('BusinessRuleTask')==0;
	}

	$scope.isScriptTaskPE = function(processElement){
		return processElement.name == 'bpmn:scriptTask';
	}
	$scope.executeScriptTask = function(scriptTask, bpmnNr){
		var camundaResultVariable = scriptTask.attr['camunda:resultVariable'];
		var camundaResource = scriptTask.attr['camunda:resource'];
		var functionName = camundaResource.split('(')[0];
		var parameter = camundaResource.split('(')[1].split(')')[0].replace(/'/g,'');
		switch (functionName) {
			case 'sumOutput': sumOutput(scriptTask, $scope, bpmnNr, parameter); break;
		}
	}

	//function to call from bpmn:scriptTask -- BEGIN

	//sumOutputsInAllFirstBusinessRules
	function sumOutput(scriptTask, $scope, bpmnNr, processElementId){
		delete scriptTask.attr.value;
		var processElement = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[processElementId];
		processElement.childrenNamed('bpmn:outgoing').forEach(function(s1) {
			var tr1 = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[s1.val].attr.targetRef;
			var e1 = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[tr1];
			if(!calcBusinessRuleTask(scriptTask, e1, $scope)){
				e1.childrenNamed('bpmn:outgoing').forEach(function(s2) {
					var tr2 = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[s2.val].attr.targetRef;
					var e2 = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[tr2];
					if(!calcBusinessRuleTask(scriptTask, e2, $scope)){
					}
				});
			}
		});
	}

	function calcBusinessRuleTask(scriptTask, businessRuleTask, $scope){
		if(businessRuleTask.name != 'bpmn:businessRuleTask')
			return false;
		var dmnId = businessRuleTask.attr['camunda:decisionRef'];
		var dmnIndex = $scope.dmnIndexMap[dmnId];
		var nextDmn = $scope.obj.data.init.camundaAppendix.dmn[dmnIndex];
		var ruleUserChooce = $scope.getRuleUserSelected(nextDmn);
		if(ruleUserChooce){
			if(!scriptTask.attr.value){
				scriptTask.attr.value = 0;
			}
			//SUM
			scriptTask.attr.value += Number(ruleUserChooce.descendantWithPath('outputEntry.text').val);
		}
		return true;
	}

	//function to call from bpmn:scriptTask -- END
	
	$scope.isPEEndEvent = function(processElement){
		return processElement.name == 'bpmn:endEvent';
	}

	$scope.isPESequenceFlow = function(processElement){
		return processElement.name == 'bpmn:sequenceFlow';
	}

	$scope.getSomeRuleElementName = function(bpmnNr, processElementId){
		var processElement = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[processElementId];
		if(processElement.attr.sourceRef){
			if(processElement.attr.sourceRef.indexOf('UserTask') < 0 
					&& processElement.attr.targetRef.indexOf('BusinessRuleTask') == 0){
				var targetElement = $scope.getBpmnInit(bpmnNr)
				.bpmnProcessElements[processElement.attr.targetRef];
				return targetElement.attr.name;
			}
		}
	}

	$scope.getProcessElementName = function(bpmnNr, processElementId){
		var processElement = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[processElementId];
		if(processElement)
			return processElement.attr.name;
//		return processElement.attr.name?processElement.attr.name:'_';
	}

	$scope.getUserElementName = function(bpmnNr, chainElementId){
//	console.log(chainElementId);
		var userTaskId = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[chainElementId].attr.sourceRef;
		var userTaskElement = $scope.getBpmnInit(bpmnNr).bpmnProcessElements[userTaskId];
		if(userTaskElement)
			return userTaskElement.attr.name;
	}

	$scope.setTabView = function(tabView){
		$scope.view = tabView;
	}

	$scope.getRuleInputIndexes = function(rule){
		var ruleInputIndexes = [];
		rule.childrenNamed('inputEntry').forEach(function(inputEntry, inputEntryIndex) {
			if(inputEntry.firstChild.val){
				ruleInputIndexes.push(inputEntryIndex);
			}
		});
		return ruleInputIndexes;
	}


	$scope.setRuleState2 = function(nextDmn, rule, ruleHead){
		console.log("----------------");
		console.log(nextDmn);
//		var ruleOutput = nextDmn.dmn.xmldoc.descendantWithPath('decision.decisionTable.output');
		var ruleOutput = nextDmn.xmldoc.descendantWithPath('decision.decisionTable.output');
		var valOutput = rule.descendantWithPath('outputEntry.text').val;
		var valInput = rule.descendantWithPath('inputEntry.text').val;
		var description = rule.descendantWithPath('description').val;
		console.log(description);
		ruleOutput.attr.value = valOutput;
		ruleOutput.attr.description = description;
		ruleOutput.attr.expInput = valInput;
		//nextDmn.flowTableElement.valueRule = rule.descendantWithPath('description').val;
		//nextDmn.valueRule = rule.descendantWithPath('description').val;
//		console.log($scope.getObjectKeys(nextDmn));
//		console.log(nextDmn.valueRule);
		console.log(ruleOutput);
		console.log(ruleOutput.toString());
	}
	
	$scope.clickRuleChoice = function(rule, nextDmn){
		console.log("-------clickRuleChoice()-----------");
		console.log(rule.attr.id);
		nextDmn.xmldoc.descendantWithPath('decision.decisionTable').attr.clickRuleChoice = rule.attr.id;
//		nextDmn.xmldoc.descendantWithPath('decision.decisionTable')['clickRuleChoice'] = rule.attr.id;
		console.log(nextDmn.xmldoc.descendantWithPath('decision.decisionTable'));
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
		//console.log(urlToSave+'/{' +editor.get().fileName+'}?' + $scope.obj.data.fileName);
		console.log(urlToSave+'/?' + $scope.obj.data.fileName);
 		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
			location.reload();
		});
	}

/*
	$scope.getFlowVerticalTable = function(editorBpmnNr){
		var bpmnInit = $scope.obj.data.init.camundaAppendix.bpmn[editorBpmnNr];
	}
 * */
}


angular.module('DevFlowAsTreeApp', ['pascalprecht.translate'])
.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
.controller('DevFlowAsTreeCtrl', function($scope, $http, $translate) {
	console.log('DevFlowAsTreeCtrl');
	initAngularCommon($scope, $http);
	initEditorBpmn($scope, $http);

	var urlForContent = '/v/readContent';
	if($scope.params.p){
		urlForContent = '/v/readProtocol/' + $scope.params.p;
	}
	console.log('------read from--------' + urlForContent);
	
	$http.get(urlForContent).success(function(protocol) {
		$scope.obj = {
			data : protocol,
			options : { mode : 'tree' }
		};
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
	initAngularCommon($scope, $http);
	initEditorBpmn($scope, $http);

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
		parallelOneTable.valueRule = rule.descendantWithPath('description').val;
	}

	$scope.getParallelOneTable = function(flowTableElement, bpmnInit){
		var parentId = $scope.lastParentId(flowTableElement.parentIds);
		var flowElementConfig = $scope.obj.data.config[bpmnInit.path][parentId];
		console.log('---------------------------flowElementConfig--------------------------');
		console.log(flowElementConfig);
		console.log('---------------------------flowElementConfig--------------------------');
		console.log('---------------------------flowElementConfig--------------------------');
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

	$scope.createNewDMN = function(){
		console.log("-------createNewDMN--------");
		var maxN = getMaxNr('dmn');
		var keyDmn = 'dmn'+maxN;
		$http.get('/v/newDMN.json').success(function(response) {
			$scope.obj.data[keyDmn] = {dmnContent:response.dmn.dmnContent};
			$scope.saveFile();
		});
	}
	
	$scope.createNewBpmn = function(){
		console.log("-------createNewBpmn--------");
		var maxN = getMaxNr('bpmn');
		console.log(maxN);
		$http.get("/v/newBPMN.json").success(function(response) {
			console.log(response);
			$scope.obj.data['bpmn'+maxN] = {height:200, bpmnContent:response.bpmn.bpmnContent};
			console.log($scope.obj.data);
			if($scope.useJsonEditor){
				editor.set($scope.obj.data);
			}
			$scope.saveFile();
		});
	}

	$scope.createNewBpmn0 = function(){
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
								if(dmnInProtocol.dmnContent.length > 1){
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
				+dmnViewerInitData.path+addProtocol()+'">' 
				+ dmnViewerInitData.xmldoc.firstChild.attr.name 
				+ ' ('+ dmnViewerInitData.path + ')'
				+ '</a>'));
		var viewerDmn = new DmnViewer(dmnViewerInitData.container);
		var dmnContext = jsonPath(protocol, dmnViewerInitData.path+'.dmnContent');
		if(dmnContext == '-') 
			continue;
		viewerDmn.importXML(dmnContext, function(err) {
			if (err) {
				console.log('error rendering', err);
			} else {
			//	console.log('rendered: '+dmnViewerInitData.path);
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
		//console.log(bpmnViewerInitData.path + '--------------------' + bpmnContext.length);
		if(bpmnContext == '-')
			return;
		viewerBpm.importXML(bpmnContext, function(err) {
			if (err) {
				console.error(err);
			} else {
			//	console.log('rendered: ' + bpmnViewerInitData.path);
			}
		});
	}
	//console.log("------------viewerBpmnDmn-----------END--------");

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

function addLastDmnVariables(camundaAppendix){
	var dmnNr = camundaAppendix.dmn.length - 1;
	var xmldoc = camundaAppendix.dmn[dmnNr].xmldoc;
	var decisionTable = xmldoc.descendantWithPath('decision.decisionTable');
	var dmnInputs = decisionTable.childrenNamed('input');
	var dmnOutputs = decisionTable.childrenNamed('output');
	dmnInputs.forEach(function(dmnInput){
		var varName = dmnInput.valueWithPath("inputExpression.text");
		if(!camundaAppendix.variables[varName]){
			camundaAppendix.variables[varName] = {};
		}
		if(!camundaAppendix.variables[varName].inputDmnsNr){
			camundaAppendix.variables[varName].inputDmnsNr = [];
		}
		camundaAppendix.variables[varName].inputDmnsNr.push(dmnNr);
	});
	dmnOutputs.forEach(function(dmnOutput){
		var varName = dmnOutput.attr.name;
		if(!camundaAppendix.variables[varName]){
			camundaAppendix.variables[varName] = {};
		}
		if(!camundaAppendix.variables[varName].outputDmnsNr){
			camundaAppendix.variables[varName].outputDmnsNr = [];
		}
		camundaAppendix.variables[varName].outputDmnsNr.push(dmnNr);
	});
}

function addAppendixDmn(protocol, keyDmn, dmnNr, camundaAppendix, $scope){
	var dmnInProtocol = protocol[keyDmn];
	if(dmnInProtocol.dmnContent == '-')
		return;
	var dmnXmldoc = new xmldoc.XmlDocument(dmnInProtocol.dmnContent);
	var decisionId = dmnXmldoc.descendantWithPath('decision').attr.id;
	$scope.dmnIndexMap[decisionId] = dmnNr;
	//console.log(dmnXmldoc.toString());
	dmnInProtocol.dmnName = dmnXmldoc.firstChild.attr.id;
	camundaAppendix.dmn.push({path: keyDmn
		, xmldoc: dmnXmldoc
		, container:{container:'#dmn-canvas-' + dmnNr}
	});
	addLastDmnVariables(camundaAppendix);
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
				parentNodeTree.push(walkElement);
				return;
			}
		}else{
			nodeTree.push(walkElement);
			
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

// START of BpmnTreeWalker INITs
//	$scope.view = 'useFlowAsTable';
	//$scope.view = 'devFlowAsTree';
//	$scope.view = 'useFlowAsTree2';
//	$scope.view = 'useFlowAsTree';
	$scope.view = 'timeControl';
	bpmnInit.bpmnProcessElements = {};
	//key is elementFlow
	bpmnInit.processBranches = {};
	bpmnInit.mergerBranches = {};
	bpmnInit.mergerBranchesNumer = [];
	bpmnInit.timesDefinition = [];
	bpmnInit.timeChain = [];
	
	//key is sequenceFlow
	//ProcessChains is a map where IDs of Elements is a key and value is chains(list of IDs) in this BPMN.
	//First element in list is == key
	bpmnInit.processChains = {};
	//bpmnInit.config.startId is ID of bpmn:startEvent
	//sequencesGoRepeat is ; separated sequences that go to repeat.
	bpmnInit.config = {startId:null,sequencesGoRepeat:';'};

	var bpmnProcess = bpmnInit.xmldoc.descendantWithPath('bpmn:process');
	bpmnProcess.children.forEach(function(processElement){
		var elementId = processElement.attr.id;
		bpmnInit.bpmnProcessElements[elementId] = processElement;
		initTimeDefinition(processElement);
		var elementName = processElement.name;
		var incomings = processElement.childrenNamed('bpmn:incoming');
		if(incomings.length > 1){
			bpmnInit.mergerBranches[elementId] = [];
			bpmnInit.mergerBranchesNumer.push(elementId);
			bpmnInit.processChains[elementId] = [];
		}
		var outgoings = processElement.childrenNamed('bpmn:outgoing');
//		console.log(elementId + '/' + outgoings.length);
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
	console.log(bpmnInit.timesDefinition);
	//calc time timechain
	bpmnInit.timesDefinition.forEach(function(timeDefinition){
		console.log(timeDefinition);
		if(timeDefinition.value.indexOf('R') >= 0){
			timeDefinition.value.split(',').forEach(function(t,i){
				if(t.indexOf('R') >= 0){
					var period = t.split('/')[1];
					var periodUnit = period.substring(period.length-1);
					var cycleInterval = $scope.periodCipher(period) * 1;
					var cycle;
					if(t.split('/')[0].length > 1){// with cycle numer
						cycle = parseInt(t.split('/')[0].replace('R',''));
					}else{//without cycle numer
						var interval = $scope.periodCipher(timeDefinition.value.split(',')[i - 1]);
						console.log(interval);
						cycle = interval/cycleInterval;
					}
					//console.log(cycle + '::' + cycleInterval + '::' + t + '::' + timeDefinition.value);
					for(i = 0; i < cycle; i++){
						var point = cycleInterval * (i + 1); 
						var pointPeriod = 'PT'+point+periodUnit;
						addTimeChain(pointPeriod, timeDefinition, i);
						if(interval){
							console.log(interval+'::'+t+'::'+i+'::'+cycleInterval+'::'+period+'::'+periodUnit+'::'+pointPeriod);
						}else{
							console.log('::'+t+'::'+i+'::'+cycleInterval+'::'+period+'::'+periodUnit+'::'+pointPeriod);
						}
					}
				}
			});
		}else{
			console.log('------------' + timeDefinition.value);
			timeDefinition.value.split(',').forEach(function(t,i){
				addTimeChain(t, timeDefinition, i);
			});
		}
	});
	console.log(bpmnInit.timeChain);
	//calc time END
	function addTimeChain(t, timeDefinition, item){
		console.log(t);
		var calc = t;
		if(t.indexOf('PT') >= 0){
			calc = calc.replace('PT','P1DT');
		}
		bpmnInit.timeChain.push({def:t,calc:calc, item:item, timeDefinition:timeDefinition});
	}
	function initTimeDefinition(processElement){
		var timeProperty = processElement.descendantWithPath('bpmn:extensionElements.camunda:properties.camunda:property');
		if(timeProperty){
			var timeDefinition = {name:timeProperty.attr.name,value:timeProperty.attr.value,elementId:processElement.attr.id};
			bpmnInit.timesDefinition.push(timeDefinition);
		}
	}
	//Build, compose a chains.
	Object.keys(bpmnInit.processChains).forEach(function(sequenceFlowId){
		composeChain(bpmnInit, sequenceFlowId, bpmnInit.processChains[sequenceFlowId]);
	});
	//Build, compose a one chain.
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

	//Build a merge of branches.
	Object.keys(bpmnInit.processBranches).forEach(function(brancheId){
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
			}
		});
	});

	//register sequences that go to repeate
	//sequencesGoRepeat is ; separated sequences that go to repeat.
	bpmnInit.mergerBranchesNumer.forEach(function(mergePointId){
		var mergePointChain = bpmnInit.processChains[mergePointId];
		bpmnInit.mergerBranches[mergePointId].forEach(function(sequenceRepeateCandidateId){
			checkForRepeate(sequenceRepeateCandidateId, mergePointChain);
		});
	});

	function checkForRepeate(sequenceRepeateCandidateId, chain){
		var chainEndElementId = chain[chain.length - 1];
		if(chainEndElementId.indexOf('EndEvent')==0)
			return;
		if(bpmnInit.processBranches[chainEndElementId].branches.indexOf(sequenceRepeateCandidateId)>=0){
			bpmnInit.config.sequencesGoRepeat = bpmnInit.config.sequencesGoRepeat + sequenceRepeateCandidateId + ';';
			return;
		}
		bpmnInit.processBranches[chainEndElementId].branches.forEach(function(processBrancheId){
			checkForRepeate(sequenceRepeateCandidateId, bpmnInit.processChains[processBrancheId]);
		});
	};
	console.log(bpmnInit.config.sequencesGoRepeat);

// END of INITs
	
	$scope.hasIncominFromRepeat = function(bpmnNr, elementId){
		var hasIncominFromRepeat = false;
		var bpmnInit = $scope.getBpmnInit(bpmnNr);
		var element = bpmnInit.bpmnProcessElements[elementId];
		element.childrenNamed('bpmn:incoming').forEach(function(incomingElement){
			if(!hasIncominFromRepeat){
				hasIncominFromRepeat = $scope.isRepeatSequence(incomingElement.val, bpmnInit);
			}
			
		})
		return hasIncominFromRepeat;
	}

	//branche that contain repeate sequence
	$scope.isContainRepeatSequence = function(bpmnInit, mergerBranche){
		var isContainRepeatSequence = false;
		mergerBranche.forEach(function(brancheId){
			if(!isContainRepeatSequence){
				isContainRepeatSequence = $scope.isRepeatSequence(brancheId, bpmnInit);
			}
		});
		return isContainRepeatSequence;
	}

	$scope.isRepeatSequence = function(sequenceId, bpmnInit){
		if(bpmnInit.config.sequencesGoRepeat)
			return bpmnInit.config.sequencesGoRepeat.indexOf(sequenceId) >= 0;
	}

	$scope.mergesNumer = function(bpmnNr, elementId){
		return $scope.getBpmnInit(bpmnNr).mergerBranchesNumer.indexOf(elementId) + 1;
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
			// see initBpmnTreeWalker
			//bpmnInit.config.startId = elementId;
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
	//TODO! recursion problem
	//walkIds($scope, bpmnInit, bpmnInit.nodeTree, null, bpmnInit.config.startId);
}

function initBpmnDmnToId(protocol, $scope){
console.log("-------initBpmnDmnToId---------------------");
	if(!protocol.config)
		protocol.config = {};
	var camundaAppendix = {bpmn:[],dmn:[],variables:{},dmnIdPosition:{}};
	$scope.dmnIndexMap = {};
	var dmnNr = 0;
	for (var key1 in protocol) {
		if(key1.indexOf('dmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('dmnContent')>=0){
					addAppendixDmn(protocol, key1, dmnNr, camundaAppendix, $scope);
					dmnNr++;
				}
			}
		}
	}
	var bpmnNr = 0;
	console.log('----------------------------' + bpmnNr);
	for (var key1 in protocol) {
		if(key1.indexOf('bpmn')>=0){
			for (var key2 in protocol[key1]) {
				if(key2.indexOf('bpmnContent')>=0){
					var bpmnXmldoc = new xmldoc.XmlDocument(protocol[key1].bpmnContent);
					bpmnXmldoc = initBpmnXml(protocol, key1, bpmnXmldoc);
					//var bpmnInit = {path: key1+'.bpmnContent'
					var bpmnInit = {path: key1
						, xmldoc: bpmnXmldoc
						, container:
							{container:'#bpmn-canvas-' + bpmnNr
							, height: protocol[key1].height
							}
						};
					initBpmnTreeWalker(bpmnInit, $scope);
					// to delete
					//initBpmnVerticalTable(bpmnInit, $scope);
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
		console.log(dmnContent);
		if(dmnContent.length == 1){
			$http.get("/h/dev/sah/p4/resources/newDMN.dmn").success(function(response) {
				console.log(response);
				/*
				$scope.obj.data[keyDmn] = {dmnContent:response};
				initNewDmn(keyDmn, $scope);
				console.log($scope.obj.data);
				if($scope.useJsonEditor){
					editor.set($scope.obj.data);
				}
				$scope.saveFile();
				 * */
			});
		}
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
	});
	$scope.s24 = '0123456789abcdefghiklmno';

	$scope.chainItemSignalColor = function(timeItem){
		console.log(timeItem);
		return $scope.urgencySignalColor(timeItem.def);
	}

	$scope.urgencySignalColor = function(period){
		if(period.indexOf('R')>=0)
			return;
		var cipher = $scope.periodCipher(period);
		var periodUnit = period.substring(period.length - 1);
		var urgencySignalColor = 'W';
		if(periodUnit == 'M' && cipher < 30)
			urgencySignalColor = 'O';
		else
			if(periodUnit == 'H' && cipher < 3)
				urgencySignalColor = 'Y';
		else
			if(periodUnit == 'H' && cipher <= 8)
				urgencySignalColor = 'G';
		return urgencySignalColor;
	}

	$scope.periodCipher = function(period){
		return period.replace(/(PT|P)/,'').split('').reverse().join('').substring(1).split('').reverse().join('')
	}
}

//console.log("params = " + location.search);
const params = require('query-string').parse(location.search);
//console.log(params);

function configTranslation($translateProvider){
	$translateProvider.useStaticFilesLoader({ prefix: '/v/i18n/', suffix: '.json' });
	//$translateProvider.useLocalStorage();
	var myLocale = 'ua'
	var springCookieLocale = document.cookie.split('org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=')[1];
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

