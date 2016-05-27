var app = angular.module('myApp', []);
app.controller('MyCtrl', function myCtrlF($scope, $http) {
	console.log('MyCtrl');
	
	var siblingLevel = 0;
	$http.get("/v/siblingProcedure/"+siblingLevel).success(function(response) {
		$scope.medProcedureDb = response;
		console.log($scope.medProcedureDb);
	});
	$scope.operationDb = [];
	$http.get("/v/operation/group").success(function(response) {
		$scope.operationDb = response;
		console.log($scope.operationDb);
	});
	$scope.procedureOperation = [];
	$http.get("/v/procedureOperation").success(function(response) {
		$scope.procedureOperation = response;
		console.table($scope.procedureOperation);
	});
	
	$scope.$watch("myCtrl.seekText", function handleChange( newValue, oldValue ) {
		console.log( "myCtrl.seekText:", newValue );
		if(newValue != null){
			$http.get("/v/seekProcedure/"+newValue).success(function(response) {
				$scope.seekProcedure = response;
				console.log($scope.seekProcedure);
			});
			$http.get("/v/operation/seek/"+newValue).success(function(response) {
				$scope.seekOperation = response;
				console.log($scope.seekOperation);
			});
		}
	});

	$scope.medProcedure  = medProcedure;
	console.log($scope.medProcedure);
	$scope.viewTab = "linking";//linked
	
	$scope.filterCode = '';
	$scope.changeFilterCode = function (){
		if($scope.filterCode == ''){
			$scope.filterCode = '7';
		}else{
			$scope.filterCode = '';
		}
	}
	
	$scope.isShowSql = false;

	$scope.isOperationGroup = function (operation){
		return !isNaN(code.substring(0,1));
	}
	$scope.isProcedureGroup = function (code){
		return !isNaN(code.substring(0,1));
	}
	// prepare to save and save
	$scope.procedureToSave = {};
	$scope.operationToSave = {};
	$scope.isToSaveOperation = function (operation){
		return operation.OPERATION_ID != null && $scope.operationToSave.OPERATION_ID == operation.OPERATION_ID;
	}
	$scope.isToSaveProcedure = function (procedure){
		return $scope.procedureToSave.PROCEDURE_ID == procedure.PROCEDURE_ID;
	}
	$scope.saveProceduteToOperation = function (){
		console.log("saveProceduteToOperation");
		console.log($scope.procedureToSave);
		console.log($scope.operationToSave);
		var insertProcedureToOperation = {
				"PROCEDURE_CODE":$scope.procedureToSave.PROCEDURE_CODE
				,"OPERATION_CODE":$scope.operationToSave.OPERATION_CODE};
		$http.post("/v/saveProceduteToOperation", insertProcedureToOperation).success(function(response) {
			console.log(response);
		});
	}
	$scope.toSaveOperation = function (operation){
		$scope.operationToSave = operation;
		console.log($scope.operationToSave);
	}
	$scope.toSaveProcedure = function (procedure){
		$scope.procedureToSave = procedure;
		console.log($scope.procedureToSave);
	}
	// prepare to save and save END

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
	$scope.openOperationDb = function (operation){
		$scope.openChild(operation);
		if(operation.operation == null){
			console.log("-------------------");
			console.log("/v/operation/operation/"+operation.OPERATION_SUBGROUP_ID);
			$http.get("/v/operation/operation/"+operation.OPERATION_SUBGROUP_ID).success(function(response) {
				operation.operation = response;
				console.log(operation);
			});
		}
	}
	$scope.openOperationSubGroupDb = function (operation){
		$scope.openChild(operation);
		if(operation.operation == null){
			console.log("-------------------");
			console.log("/v/operation/subgroup/"+operation.OPERATION_GROUP_ID);
			$http.get("/v/operation/subgroup/"+operation.OPERATION_GROUP_ID).success(function(response) {
				operation.operation = response;
				console.log(operation);
			});
		}
	}
	checkToSaveProcedure = function (procedure){
		if(procedure.PROCEDURE_CODE.split(".").length == 2){
			console.log(procedure.PROCEDURE_CODE)
			$scope.toSaveProcedure(procedure)
		}
	}
	$scope.openChildProcedureDb = function (procedure){
		$scope.openChild(procedure);
		if(procedure.procedure == null){
			var siblingLevel = procedure.PROCEDURE_ID;
			$http.get("/v/siblingProcedure/"+siblingLevel).success(function(response) {
				procedure.procedure = response;
				console.log(response);
				if(response.length == 0){
					checkToSaveProcedure(procedure);
				}
			});
		}else{
			checkToSaveProcedure(procedure);
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

