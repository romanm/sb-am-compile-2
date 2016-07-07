package hello.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Map;

import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import hello.PropertiConfig;

@Component("fileService")
public class FileService {
	private static final Logger logger = LoggerFactory.getLogger(FileService.class);
	
	@Autowired private PropertiConfig propertiConfig;
	@Value("${folder.db:/tmp}") public  String folderDb;

	public Map<String, Object> readJsonFromFileName(String fileName) {
		String fileLongName = folderDb + fileName;
//		fileLongName = fileLongName.trim();
		return readFileFromLongName(fileLongName);
	}

	public Map<String, Object> readFileFromLongName(String fileLongName) {
		File file = new File(fileLongName);
		logger.debug(file.toString());
		return readJsonFromFullFileName(file);
	}

	private void readTxtFile(String fileName) {
		String line = null;
		// FileReader reads text files in the default encoding.
		FileReader fileReader;
		try {
			fileReader = new FileReader(fileName);
			// Always wrap FileReader in BufferedReader.
			BufferedReader bufferedReader = 
					new BufferedReader(fileReader);
			while((line = bufferedReader.readLine()) != null) {
				System.out.println(line);
			}

			// Always close files.
			bufferedReader.close();
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}
		catch(IOException ex) {
			System.out.println(
					"Error reading file '" 
							+ fileName + "'");
			// Or we could just do this: 
			// ex.printStackTrace();
		}

	}

	private Map<String, Object> readJsonFromFullFileName(File file) {
		Map<String, Object> readJsonFileToJavaObject = null;
		try {
			readJsonFileToJavaObject = mapper.readValue(file, Map.class);
		} catch (JsonParseException e1) {
			e1.printStackTrace();
		} catch (JsonMappingException e1) {
			e1.printStackTrace();
		} catch (IOException e1) {
			e1.printStackTrace();
		}
		return readJsonFileToJavaObject;
	}

	ObjectMapper mapper = new ObjectMapper();

	public void saveJsonToFile(Map<String, Object> javaObjectToJson, String fileName) {
		saveMapAsFile(javaObjectToJson, folderDb + fileName);
	}

	public void saveMapAsFile(Map<String, Object> javaObjectToJson, String longFileName) {
		File file = new File(longFileName);
		System.out.println(file);
		ObjectWriter writerWithDefaultPrettyPrinter = mapper.writerWithDefaultPrettyPrinter();
		System.out.println(23);
		try {
			FileOutputStream fileOutputStream = new FileOutputStream(file);
			writerWithDefaultPrettyPrinter.writeValue(fileOutputStream, javaObjectToJson);
			System.out.println("saved " + javaObjectToJson.keySet());
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public Map<String, Object> readJsonFromFile(String fileName) {
		File file = new File(folderDb + fileName);
		Map<String, Object> readJsonFileToJavaObject = null;
		try {
			readJsonFileToJavaObject = mapper.readValue(file, Map.class);
		} catch (JsonParseException e1) {
			e1.printStackTrace();
		} catch (JsonMappingException e1) {
			e1.printStackTrace();
		} catch (IOException e1) {
			e1.printStackTrace();
		}
		return readJsonFileToJavaObject;
	}

	public void backup(String fileName) {
		backup(folderDb, fileName);
	}

	public void backup(String folderDbSource, String fileName) {
		DateTime today = new DateTime();
		String timestampStr = propertiConfig.yyyyMMddHHmmssDateFormat.format(today.toDate());
		try {
			Files.copy(new File(folderDbSource + fileName).toPath()
			, new File(folderDb + "backup/" + fileName +"."+ timestampStr).toPath()
			, StandardCopyOption.REPLACE_EXISTING);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
