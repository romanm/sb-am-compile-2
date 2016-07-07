package hello;

import java.io.File;
import java.io.FilenameFilter;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

@Controller
public class CmsCommonRest {
	private static final Logger logger = LoggerFactory.getLogger(CmsCommonRest.class);
	@Autowired private FileService fileService;
	@Autowired private PropertiConfig propertiConfig;

	@Value("${file.common_content:fcc.json}") public  String fileCommonContent;
	@Value("${folder.db:/tmp}") public  String folderDb;
	@Value("${folder.db.protocol}") public  String protocolDirName;

	@RequestMapping(value = "/v/readProtocolDir", method = RequestMethod.GET)
	public  @ResponseBody List<String> readProtocolDir() {
		List<String> fl = new ArrayList<>();
		for (File file : new File(protocolDirName).listFiles()) {
			String[] split = file.toString().split("/");
			fl.add(split[split.length-1].replace(".json", ""));
		}
		return fl;
	}

	@RequestMapping(value = "/v/readProtocol/{fileName}", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> readProtocol(@PathVariable String fileName) {
		Map<String, Object> protocol = fileService.readFileFromLongName(protocolDirName+fileName+".json");
		protocol.put("fileName", fileName);
		return protocol;
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

	@RequestMapping(value = "/v/readContent", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> readContent() {
		String string = "------------"
				+ fileCommonContent
				+ "------------\n"
				+ "/v/readContent"
				+ "";
		logger.debug(string);
		System.out.println(string);
		Map<String, Object> readJsonFromFile = 
				fileService.readJsonFromFileName(fileCommonContent);
		logger.debug(""+readJsonFromFile.keySet());
		return readJsonFromFile;
	}

	@RequestMapping(value = "/saveCommonContent", method = RequestMethod.POST)
	public  @ResponseBody Map<String, Object> saveCommonContent(@RequestBody Map<String, Object> commonContentJavaObject) {
		logger.debug("/saveCommonContent");
		fileService.saveJsonToFile(commonContentJavaObject,fileCommonContent);
		logger.debug("2");
		fileService.backup(fileCommonContent);
		logger.debug("3");
		return commonContentJavaObject;
	}

	@RequestMapping(value = "/v", method = RequestMethod.GET)
	public String view() { return "redirect:/"; }

	@RequestMapping(value = "/read_user", method = RequestMethod.GET)
	public  @ResponseBody Principal getRoleTypes(Principal userPrincipal) {
		return userPrincipal;
	}

}
