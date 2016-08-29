'use strict';

var fs = require('fs');

var $ = require('jquery'),
BpmnModeler = require('bpmn-js/lib/Modeler');

var propertiesPanelModule = require('bpmn-js-properties-panel'),
propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
camundaModdleDescriptor = require('camunda-bpmn-moddle/resources/camunda');

var container = $('#js-drop-zone');

var canvas = $('#js-canvas');

var bpmnModeler = new BpmnModeler({
	container: canvas,
	propertiesPanel: {
		parent: '#js-properties-panel'
	},
	additionalModules: [
	                    propertiesPanelModule,
	                    propertiesProviderModule
	                    ],
	                    moddleExtensions: {
	                    	camunda: camundaModdleDescriptor
	                    }
});

var newDiagramXML = fs.readFileSync(__dirname + '/../resources/newDiagram.bpmn', 'utf-8');

function createNewDiagram() {
	openDiagram(newDiagramXML);
}

function openDiagram(xml) {

	bpmnModeler.importXML(xml, function(err) {

		if (err) {
			container
			.removeClass('with-diagram')
			.addClass('with-error');

			container.find('.error pre').text(err.message);

			console.error(err);
		} else {
			container
			.removeClass('with-error')
			.addClass('with-diagram');
		}


	});
}

function saveSVG(done) {
	bpmnModeler.saveSVG(done);
}

function saveDiagram(done) {
	bpmnModeler.saveXML({ format: true }, function(err, xml) {
		done(err, xml);
	});
}

function saveProtocol(done) {
	bpmnModeler.saveXML({ format: true }, function(err, xml) {
		done(err, xml);
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

const params = require('query-string').parse(location.search);
console.log("params = ");
console.log(params);

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

var angular = require('angular');
var app = angular.module('BpmnModelerApp', ['pascalprecht.translate']);
app.config(['$translateProvider', function($translateProvider) { configTranslation($translateProvider); } ])
app.controller('BpmnModelerCtrl', function($scope, $http) {
	console.log("BpmnModelerCtrl");
	$scope.params = params;

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

	function setEncoded(link, name, data) {
		var encodedData = encodeURIComponent(data);

		if (data) {
			link.addClass('active').attr({
				'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
				'download': name
			});
		} else {
			link.removeClass('active');
		}
	}

	var debounce = require('lodash/function/debounce');

	var exportArtifacts = debounce(function() {

		saveSVG(function(err, svg) {
			setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
		});

		saveDiagram(function(err, xml) {
			setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
		});

		saveProtocol(function(err, xml) {
			$scope.obj.data[params.jsonpath].bpmnContent = xml;
		});
	}, 500);

	bpmnModeler.on('commandStack.changed', exportArtifacts);


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
		var bpmnContent = $scope.obj.data[params.jsonpath].bpmnContent;
		openDiagram(bpmnContent);
	});

	//createNewDiagram();
	$scope.saveFile = function(){
		console.log("-------saveFile-------- " + $scope.obj.data.fileName);
		
		var urlToSave = '/saveCommonContent';
		if($scope.obj.data.fileName){
			urlToSave = '/saveProtocol';
		}
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
	
	$http.get("/v/read_user").success(function(response) {
		$scope.userPrincipal = response;
		console.log($scope.userPrincipal);
	});
	
});
