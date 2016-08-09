package hello;

import java.text.SimpleDateFormat;

import org.springframework.stereotype.Component;

@Component
public class PropertiConfig {
	public final static SimpleDateFormat yyyyMMddHHmmssDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH-mm-ss");
}
