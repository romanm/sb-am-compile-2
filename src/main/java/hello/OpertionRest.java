package hello;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class OpertionRest {
	@Autowired NamedParameterJdbcTemplate hol2EihParamJdbcTemplate;
	@Value("${sql.hol1.operation.group}")		private String sqlHol1OperationGroup;
	@Value("${sql.hol1.operation.subgroup}")	private String sqlHol1OperationSubgroup;
	@Value("${sql.hol1.operation.operation}")	private String sqlHol1OperationOperation;
	
	@RequestMapping(value = "/v/operation/group", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getGroup() {
		List<Map<String, Object>> seekProcedure 
		= hol2EihParamJdbcTemplate.queryForList(sqlHol1OperationGroup,
				new MapSqlParameterSource("nullParameter", 0 ));
		return seekProcedure;
	}
	@RequestMapping(value = "/v/operation/subgroup/{operationGroupId}", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getSiblingSubGroup(@PathVariable Integer operationGroupId) {
		List<Map<String, Object>> seekProcedure 
		= hol2EihParamJdbcTemplate.queryForList(sqlHol1OperationOperation, 
				new MapSqlParameterSource("operationSubGroupId",  operationGroupId ));
		return seekProcedure;
	}
	@RequestMapping(value = "/v/operation/operation/{operationSubGroupId}", method = RequestMethod.GET)
	public @ResponseBody List<Map<String, Object>> getSiblingOperation(@PathVariable Integer operationSubGroupId) {
		List<Map<String, Object>> seekProcedure 
		= hol2EihParamJdbcTemplate.queryForList(sqlHol1OperationOperation, 
				new MapSqlParameterSource("operationSubGroupId",  operationSubGroupId ));
		return seekProcedure;
	}

}
