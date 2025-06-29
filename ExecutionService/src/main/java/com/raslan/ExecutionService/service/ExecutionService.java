package com.raslan.ExecutionService.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class ExecutionService {
    @RabbitListener(queues = "${rabbitmq.queue.name}")
    public void handleExecution(Map<String, String> submission) {
        log.info("Received submission Request : {}",submission);
    }
}
