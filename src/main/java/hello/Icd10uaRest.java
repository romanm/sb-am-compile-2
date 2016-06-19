package hello;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class Icd10uaRest {
	private static final Logger logger = LoggerFactory.getLogger(Icd10uaRest.class);
	@Autowired NamedParameterJdbcTemplate hol1EihParamJdbcTemplate;
	@Autowired JdbcTemplate hol1EihJdbcTemplate;
	
	@Value("${sql.hol1.icd.seek}") private String sqlHol1IcdSeek;
	@RequestMapping(value = "/v/icd/seek/{seekText}", method = RequestMethod.GET)
	public @ResponseBody Map<String, Object> seekOperation(@PathVariable String seekText) {
		HashMap<String, Object> map = new HashMap<>();
		map.put("seekText", seekText);
		System.out.println(sqlHol1IcdSeek.replaceAll(":likeText", "'%"
				+ seekText
				+ "%'"));
		
		List<Map<String, Object>> seekIcdList 
		= hol1EihParamJdbcTemplate.queryForList(sqlHol1IcdSeek, new MapSqlParameterSource("likeText", "%"
				+ seekText
				+ "%"));
		map.put("seekIcdList", seekIcdList);
		return map;
	}
	

	@Value("${sql.hol1.icd.self}") private String sqlHol1IcdSelf;
	@RequestMapping(value = "/v/pathToRoot/{icdId}", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getPathToRoot(@PathVariable Integer icdId) {
		logger.info("\n ------------------------- Start "
				+"/v/pathToRoot/"+icdId);
		System.out.println(sqlHol1IcdSibling);
		Map<String, Object> icdSelf = hol1EihParamJdbcTemplate.queryForMap(sqlHol1IcdSelf, 
				new MapSqlParameterSource("icdId", icdId));
		logger.info("\n"
				+icdSelf);
		ArrayList<Map<String, Object>> pathToRoot = new ArrayList<>();
		pathToRoot.add(0,icdSelf);
		Map<String, Object> icdParent = icdSelf; 
		while (!icdParent.get("icd10uatree_id").equals(icdParent.get("icd10uatree_parent_id"))) {
			icdParent = hol1EihParamJdbcTemplate.queryForMap(sqlHol1IcdSelf, 
					new MapSqlParameterSource("icdId", icdParent.get("icd10uatree_parent_id")));
			pathToRoot.add(0,icdParent);
		}
		icdSelf.put("pathToRoot", true);
		return pathToRoot;
	}

	@Value("${sql.hol1.icd.sibling}") private String sqlHol1IcdSibling;
	@RequestMapping(value = "/v/siblingIcd/{parentId}", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getIcdSibling(@PathVariable Integer parentId) {
		logger.info("\n ------------------------- Start "
				+"/v/siblingIcd/"+parentId);
		System.out.println(sqlHol1IcdSibling);
		List<Map<String, Object>> seekProcedure 
		= hol1EihParamJdbcTemplate.queryForList(sqlHol1IcdSibling, 
				new MapSqlParameterSource("parentId",  parentId ));
		logger.info("\n"
				+seekProcedure);
		return seekProcedure;
	}
	@Value("${sql.hol1.icd.rootsibling}") private String sqlHol1IcdRootSibling;
	@RequestMapping(value = "/v/rootSiblingIcd", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getRootSiblingIcd() {
		logger.info("\n ------------------------- Start "
				+"/v/rootSiblingIcd");
		System.out.println(sqlHol1IcdRootSibling);
		List<Map<String, Object>> seekProcedure 
		= hol1EihJdbcTemplate.queryForList(sqlHol1IcdRootSibling);
		logger.info("\n"
				+seekProcedure);
		return seekProcedure;
	}
	
	@Value("${sql.hol1.icd.all}") private String sqlHol1IcdAll;
	@RequestMapping(value = "/v/icd10ua-all", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> icd10uaAll() {
		List<Map<String, Object>> icd10uaAll 
		= hol1EihJdbcTemplate.queryForList(sqlHol1IcdAll);
		return icd10uaAll;
	}

}
