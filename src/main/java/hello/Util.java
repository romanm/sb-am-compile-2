package hello;

import java.util.Map;

import org.joda.time.DateTime;

public class Util {
	public static String replace(String s) {
		while (s.contains("%%"))
			s = s.replace("%%", "$");
		return s;
	}
	public static void addCommonParameter(Map<String, Integer> mmp) {
		int year = new DateTime().year().get();
		mmp.put("year", year);
	}
}
