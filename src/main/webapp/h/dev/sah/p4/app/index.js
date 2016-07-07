'use strict';
var fs = require('fs');
var $ = require('jquery'),
	BpmnModeler = require('bpmn-js/lib/Modeler');

var container = $('#js-drop-zone');
var canvas = $('#js-canvas');

var modeler = new BpmnModeler({ container: canvas });

function createNewDiagram() {
	openDiagram(newDiagramXML);
}

function openDiagram(xml) {
	modeler.importXML(xml, function(err) {
		if (err) {
			container.removeClass('with-diagram').addClass('with-error'); 
			container.find('.error pre').text(err.message); 
			console.error(err);
		} else {
			container.removeClass('with-error').addClass('with-diagram');
		}
	});
}

function registerFileDrop(container, callback) {

	function handleFileSelect(e) {
		e.stopPropagation();
		e.preventDefault();
		var files = e.dataTransfer.files;
		var file = files[0];
		var reader = new FileReader();
		reader.onload = function(e) {
			var xml = e.target.result;
			callback(xml);
		};
		reader.readAsText(file);
	}

	function handleDragOver(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}

	container.get(0).addEventListener('dragover', handleDragOver, false);
	container.get(0).addEventListener('drop', handleFileSelect, false);
}


//////file drag / drop ///////////////////////

//check file api availability
if (!window.FileList || !window.FileReader) {
	window.alert(
			'Looks like you use an older browser that does not support drag and drop. ' +
	'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
	registerFileDrop(container, openDiagram);
}

//bootstrap diagram functions

$(document).on('ready', function() {

	$('#js-create-diagram').click(function(e) {
		e.stopPropagation();
		e.preventDefault();

		createNewDiagram();
	});

	var downloadLink = $('#js-download-diagram');
	var downloadSvgLink = $('#js-download-svg');

	$('.buttons a').click(function(e) {
		if (!$(this).is('.active')) {
			e.preventDefault();
			e.stopPropagation();
		}
	});


});

function saveDiagram(done) {
	modeler.saveXML({ format: true }, function(err, xml) {
		console.log("-----2-------------------");
		done(err, xml);
	});
}

var _ = require('lodash');
var angular = require('angular');
var app = angular.module('BpmnModelerApp', []);
app.controller('BpmnModelerCtrl', function($scope, $http) {
	console.log("BpmnModelerCtrl");
	$scope.params = params;
	
	var exportArtifacts = _.debounce(function() {
		saveDiagram(function(err, xml) {
			setBpmnContent($scope.obj.data, params.jsonpath, xml);
		});
	}, 500);

	modeler.on('commandStack.changed', exportArtifacts);
	
	
	var urlForContent = '/v/readContent';
	if(params.p){
		urlForContent = '/v/readProtocol/' + params.p;
	}
	console.log(urlForContent);
	
	$http.get(urlForContent).success(function(response) {
		var protocol1 = response;
		console.log(protocol1);
		$scope.obj = {
			data : protocol1,
			options : { mode : 'tree' }
		};
		console.log($scope.obj);
		var bpmnContent = jsonPath($scope.obj.data, params.jsonpath)
		if(bpmnContent === '-'){
			var newDiagramXML = fs.readFileSync(__dirname + '/../resources/newDiagram.bpmn', 'utf-8');
			openDiagram(newDiagramXML)
		}else{
			openDiagram(bpmnContent);
		}
	});
	
	$scope.addProtocolUrl = function(){
		if(params.p){
			return '?p='+params.p;
		}
		return '';
	}
	$scope.saveFile = function(){
		console.log("-------saveFile--------");
		
		var urlToSave = '/saveCommonContent';
		if($scope.obj.data.fileName){
			urlToSave = '/saveProtocol';
		}
		$http.post(urlToSave, $scope.obj.data ).success(function(response) {
			console.log(response.length);
		});
	}
	
});

function setBpmnContent(obj, path, xml){
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

const params = require('query-string').parse(location.search);
console.log("params = ");
console.log(params);
