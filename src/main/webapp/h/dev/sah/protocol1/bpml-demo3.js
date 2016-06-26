
require({
	baseUrl: "./",
	paths: {
//		'jquery' : 'lib/jquery/jquery-1.7.2.min',
//		'bpmn/Bpmn' : 'build/bpmn.min',
//		'jquery' : '/v/lib/jquery/jquery-2.2.4.min',
		'jquery' : '/v/lib/js/jquery-1.7.2.min',
		'bpmn/Bpmn' : '/v/libpm/bpmn.min',
	},
	packages: [
		{ name: "dojo", location: "/v/lib/js/dojo/dojo" },
		{ name: "dojox", location: "/v/lib/js/dojo/dojox"},
		// provided by build/bpmn.min.js
		// { name: "bpmn", location: "src/bpmn" }
	]
});

require(["bpmn/Bpmn", "dojo/domReady!"], function(Bpmn) {
	new Bpmn().renderUrl("sepsis-LCGuideline-1.bpmn", {
		//new Bpmn().renderUrl("test/resources/task_loop.bpmn", {
		//new Bpmn().renderUrl("control-adequacy-resuscitation-in-sepsis-1.dmn", {
		diagramElement : "diagram",
		overlayHtml : '<div style="position: relative; top:100%"></div>'
	}).then(function (bpmn){
		//bpmn.zoom(0.8);
		bpmn.annotation("sid-C7031B1A-7F7E-4846-B046-73C638547449").setHtml('<span class="bluebox"  style="position: relative; top:100%">New Text</span>').addClasses(["highlight"]);
		bpmn.annotation("sid-C7031B1A-7F7E-4846-B046-73C638547449").addDiv("<span>Test Div</span>", ["testDivClass"]);
	});
});
