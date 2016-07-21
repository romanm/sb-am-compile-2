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
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstanceModificationBuilder;
import org.camunda.bpm.engine.runtime.ProcessInstanceModificationInstantiationBuilder;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;
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
		List<Execution> list = runtimeService.createExecutionQuery()
		.processInstanceId(tid)
		.list();
		//83	…  hello.StudyCamunda	- [ProcessInstance[415], ProcessInstance[901]]
		logger.debug(""+list);
		Execution singleResult = runtimeService.createExecutionQuery()
		.processInstanceId(tid).singleResult();
		logger.debug(""+singleResult);
		
		return singleResult;
	}

	public void executeTask(Integer procInstId) {
		logger.debug(""+procInstId);
		Execution studyExecutionQuery = studyExecutionQuery(""+procInstId);
		setVariable(studyExecutionQuery);
		TaskService taskService = processEngine.getTaskService();
		logger.debug(""+taskService);
		if(true)
			return;
//		String tid = "UserTask_1:903";
		String tid = "904";
		logger.debug(tid);
		taskService.complete(tid);
		
		logger.debug("--------------");
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
	@Value("${sql.camunda.ACT_HI_ACTINST.by.PROC_DEF_ID_}") private String sqlCamundaActinstByProcDefId;
	List<Map<String, Object>> getProcessInstances(String procDefId) {
		logger.debug(""+procDefId);
		logger.debug(""+sqlCamundaActinstByProcDefId);
		String sql = sqlCamundaActinstByProcDefId.replace(":procDefId", "'"+procDefId+"'");
		logger.debug(""+sql);
//		List<Map<String, Object>> seekIcdList 
//		= camunda1JdbcTemplate.queryForList(sql);
		List<Map<String, Object>> seekIcdList 
		= camunda1ParamJdbcTemplate.queryForList(sqlCamundaActinstByProcDefId
				, new MapSqlParameterSource("procDefId", procDefId
				));
		logger.debug(""+seekIcdList);
		return seekIcdList;
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

	void deployDmn(String dmnName, String fileLocation) throws FileNotFoundException {
		File file = new File(fileLocation);
		System.out.println(file);
		FileInputStream inputStream = new FileInputStream(file);
		DeploymentBuilder deploymentBuilder = processEngine.getRepositoryService().createDeployment(); 
		DeploymentBuilder deploymentNamed = deploymentBuilder.name(dmnName);
		DeploymentBuilder addInputStream = deploymentNamed.addInputStream(dmnName + ".dmn", inputStream);
		Deployment deploy = addInputStream.deploy(); 
		System.out.println(deploy);
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
		//SELECT * FROM ACT_RE_DEPLOYMENT (id_DEPLOYMENT -1  = id_BYTEARRAY)
		//SELECT * FROM ACT_GE_BYTEARRAY
	}

}
