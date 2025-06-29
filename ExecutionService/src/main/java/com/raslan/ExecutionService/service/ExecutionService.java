package com.raslan.ExecutionService.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExecutionService {
    private final DockerService dockerService;
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void handleExecution(Map<String, String> submission) {
        log.info("Received submission Request : {}",submission);
        String output = dockerService.runCode(
                submission.get("language"),
                submission.get("code"),
                submission.get("input")
        );
        log.info("Execution completed, output: {}", output);
    }
}
