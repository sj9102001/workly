package com.sj.Workly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class WorklyApplication {

	public static void main(String[] args) {
		SpringApplication.run(WorklyApplication.class, args);
	}

}
