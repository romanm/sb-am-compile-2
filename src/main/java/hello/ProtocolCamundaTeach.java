package hello;

import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author roman
 * Вивчання camunda
 * Teach camunda
 */
@Controller
public class ProtocolCamundaTeach {
	private static final Logger logger = LoggerFactory.getLogger(ProtocolCamundaTeach.class);
	@Autowired ProcessEngine processEngine;
	@Autowired JdbcTemplate camunda1JdbcTemplate;
	@Autowired StudyCamunda studyCamunda;

	@RequestMapping(value = "/v/executeTask/{procInstId}", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> executeTask(@PathVariable Integer procInstId){
		logger.debug(""+procInstId);
//		List<Task> allTasks = studyCamunda.allTasks(procDefId);
		studyCamunda.executeTask(procInstId);
		Map<String,Object> map = new HashMap<>();
		map.put("procDefId", procInstId);
//		map.put("list", processInstances);
		return map;
	}

	@RequestMapping(value = "/v/showProcessActiviti/{procDefId}", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> showProcessActiviti(@PathVariable String procDefId){
//		List<Task> allTasks = studyCamunda.allTasks(procDefId);
		List<Map<String, Object>> processInstances = studyCamunda.getProcessInstances(procDefId);
		Map<String,Object> map = new HashMap<>();
		map.put("procDefId", procDefId);
		map.put("list", processInstances);
		return map;
	}
	
	@RequestMapping(value = "/v/startProcess/{processKey}", method = RequestMethod.POST)
	public  @ResponseBody Map<String, Object> startProcess(@PathVariable String processKey) {
		logger.debug("/v/startProcess/"+processKey);
		Map<String,Object> map = new HashMap<>();
		ProcessInstance processInstance = studyCamunda.startProcess( processKey);
//		map.put("processInstance", processInstance); // not seriazeble
		map.put("businessKey", processInstance.getBusinessKey());
		map.put("id", processInstance.getId());
		map.put("processDefinitionId", processInstance.getProcessDefinitionId());
		map.put("processInstanceId", processInstance.getProcessInstanceId());
		return map;
		//SELECT * FROM ACT_HI_PROCINST
		//SELECT * FROM ACT_HI_ACTINST
		//SELECT * FROM ACT_HI_TASKINST
		//SELECT * FROM ACT_RU_TASK
	}

	@RequestMapping(value = "/v/deployHypertension", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> deployHypertension() throws FileNotFoundException {
		Map<String, Object> map = new HashMap<>();
		String name = "Hypertension_4";
		map.put("name", name);
		String name1 = name + "_DmnAT1";
		map.put("name1", name1);
		String bpmFileLongName21 = "/home/roman/dev-20160518/research_2/db-protocol/tmp-from-file/dmn1.dmn";
		System.out.println("--------------");
		System.out.println(bpmFileLongName21);
		System.out.println(bpmFileLongName21);
		studyCamunda.deployDmn(name1, bpmFileLongName21);
		DecisionDefinition decisionDefinition = processEngine.getRepositoryService().createDecisionDefinitionQuery()
				.decisionDefinitionKey(name1).latestVersion().singleResult();
		System.out.println(decisionDefinition);
		
		//		String bpmFileLongName2 = "/home/roman/dev-20160518/research_2/db-protocol/tmp/sample2.bpmn";
		String bpmFileLongName2 = "/home/roman/dev-20160518/research_2/db-protocol/tmp-from-file/sample2.bpmn.xml";
		System.out.println(bpmFileLongName2);
		studyCamunda.deployProcess( name, bpmFileLongName2);
		return map;
	}

	@RequestMapping(value = "/v/readAllDeployment", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> readProtocol() {
		Map<String, Object> map = new HashMap<>();
		map.put("readFromTables", "ACT_RE_PROCDEF;ACT_RE_DEPLOYMENT;ACT_RE_DECISION_DEF");
		List<Map<String, Object>> actReProcdef = camunda1JdbcTemplate.queryForList("SELECT * FROM ACT_RE_PROCDEF");
		map.put("ACT_RE_PROCDEF", actReProcdef);
		List<Map<String, Object>> actReDeployment = camunda1JdbcTemplate.queryForList("SELECT * FROM ACT_RE_DEPLOYMENT");
		map.put("ACT_RE_DEPLOYMENT", actReDeployment);
		List<Map<String, Object>> actReDecisionDef = camunda1JdbcTemplate.queryForList("SELECT * FROM ACT_RE_DECISION_DEF");
		map.put("ACT_RE_DECISION_DEF", actReDecisionDef);
		return map;
	}

}
