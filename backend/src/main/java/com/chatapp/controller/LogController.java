package com.chatapp.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class LogController {
    private static final Logger logger = LoggerFactory.getLogger("frontend");

    @PostMapping("/error")
    public ResponseEntity<Void> logFrontendError(@RequestBody Map<String, Object> errorData) {
        String errorMessage = String.format(
            "前端错误: %s\n堆栈信息: %s\n组件: %s",
            errorData.get("message"),
            errorData.get("stack"),
            errorData.get("componentStack")
        );
        logger.error(errorMessage);
        return ResponseEntity.noContent().build();
    }
}
