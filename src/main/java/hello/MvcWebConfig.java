package hello;

import java.util.Locale;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.servlet.i18n.CookieLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

/* Configuration for localization of Spring boot app
 * 
 * Place your resource files in src/main/resources/i18n/
 * and name them 
 *   messages.properties (default fallback)
 *   messages_de.properties
 *   messages_en.properties
 *   
 * messages.properties example content:
 * welcome=Welcome
 * 
 * In Thymeleaf templates you can use this text as following:
 * <h1 th:text="#{welcome}">Welcome</h1>
 * 
 * Switching between locales like this in Thymeleaf template:
 * <p>Language : <a href="?language=en">English</a>|<a href="?language=de">German</a></p>
 * 
 */

@Configuration
@EnableWebMvc
@ComponentScan
public class MvcWebConfig  extends WebMvcConfigurerAdapter {

	static final Logger logger = LoggerFactory.getLogger(MvcWebConfig.class);
	
	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/home").setViewName("home");
		registry.addViewController("/").setViewName("home");
		registry.addViewController("/hello").setViewName("hello");
		registry.addViewController("/login").setViewName("login");
	}

//camunda
	@Autowired StandaloneProcessEngineConfiguration processEngineConfiguration; 
	
	@Bean
	ProcessEngine processEngine(){
		return processEngineConfiguration.buildProcessEngine();
	}

//locale
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(localeChangeInterceptor());
	}

	@Bean
	public LocaleChangeInterceptor localeChangeInterceptor() {
		LocaleChangeInterceptor localeChangeInterceptor = new LocaleChangeInterceptor();
//		localeChangeInterceptor.setParamName("language");
		return localeChangeInterceptor;
	}

	@Bean(name = "localeResolver")
	public CookieLocaleResolver localeResolver() {
		CookieLocaleResolver localeResolver = new CookieLocaleResolver();
		Locale defaultLocale = new Locale("en");
		localeResolver.setDefaultLocale(defaultLocale);
		return localeResolver;
	}

	@Bean
	public ReloadableResourceBundleMessageSource messageSource() {
		ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
		messageSource.setBasename("classpath:i18n/messages");
		messageSource.setDefaultEncoding("UTF-8");
		messageSource.setCacheSeconds(10); //reload messages every 10 seconds
		return messageSource;
	}

	// as alternative with-out automatic reloading, you could use the following:
	//        @Bean
	//        public ResourceBundleMessageSource messageSource() {
	//                ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
	//                messageSource.setBasename("lang/messages");
	//                return messageSource;
	//        }
}