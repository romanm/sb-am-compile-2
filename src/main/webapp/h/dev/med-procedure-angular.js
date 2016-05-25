var app = angular.module('myApp', []);
app.controller('MyCtrl', function myCtrlF($scope, $http) {
	console.log('MyCtrl');
	
	$scope.medProcedureDb = [];
	var siblingLevel = 0;
	$scope.operationDb = [];
	$http.get("/v/siblingProcedure/"+siblingLevel).success(function(response) {
		$scope.medProcedureDb = response;
		console.log($scope.medProcedureDb);
	});
	$http.get("/v/operation/group").success(function(response) {
		$scope.operationDb = response;
		console.log($scope.operationDb);
	});
	
	$scope.$watch("myCtrl.seekText", function handleChange( newValue, oldValue ) {
		console.log( "myCtrl.seekText:", newValue );
		if(newValue != null){
			$http.get("/v/seekProcedure/"+newValue).success(function(response) {
				$scope.seekProcedure = response;
				console.log(response);
			});
		}
	});

	$scope.medProcedure  = medProcedure;
	console.log($scope.medProcedure);
	
	$scope.isShowSql = false;

	$scope.isProcedureGroup = function (code){
		return !isNaN(code.substring(0,1));
	}

	$scope.showSqlInsert = function (v, parentV){
		var procedureParentId = 0;
		if(parentV != null){
			procedureParentId = parentV.id;
		}
		var insert = 
		"insert into procedure (procedure_id, procedure_parent_id, procedure_code, procedure_name) values (" +
		v.id +
		", " +
		procedureParentId +
		", '" +
		v.codeId +
		"', '" +
		replaceAll(v.name,"'","’") +
		"');";
		return insert;
	}
	$scope.showSql = function (){
		$scope.isShowSql = !$scope.isShowSql;
	}

	$scope.isOpenAll = false;
	
	$scope.openAll = function (){
		$scope.isOpenAll = !$scope.isOpenAll;
	}
	
	$scope.isOpen = function (procedure){
		if($scope.isOpenAll) return true;
		return procedure.open;
	}
	$scope.openChildDb = function (procedure){
		$scope.openChild(procedure);
		if(procedure.procedure == null){
			var siblingLevel = procedure.PROCEDURE_ID;
			$http.get("/v/siblingProcedure/"+siblingLevel).success(function(response) {
				procedure.procedure = response;
				console.log(response);
				console.log(procedure);
			});
		}
	}
	$scope.openChild = function (procedure){
		procedure.open = !procedure.open;
		console.log(procedure);
	}
});

var replaceAll = function (str, f, r){
	if(str.indexOf(f) >= 0){
		console.log(str.indexOf(f)+"/"+f+"/"+str);
		return replaceAll(str.replace(f,r),f,r);
	}
	return str;
}


//trim in all values of object
var trimValuesOfObject = function(obj){
	for(var k in obj)
		obj[k] = obj[k].trim();
	return obj;
};

var push = function (vParent, v){
	if(!("procedure" in vParent))
		vParent.procedure = [];
//	vParent.procedure.push(cleanProcedureAttribute(v));
	vParent.procedure.push(v);
}

var cleanProcedureAttribute = function (v){
	return {code:v.codeId,name:v.name,id:v.id}
}

var setCodeId = function (v){
	v.codeId = v.code;
	if(v.code2 > 0){
		v.codeId += "."+(v.code2<10?"0":"")+v.code2;
	}
}

function findString (str) {
	 if (parseInt(navigator.appVersion)<4) return;
	 var strFound;
	 if (window.find) {

	  // CODE FOR BROWSERS THAT SUPPORT window.find

	  strFound=self.find(str);
	  if (!strFound) {
	   strFound=self.find(str,0,1);
	   while (self.find(str,0,1)) continue;
	  }
	 }
	 else if (navigator.appName.indexOf("Microsoft")!=-1) {

	  // EXPLORER-SPECIFIC CODE

	  if (TRange!=null) {
	   TRange.collapse(false);
	   strFound=TRange.findText(str);
	   if (strFound) TRange.select();
	  }
	  if (TRange==null || strFound==0) {
	   TRange=self.document.body.createTextRange();
	   strFound=TRange.findText(str);
	   if (strFound) TRange.select();
	  }
	 }
	 else if (navigator.appName=="Opera") {
	  alert ("Opera browsers not supported, sorry...")
	  return;
	 }
	 if (!strFound) alert ("String '"+str+"' not found!")
	 return;
	}

