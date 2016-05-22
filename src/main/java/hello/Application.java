package hello;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.ImportResource;

@SpringBootApplication
@ImportResource("classpath:config-app-spring.xml")
public class Application {

	public static void main(String[] args) throws Throwable {
		ConfigurableApplicationContext run = SpringApplication.run(Application.class, args);
//		showAllBean(run);
//		testCamunda(run);
	}
	
	private static void testCamunda(ConfigurableApplicationContext run) {
		StandaloneProcessEngineConfiguration processEngineConfiguration 
			= (StandaloneProcessEngineConfiguration) run.getBean("processEngineConfiguration");
		ProcessEngine processEngine = processEngineConfiguration.buildProcessEngine();
		System.out.println(processEngine);
	}

	private static void showAllBean(ConfigurableApplicationContext run) {
		System.out.println("--- beanName ---");
		for (String beanName : run.getBeanDefinitionNames()) {
			System.out.println("--- beanName ---");
			System.out.println(beanName);
			System.out.println(run.getBean(beanName));
		}
		System.out.println("--- beanName ---");
	}

}
