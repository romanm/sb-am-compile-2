package hello;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import hello.service.FileService;
import hello.service.PreParseProtocol;

@Controller
public class ProtocolRest {
	private static final Logger logger = LoggerFactory.getLogger(ProtocolRest.class);
	@Autowired ProcessEngine processEngine;
	@Autowired private FileService fileService;
	@Autowired StudyCamunda studyCamunda;
	@Autowired PreParseProtocol preParseProtocol;

	@Value("${folder.db.protocol}") public  String protocolDirName;
	@Value("${folder.db.tmp}") public  String protocolDirTmp;

	@RequestMapping(value = "/v/deployProtocol", method = RequestMethod.POST)
	public  @ResponseBody Map<String, Object> deployProtocol(@RequestBody Map<String, Object> protocol) throws FileNotFoundException {
		DeploymentBuilder createDeployment = processEngine.getRepositoryService().createDeployment();
		DeploymentBuilder deploymentBuilder = createDeployment.enableDuplicateFiltering(false);
		logger.debug("-------createDeployment-------------- "+deploymentBuilder);
		deployDmn();
		String name = "Hipertension3";
		//		String bpmFileLongName2 = "/home/roman/dev-20160518/research_2/db-protocol/tmp/sample2.bpmn";
		String bpmFileLongName2 = "/home/roman/dev-20160518/research_2/db-protocol/tmp/sample2.bpmn.xml";
		studyCamunda.deployProcess( name, bpmFileLongName2);
		if(true)
			return null;
		Set<String> keySet = protocol.keySet();
		for (String key : keySet) {
			if(key.indexOf("b-pmn")==0){
				System.out.println(key);
				Map<String,Object> bpmnMap = (Map<String, Object>) protocol.get(key);
				String bpmnContent = (String) bpmnMap.get("bpmnContent");
				System.out.println(bpmnContent.length());
				System.out.println(bpmnContent.substring(38,244));
				System.out.println("--------------------");
				//				InputStream is = new ByteArrayInputStream(bpmnContent.getBytes());
				//				deploymentBuilder.name(name).addInputStream(name, is).deploy();
				System.out.println("--------------------");
				//				deploymentBuilder.name(name).source(bpmnContent).deploy();
				//				deploymentBuilder.addString(name, bpmnContent).deploy();
				fileService.saveBpmnAsFile(key, bpmnContent);
				String bpmFileLongName = protocolDirTmp + key + ".bpmn";
				preParseProtocol.cleanBpmn(bpmFileLongName);
				studyCamunda.deployProcess( name, bpmFileLongName);
			}else
				if(key.indexOf("dmn")==0){
					System.out.println(key);
					Map<String,Object> bpmnMap = (Map<String, Object>) protocol.get(key);
					String dmnContent = (String) bpmnMap.get("dmnContent");
					System.out.println(dmnContent.length());
					System.out.println(dmnContent.substring(38,244));
					fileService.saveCamundaXmlAsFile(key, dmnContent, ".dmn");
				}
		}
		return protocol;
	}

	private void deployDmn() {
		String name = "DmnAT1";
		String bpmFileLongName2 = "/home/roman/dev-20160518/research_2/db-protocol/tmp/dmn1.dmn";
		System.out.println("--------------");
		DecisionDefinition decisionDefinition = processEngine.getRepositoryService().createDecisionDefinitionQuery()
				.decisionDefinitionKey("decision").latestVersion().singleResult();
		System.out.println(decisionDefinition);

//		studyCamunda.deployDmn(name, bpmFileLongName2);
//		Deployment deployment = createDeployment.addClasspathResource(bpmFileLongName2).deploy();
//		System.out.println(deployment);

	}

	@RequestMapping(value = "/saveProtocol", method = RequestMethod.POST)
	public  @ResponseBody Map<String, Object> saveProtocol(@RequestBody Map<String, Object> protocol) {
		String fileName = (String) protocol.get("fileName");
		String fileNameExt = fileName + ".json";
		logger.debug("/saveProtocol :: "+fileNameExt);
		fileService.saveMapAsFile(protocol, protocolDirName + fileNameExt);
		logger.debug("backup");
		fileService.backup(protocolDirName, fileNameExt);
		logger.debug("----END----");
		return protocol;
	}

	@RequestMapping(value = "/v/readProtocol/{fileName}", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> readProtocol(@PathVariable String fileName) {
		Map<String, Object> protocol = fileService.readFileFromLongName(protocolDirName+fileName+".json");
		protocol.put("fileName", fileName);
		return protocol;
	}

	@RequestMapping(value = "/v/readProtocolDir", method = RequestMethod.GET)
	public  @ResponseBody List<String> readProtocolDir() {
		List<String> fl = new ArrayList<>();
		for (File file : new File(protocolDirName).listFiles()) {
			String[] split = file.toString().split("/");
			fl.add(split[split.length-1].replace(".json", ""));
		}
		return fl;
	}

}
