package com.raslan.submission.controller;

import com.raslan.submission.dto.Submission;
import com.raslan.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submit")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SubmissionController {
    private final SubmissionService submissionService;

    @PostMapping
    public void handleSubmission(@RequestBody Submission request) {
        submissionService.handleSubmission(request);
    }
}
