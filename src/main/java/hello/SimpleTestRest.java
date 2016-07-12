package hello;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.camunda.bpm.engine.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author roman
 * Перший приклад REST
 * First REST examples
 */
@Controller
public class SimpleTestRest {

	@Autowired StudyCamunda studyCamunda;

	@RequestMapping(value = "/v/helloJsonMap", method = RequestMethod.GET)
	public  @ResponseBody Map<String, Object> helloJsonMap(Principal userPrincipal, HttpServletRequest request) {
		HashMap<String, Object> map = new HashMap<>();
		map.put("hello", "World");
		List<Object> list = new ArrayList<>();
		list.add(33);
		list.add(34);
		map.put("list", list);
//		String processKey = "SampleSelfDeploy";
		String processKey = "Sample";
		List<Task> allTasks = studyCamunda.allTasks(processKey);
		for (Task task : allTasks) {
			list.add(Integer.parseInt(task.getId()));
		}
		System.out.println(list);
		System.out.println("----------------");
		System.out.println(allTasks);
		System.out.println(map);
		return map;
	}

}
