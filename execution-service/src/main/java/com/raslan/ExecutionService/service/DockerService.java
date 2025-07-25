package com.raslan.ExecutionService.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class DockerService {
    private final Path HOST_CODE_DIR;

    public DockerService(@Value("${code.host-dir}") String hostCodeDirPath) {
        this.HOST_CODE_DIR = Path.of(hostCodeDirPath).toAbsolutePath();
    }

    public String runCode(String language, String code, String input) {
        try {
            String id = UUID.randomUUID().toString().substring(0, 8); // Unique ID
            String codeFilename = language.equals("java") ? "Main.java" : id + getExtension(language);
            String inputFilename = id + "-input.txt";

            // Write code and input to shared directory
            Path codeFile = HOST_CODE_DIR.resolve(codeFilename);
            Path inputFile = HOST_CODE_DIR.resolve(inputFilename);
            Files.writeString(codeFile, code);
            Files.writeString(inputFile, input);

            String container = chooseContainerName(language);
            String command = buildCommand(language, codeFilename, inputFilename);

            ProcessBuilder processBuilder = new ProcessBuilder(
                    "docker", "exec", container, "sh", "-c", command
            );

            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                deleteDirectoryFiles();
                return "Error: Time limit exceeded (10 seconds)";
            }
            String output = new String(process.getInputStream().readAllBytes());
            deleteDirectoryFiles();

            return output;

        } catch (IOException | InterruptedException e) {
            return "Execution failed: " + e.getMessage();
        }
    }

    private void deleteDirectoryFiles() throws IOException {
        Files.list(HOST_CODE_DIR)
                .filter(Files::isRegularFile)
                .forEach(path -> {
                    try {
                        Files.deleteIfExists(path);
                    } catch (IOException e) {
                        log.warn("Failed to delete file: {}", path);
                    }
                });
    }


    private String chooseContainerName(String language) {
        return switch (language) {
            case "java" -> "code-java";
            case "python" -> "code-python";
            case "javascript" -> "code-node";
            case "cpp" -> "code-cpp";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String buildCommand(String language, String codeFilename, String inputFilename) {
        return switch (language) {
            case "java" -> "javac /app/" + codeFilename + " && cat /app/" + inputFilename + " | java -cp /app Main";
            case "python" -> "cat /app/" + inputFilename + " | python3 /app/" + codeFilename;
            case "javascript" -> "cat /app/" + inputFilename + " | node /app/" + codeFilename;
            case "cpp" -> "g++ /app/" + codeFilename + " -o /app/a.out && cat /app/" + inputFilename + " | /app/a.out";
            default -> "";
        };
    }

    private String getExtension(String language) {
        return switch (language) {
            case "java" -> ".java";
            case "python" -> ".py";
            case "javascript" -> ".js";
            case "cpp" -> ".cpp";
            default -> ".txt";
        };
    }
}
