package hello;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.List;

import org.camunda.bpm.engine.DecisionService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.impl.ProcessEngineImpl;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.task.TaskQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

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
	
	void test1(){
		DecisionService decisionService = processEngine.getDecisionService();
		RepositoryService repositoryService = processEngine.getRepositoryService();		
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
		return list1;
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

	public static ProcessInstance startProcess(ProcessEngineImpl processEngine, String processDefinitionKey) {
		RuntimeService runtimeService = processEngine.getRuntimeService();
		ProcessInstance startProcessInstanceByKey = runtimeService.startProcessInstanceByKey(processDefinitionKey);
		System.out.println("--- 3 ---");
		System.out.println(startProcessInstanceByKey);
		//SELECT * FROM ACT_RU_TASK
		//SELECT * FROM ACT_RU_EXECUTION
		return startProcessInstanceByKey;
	}

//	public void deployProcess(ProcessEngineImpl processEngine, String processName, String fileLocation) throws FileNotFoundException { 
//		deployProces(processEngine, processName, fileLocation);
//	}

	void deployDmn(String processName, String fileLocation) throws FileNotFoundException {
		File file = new File(fileLocation);
		System.out.println(file);
		FileInputStream inputStream = new FileInputStream(file);
		DeploymentBuilder deploymentBuilder = processEngine.getRepositoryService().createDeployment(); 
		DeploymentBuilder deploymentNamed = deploymentBuilder.name(processName);
		DeploymentBuilder addInputStream = deploymentNamed.addInputStream(processName + ".dmn", inputStream);
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
