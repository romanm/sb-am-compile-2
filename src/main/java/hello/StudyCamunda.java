package hello;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.List;

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
import org.springframework.beans.factory.annotation.Autowired;

public class StudyCamunda {

	@Autowired ProcessEngine processEngine;

	public static void completeTask(ProcessEngineImpl processEngine, List<Task> allTasks) {
		Task task = allTasks.get(0);
		System.out.println(task+"/"+Integer.parseInt(task.getId())+"/"+task.getName()+"/"+task.getCaseDefinitionId()
		+"/"+task.getCaseExecutionId()+"/"+task.getCaseInstanceId()+"/"+task.getExecutionId());
//			processEngine.getTaskService().resolveTask(taskId);
		processEngine.getTaskService().complete(task.getId());
	}

	public List<Task> allTasks(String processKey) {
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

	public void deployProcess(ProcessEngineImpl processEngine, String processName, String fileLocation) throws FileNotFoundException { 
		FileInputStream inputStream = new FileInputStream(new File(fileLocation));
		RepositoryService repositoryService = processEngine.getRepositoryService();
		DeploymentBuilder deploymentBuilder = repositoryService.createDeployment(); 
		DeploymentBuilder name = deploymentBuilder.name(processName);
		DeploymentBuilder addInputStream = name.addInputStream(processName + ".bpmn", inputStream);
		Deployment deploy = addInputStream.deploy(); 
		System.out.println(deploy);
		//SELECT * FROM ACT_RE_DEPLOYMENT (id_DEPLOYMENT -1  = id_BYTEARRAY)
		//SELECT * FROM ACT_GE_BYTEARRAY
	}

}
