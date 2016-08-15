package hello;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ImportResource;

@SpringBootApplication
@ImportResource("classpath:config-app-spring.xml")
public class Application {

	public static void main(String[] args) throws Throwable {
		SpringApplication.run(Application.class, args);
		startBrowser();
	}
/*
	@Bean
	public ResourceConfig jerseyConfig() {
		return new CamundaJerseyResourceConfig();
	}
 * */

	@Value("${server.port}") private String portForTomcatServer;
	private static void startBrowser() {
		String url = "http://localhost:8087";
		if(Desktop.isDesktopSupported()){
			Desktop desktop = Desktop.getDesktop();
			try {
				desktop.browse(new URI(url));
			} catch (IOException | URISyntaxException e) {
				e.printStackTrace();
			}
		}else{
			Runtime runtime = Runtime.getRuntime();
			try {
				runtime.exec("xdg-open " + url);
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

}
