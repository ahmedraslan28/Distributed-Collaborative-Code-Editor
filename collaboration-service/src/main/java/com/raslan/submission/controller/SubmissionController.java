package com.raslan.submission.controller;

import com.raslan.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/submit")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class SubmissionController {
    private final SubmissionService submissionService;

    @PostMapping
    public void handleSubmission(@RequestBody Map<String, String> request) {
        submissionService.handleSubmission(request);
    }
}
