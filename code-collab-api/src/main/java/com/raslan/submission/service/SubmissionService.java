package com.raslan.submission.service;

import com.raslan.submission.dto.Submission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {
    private final RabbitTemplate rabbitTemplate;
    @Value("${rabbitmq.queue.name}")
    private String queueName;

    public void handleSubmission(Submission submission) {
        rabbitTemplate.convertAndSend(queueName, submission);
        log.info("Submission {} sent to RabbitMQ With queue name {}", submission, queueName);
    }
}
