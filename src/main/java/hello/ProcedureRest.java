package hello;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProcedureRest {
	@Autowired NamedParameterJdbcTemplate hol2EihParamJdbcTemplate;

	@Value("${sql.insert.list.procedure_operation}") private String sqlInsertListProcedure_operation;

	@RequestMapping(value = "/v/saveProceduteToOperation", method = RequestMethod.POST)
	public  @ResponseBody Map<String, String> saveProceduteToOperation(
			@RequestBody Map<String, String> insertProcedureOperation, Principal userPrincipal) {
		System.out.println(insertProcedureOperation);
		String pROCEDURE_CODE = (String) insertProcedureOperation.get("PROCEDURE_CODE");
		String oPERATION_CODE = (String) insertProcedureOperation.get("OPERATION_CODE");
		System.out.println(pROCEDURE_CODE+"/"+oPERATION_CODE);
		int update = hol2EihParamJdbcTemplate.update(sqlInsertListProcedure_operation, insertProcedureOperation);
		System.out.println(update);
		return insertProcedureOperation;
	}

	@Value("${sql.list.procedure.sibling}") private String sqlListProcedureSibling;

	@RequestMapping(value = "/v/siblingProcedure/{parentId}", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getSibling(@PathVariable Integer parentId) {
		List<Map<String, Object>> seekProcedure 
		= hol2EihParamJdbcTemplate.queryForList(sqlListProcedureSibling, 
				new MapSqlParameterSource("parentId",  parentId ));
		return seekProcedure;
	}

	@Value("${sql.list.procedure.seek}") private String sqlListProcedureSeek;

	@RequestMapping(value = "/v/seekProcedure/{seekText}", method = RequestMethod.GET)
	public @ResponseBody Map<String, Object> seekProcedure(@PathVariable String seekText) {
//		String sqlListProcedureSeek = Util.replace(this.sqlListProcedureSeek);
		HashMap<String, Object> map = new HashMap<>();
		map.put("seekText", seekText);
		System.out.println();
		System.out.println(sqlListProcedureSeek);
		System.out.println();
		List<Map<String, Object>> seekProcedure 
		= hol2EihParamJdbcTemplate.queryForList(sqlListProcedureSeek, new MapSqlParameterSource("likeText", "%"
				+ seekText
				+ "%"));
		map.put("seekProcedure", seekProcedure);
		return map;
	}

}
