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
    private final RedisPublisher redisPublisher;
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void handleExecution(Map<String, String> submission) {
        log.info("Received submission Request : {}",submission);
        String output = dockerService.runCode(
                submission.get("language"),
                submission.get("code"),
                submission.get("input")
        );
        log.info("Execution completed, output: {}", output);
        Map<String, Object> message = Map.of(
                "roomId", submission.get("roomId"),
                "event", "EXECUTION_RESULT"
        );
        redisPublisher.publish(
                "execution:result:"+submission.get("roomId"),
                Map.of("message", message, "output", output)
        );
    }
}
