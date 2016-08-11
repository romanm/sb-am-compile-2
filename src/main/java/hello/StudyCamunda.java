package hello;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.impl.ProcessEngineImpl;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.camunda.bpm.engine.runtime.Execution;
import org.camunda.bpm.engine.runtime.ExecutionQuery;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstanceModificationBuilder;
import org.camunda.bpm.engine.runtime.ProcessInstanceModificationInstantiationBuilder;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;
import org.camunda.bpm.engine.task.Attachment;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.task.TaskQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

/**
 * @author roman
 * Вивчання camunda
 * Camunda teach
 */
public class StudyCamunda {
	private static final Logger logger = LoggerFactory.getLogger(StudyCamunda.class);
	@Autowired ProcessEngine processEngine;

	public static void completeTask(ProcessEngineImpl processEngine, List<Task> allTasks) {
		Task task = allTasks.get(0);
		System.out.println(task+"/"+Integer.parseInt(task.getId())+"/"+task.getName()+"/"+task.getCaseDefinitionId()
		+"/"+task.getCaseExecutionId()+"/"+task.getCaseInstanceId()+"/"+task.getExecutionId());
//			processEngine.getTaskService().resolveTask(taskId);
		processEngine.getTaskService().complete(task.getId());
	}
	
	public List<Task> allTasks(String processKey) {
//		List<Deployer> customPreDeployers = processEngineConfiguration.getDeployers();
//		logger.debug("- "+customPreDeployers);
////		for (Deployer deployer : customPreDeployers) System.out.println(deployer);
//		BpmnDeployer bpmnDeployer = (BpmnDeployer) customPreDeployers.get(0);
//		System.out.println(bpmnDeployer);
		logger.debug("-------customDeployers--------------END");
		TaskService taskService = processEngine.getTaskService();
		TaskQuery createTaskQuery = taskService.createTaskQuery();
		System.out.println("-----doUserTask---------------3--");
		List<Task> list = createTaskQuery.list();
		System.out.println(list);
		
		TaskQuery processDefinitionKey = createTaskQuery.processDefinitionKey(processKey);
		List<Task> list1 = processDefinitionKey.list();
		System.out.println(list1.size());
		System.out.println(list1);
//		TaskQuery processInstanceBusinessKey = createTaskQuery.processInstanceBusinessKey("SampleSelfDeploy");
		//SELECT ID_, TASK_DEF_KEY_, PROC_DEF_KEY_, PROC_DEF_ID_, 
		//PROC_INST_ID_, EXECUTION_ID_, 
		//CASE_DEF_KEY_, CASE_DEF_ID_, CASE_INST_ID_, CASE_EXECUTION_ID_, ACT_INST_ID_, 
		//NAME_, PARENT_TASK_ID_, DESCRIPTION_, OWNER_, ASSIGNEE_, START_TIME_, END_TIME_, 
		//DURATION_, DELETE_REASON_, PRIORITY_, DUE_DATE_, FOLLOW_UP_DATE_
		//FROM ACT_HI_TASKINST;

		//SELECT * FROM ACT_RU_TASK
		return list;
//		return list1;
	}

	private Execution studyExecutionQuery(String tid) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
		ExecutionQuery createExecutionQuery = runtimeService.createExecutionQuery();
		List<Execution> list = createExecutionQuery
		.processInstanceId(tid)
		.list();
		//83	…  hello.StudyCamunda	- [ProcessInstance[415], ProcessInstance[901]]
		logger.debug(""+list);
		Execution singleResult = createExecutionQuery
		.processInstanceId(tid).singleResult();
		logger.debug(""+singleResult);
		logger.debug(""+singleResult.getId()+"/"+singleResult.getProcessInstanceId()
		+"/"+singleResult.getTenantId()+"/"+singleResult.isEnded()+"/"+singleResult.isSuspended());
		
		return singleResult;
	}

	public void nextTask(Map<String, Object> data) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
		String procInstId = ""+data.get("procInstId");
		String taskId = ""+data.get("taskId");
		Map nextTask = (Map) data.get("nextTask");
		String nextTaskId = (String) nextTask.get("nextTaskId");

		Execution processInstance = studyExecutionQuery(procInstId);
		//				setVariable(processInstance);
		ProcessInstanceModificationBuilder processInstanceModificationBuilder
		= runtimeService.createProcessInstanceModification(processInstance.getId());
		ProcessInstanceModificationInstantiationBuilder 
		startBeforeActivity = processInstanceModificationBuilder
		.startBeforeActivity(nextTaskId);

		List<Map<String, Object>> variables = (List) nextTask.get("variables");
		logger.debug(""+variables);
		for (Map<String, Object> map : variables) {
			logger.debug(""+map);
			String varName = (String) map.get("varName");
			String typeRef = (String) map.get("typeRef");
			logger.debug(varName+"="+map.get("value") + "/"+typeRef);
			if(typeRef.equals("double")){
				Double value = Double.parseDouble((String) map.get("value"));
				logger.debug(varName+"="+value);
				ProcessInstanceModificationInstantiationBuilder 
				setVariable = startBeforeActivity.setVariable(varName, value);
			}else if(typeRef.equals("boolean")){
//				boolean value = Boolean.parseBoolean((String) map.get("value"));
				boolean value = (boolean) map.get("value");
				logger.debug(varName+"="+value);
				ProcessInstanceModificationInstantiationBuilder 
				setVariable = startBeforeActivity.setVariable(varName, value);
			}else if(typeRef.equals("integer")){
				Integer value = Integer.parseInt((String) map.get("value"));
				logger.debug(varName+"="+value);
				ProcessInstanceModificationInstantiationBuilder 
				setVariable = startBeforeActivity.setVariable(varName, value);
			}
		}
		startBeforeActivity.execute();


		TaskService taskService = processEngine.getTaskService();
		System.out.println("--------------"
				+ taskId
				+ "-------------");
		taskService.complete(taskId);
	}
	public void executeTask(Integer procInstId) {
		String processInstanceId = ""+procInstId;
		logger.debug(processInstanceId);
		TaskService taskService = processEngine.getTaskService();
		logger.debug(""+taskService);
		test(processInstanceId, taskService);
		Execution studyExecutionQuery = studyExecutionQuery(processInstanceId);
		setVariable(studyExecutionQuery);
		if(true)
			return;
//		String tid = "UserTask_1:903";
		String tid = "904";
		logger.debug(tid);
		taskService.complete(tid);
		
		logger.debug("--------------");
	}

	private void test(String processInstanceId, TaskService taskService) {
		List<Attachment> processInstanceAttachments = taskService.getProcessInstanceAttachments(processInstanceId);
		logger.debug(""+processInstanceAttachments);
		for (Attachment attachment : processInstanceAttachments) {
			logger.debug(""+attachment);
			logger.debug(""+attachment.getId()+"/"+attachment.getName()
			+"/"+attachment.getProcessInstanceId()+"/"+attachment.getTaskId()
			+"/"+attachment.getType()+"/"+attachment.getUrl()+"/"+attachment.getDescription());
		}
	}

	private void setVariable(Execution processInstance) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
//		runtimeService.setVariableLocal(executionId, variableName, value);
		ProcessInstanceModificationBuilder processInstanceModificationBuilder
		= runtimeService.createProcessInstanceModification(processInstance.getId());
		logger.debug("--------------"+processInstanceModificationBuilder);
		String activityId;
		ProcessInstanceModificationInstantiationBuilder 
		startBeforeActivity = processInstanceModificationBuilder
				.startBeforeActivity("BusinessRuleTask_14nixnn");
		ProcessInstanceModificationInstantiationBuilder 
		setVariable = startBeforeActivity.setVariable("AT", 200);
//		ProcessInstanceModificationBuilder 
//		cancelActivityInstance = setVariable.cancelActivityInstance("UserTask_1");
//		cancelActivityInstance.execute();
		setVariable.execute();
		/*
		 * https://docs.camunda.org/manual/7.4/user-guide/process-engine/variables/
		 * com.example.Order order = new com.example.Order();
ObjectValue typedObjectValue = Variables.objectValue(order).create();
runtimeService.setVariableLocal(execution.getId(), "order", typedObjectValue);
		 * */
	}

	public void executeTask2(String procInstId) {
		logger.debug(procInstId);
		RuntimeService runtimeService = processEngine.getRuntimeService();
//		ProcessInstance processInstance = runtimeService.createProcessInstanceQuery().singleResult();
//		runtimeService.createProcessInstanceModification(processInstance.getId())
//		.startBeforeActivity("acceptLoanApplication")
//		.cancelAllForActivity("declineLoanApplication")
		ProcessInstanceModificationBuilder 
		processInstanceModification = runtimeService.createProcessInstanceModification(procInstId);
		logger.debug(""+processInstanceModification);
		processInstanceModification.execute();
	}

	@Autowired JdbcTemplate camunda1JdbcTemplate;
	@Autowired NamedParameterJdbcTemplate camunda1ParamJdbcTemplate;
	@Value("${sql.camunda.ACT_HI_VARINST.by.PROC_DEF_ID_}") private String sqlCamundaVarInstByProcDefId;
	@Value("${sql.camunda.ACT_HI_ACTINST.by.PROC_DEF_ID_}") private String sqlCamundaActInstByProcDefId;
	Map<String, Object> getProcessInstances(String procDefId) {
		logger.debug(""+procDefId);
		logger.debug(""+sqlCamundaActInstByProcDefId);
		String sql = sqlCamundaActInstByProcDefId.replace(":procDefId", "'"+procDefId+"'");
		logger.debug(""+sql);
		List<Map<String, Object>> actInstList 
		= camunda1ParamJdbcTemplate.queryForList(sqlCamundaActInstByProcDefId
				, new MapSqlParameterSource("procDefId", procDefId
						));
		String sql2 = sqlCamundaVarInstByProcDefId.replace(":procInstId", "'"+procDefId+"'");
		logger.debug(""+sql2);
		List<Map<String, Object>> varInstList 
		= camunda1ParamJdbcTemplate.queryForList(sqlCamundaVarInstByProcDefId
				, new MapSqlParameterSource("procInstId", procDefId
						));
		logger.debug(""+actInstList);
		Map<String, Object> map = new HashMap<>();
		map.put("actInstList", actInstList);
		map.put("varInstList", varInstList);
		return map;
	}

	List<Map<String, Object>> getProcessInstances2(String processKey) {
		logger.debug(""+processKey);
		List<Map<String, Object>> list = processInstanceToMap(processInstanceByKey(processKey));
		logger.debug(""+list);
		return list;
	}

	private List<Map<String, Object>> processInstanceToMap(List<ProcessInstance> processInstanceList) {
		List<Map<String, Object>> list = new ArrayList<>();
		for (ProcessInstance processInstance : processInstanceList) {
			Map<String, Object> map = new HashMap<>();
			setProcessInstanceKeys(processInstance, map);
			list.add(map);
		}
		return list;
	}

	private void setProcessInstanceKeys(ProcessInstance processInstance, Map<String, Object> map) {
		map.put("BusinessKey", processInstance.getBusinessKey());
		map.put("CaseInstanceId", processInstance.getCaseInstanceId());
		map.put("ProcessDefinitionId", processInstance.getProcessDefinitionId());
		map.put("ProcessInstanceId", processInstance.getProcessInstanceId());
		setExecutionKeys(processInstance, map);
	}

	private void setExecutionKeys(Execution execution, Map<String, Object> map) {
		map.put("Id", execution.getId());
		map.put("ProcessInstanceId", execution.getProcessInstanceId());
		map.put("TenantId", execution.getTenantId());
		map.put("Ended", execution.isEnded());
		map.put("Suspended", execution.isSuspended());
	}

	private List<ProcessInstance> processInstanceByKey(String processKey) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
		ProcessInstanceQuery processInstanceQuery = runtimeService.createProcessInstanceQuery();
		List<ProcessInstance> list = processInstanceQuery
				.processDefinitionId(processKey)
				.orderByProcessInstanceId().desc()
				.list();
		return list;
	}

	void test1(String deploymentId){
		RuntimeService runtimeService = processEngine.getRuntimeService();
		ProcessInstanceQuery processInstanceQuery = runtimeService.createProcessInstanceQuery();
		List<ProcessInstance> list = processInstanceQuery.deploymentId(deploymentId).list();
	}

	
	public static List<Task> allTasks(ProcessEngineImpl processEngine, String processKey) {
		TaskService taskService = processEngine.getTaskService();
		TaskQuery createTaskQuery = taskService.createTaskQuery();
		System.out.println("-----doUserTask---------------3--");
		List<Task> list = createTaskQuery.list();
		System.out.println(list);
		TaskQuery processDefinitionKey = createTaskQuery.processDefinitionKey(processKey);
		List<Task> list1 = processDefinitionKey.list();
		System.out.println(list1.size());
		System.out.println(list1);
//		TaskQuery processInstanceBusinessKey = createTaskQuery.processInstanceBusinessKey("SampleSelfDeploy");
		//SELECT ID_, TASK_DEF_KEY_, PROC_DEF_KEY_, PROC_DEF_ID_, 
		//PROC_INST_ID_, EXECUTION_ID_, 
		//CASE_DEF_KEY_, CASE_DEF_ID_, CASE_INST_ID_, CASE_EXECUTION_ID_, ACT_INST_ID_, 
		//NAME_, PARENT_TASK_ID_, DESCRIPTION_, OWNER_, ASSIGNEE_, START_TIME_, END_TIME_, 
		//DURATION_, DELETE_REASON_, PRIORITY_, DUE_DATE_, FOLLOW_UP_DATE_
		//FROM ACT_HI_TASKINST;
		//SELECT * FROM ACT_RU_TASK
		return list1;
	}

	public ProcessInstance startProcess(String processDefinitionKey) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
		ProcessInstance processInstance = runtimeService.startProcessInstanceByKey(processDefinitionKey);
		System.out.println("--- 3 ---");
		System.out.println(processInstance);
		//SELECT * FROM ACT_RU_TASK
		//SELECT * FROM ACT_RU_EXECUTION
		return processInstance;
	}

//	public void deployProcess(ProcessEngineImpl processEngine, String processName, String fileLocation) throws FileNotFoundException { 
//		deployProces(processEngine, processName, fileLocation);
//	}

	void deployDmn(String dmnName, String longPathToFile) throws FileNotFoundException {
		File file = new File(longPathToFile);
		System.out.println(file);
		FileInputStream inputStream = new FileInputStream(file);
		DeploymentBuilder deploymentBuilder = processEngine.getRepositoryService().createDeployment(); 
		DeploymentBuilder deploymentNamed = deploymentBuilder.name(dmnName);
		DeploymentBuilder addInputStream = deploymentNamed.addInputStream(dmnName + ".dmn", inputStream);
		Deployment deploy = addInputStream.deploy();
		System.out.println(deploy);
		System.out.println(deploy.getId()+"/"+deploy.getName()
		+"/"+deploy.getSource()+"/"+deploy.getTenantId()+"/"+deploy.getDeploymentTime());
		//SELECT * FROM ACT_RE_DEPLOYMENT (id_DEPLOYMENT -1  = id_BYTEARRAY)
		//SELECT * FROM ACT_GE_BYTEARRAY
	}

	void deployProcess(String processName, String fileLocation) throws FileNotFoundException {
		File file = new File(fileLocation);
		System.out.println(file);
		FileInputStream inputStream = new FileInputStream(file);
		DeploymentBuilder deploymentBuilder = processEngine.getRepositoryService().createDeployment(); 
		DeploymentBuilder deploymentNamed = deploymentBuilder.name(processName);
		DeploymentBuilder addInputStream = deploymentNamed.addInputStream(processName + ".bpmn", inputStream);
		Deployment deploy = addInputStream.deploy(); 
		System.out.println(deploy);
		System.out.println(deploy.getId()+"/"+deploy.getName()
		+"/"+deploy.getSource()+"/"+deploy.getTenantId()+"/"+deploy.getDeploymentTime());
		//SELECT * FROM ACT_RE_DEPLOYMENT (id_DEPLOYMENT -1  = id_BYTEARRAY)
		//SELECT * FROM ACT_GE_BYTEARRAY
	}

}
