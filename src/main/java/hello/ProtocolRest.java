package hello;

import java.io.File;
import java.io.FileNotFoundException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.camunda.bpm.engine.ProcessEngine;
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
	
	@RequestMapping(value = "/v/nextTask", method = RequestMethod.POST)
	public  @ResponseBody List<Map<String, Object>> saveEpicrise(@RequestBody List<Map<String, Object>> variables, Principal userPrincipal) {
		logger.debug(""+variables);
		return variables;
	}

	@RequestMapping(value = "/v/deployProtocol", method = RequestMethod.POST)
	public  @ResponseBody Map<String, Object> deployProtocol(@RequestBody Map<String, Object> clinicalProtocol) 
			throws FileNotFoundException {
		DeploymentBuilder createDeployment = processEngine.getRepositoryService().createDeployment();
		DeploymentBuilder deploymentBuilder = createDeployment.enableDuplicateFiltering(false);
		logger.debug("-------createDeployment-------------- "+deploymentBuilder);
//		String name = "Hipertension3";
		String fileName = (String) clinicalProtocol.get("fileName");
//		if(true)
//			return null;
		for (String key : clinicalProtocol.keySet()) 
			if(key.indexOf("dmn")==0){
				System.out.println(key);
				Map<String,Object> dmnMap = (Map<String, Object>) clinicalProtocol.get(key);
				String dmnContent = (String) dmnMap.get("dmnContent");
				String dmnName = (String) dmnMap.get("dmnName");
				System.out.println(dmnContent.length());
				System.out.println(dmnContent.substring(38,244));
				String longPathToFile = protocolDirTmp + fileName + ".dmn";
				fileService.saveCamundaXmlAsFile(dmnContent, longPathToFile);
				studyCamunda.deployDmn(dmnName, longPathToFile);
			}
		for (String key : clinicalProtocol.keySet()) {
			logger.debug(key+"/"+key.indexOf("bpmn"));
			if(key.indexOf("bpmn")==0){
				System.out.println(key);
				Map<String,Object> bpmnMap = (Map<String, Object>) clinicalProtocol.get(key);
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
				studyCamunda.deployProcess( fileName, bpmFileLongName);
			}
		}
		return clinicalProtocol;
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
