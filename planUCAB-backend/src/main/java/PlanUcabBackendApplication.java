import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"exceptions", "control", "model"})
public class PlanUcabBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlanUcabBackendApplication.class, args);
	}

}

