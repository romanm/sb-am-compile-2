package hello;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProtocolCamundaTeach {
	private static final Logger logger = LoggerFactory.getLogger(ProtocolRest.class);
	@Autowired JdbcTemplate camunda1JdbcTemplate;

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
