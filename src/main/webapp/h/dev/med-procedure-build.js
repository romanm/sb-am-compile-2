var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
	console.log('myCtrl --------------------- ');
buildTestProcedure($scope);
	console.table($scope.testProcedure);
	$http.get("/v/medprocedure1").then(function(response) {
		$scope.data = response.data;
		console.log($scope.data);
	});
});

//trim in all values of object
var trimValuesOfObject = function(obj){
	for(var k in obj)
		obj[k] = obj[k].trim();
	return obj;
};

var cleanProcedureAttribute = function (v){
	return {code:v.codeId,name:v.name,id:v.id}
}
var setCodeId = function (v){
	v.codeId = v.code;
	if(v.code2 > 0)
		v.codeId += "."+(v.code2<10?"0":"")+v.code2;
}

var push = function (vParent, v){
	if(vParent.procedure == null)
		vParent.procedure = [];
	vParent.procedure.push(v);
}

var buildTestProcedure = function ($scope){
	console.log(testProcedure);
	$scope.testProcedure  = [];
	var lastObjOfLevel = [{}];
	lastObjOfLevel.push(testProcedure[1])
	var level = 1;
	console.table(lastObjOfLevel);
	for (var i = 1, len = testProcedure.length; i < len; i++) {
		var valueP = testProcedure[i-1];
		var vP = trimValuesOfObject(valueP);
		if(vP.code == "3DE" || vP.code == "3DF"){
			console.log(vP)
		}
		var value = testProcedure[i];
		var v = trimValuesOfObject(value);
		setCodeId(v);
		if(v.code == 0){
			var vParent = lastObjOfLevel[level];
			v.name=v.name2;
			delete v.name2;
			v.codeId = vParent.codeId + "." + v.name.split(" ")[0];
			push(lastObjOfLevel[level], v);
			continue;//because always last level
		}
		if(!isNaN(v.code.substring(0, 1))){//the group
			level = v.code.length;
			if(level == 1){
				$scope.testProcedure.push(v);
			}else {
				push(lastObjOfLevel[level - 1], v);
			}
		}else if(v.codeId.indexOf(".")>0){//the code self
			level = v.code.length + 1;
			v.name=v.name2;
			delete v.name2;
			push(lastObjOfLevel[level - 1], v);
		}
		lastObjOfLevel[level] = v;
	}
}
