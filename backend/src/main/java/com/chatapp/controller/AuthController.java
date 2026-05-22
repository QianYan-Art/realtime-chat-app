package com.chatapp.controller;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpiration;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户名和密码不能为空");
            return ResponseEntity.badRequest().body(error);
        }

        if (!isValidUser(username, password)) {
            logger.warn("登录失败: {}", username);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);

        logger.info("用户登录成功: {}", username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null || username.isBlank() || password.isBlank()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户名和密码不能为空");
            return ResponseEntity.badRequest().body(error);
        }

        if (username.length() < 3 || password.length() < 6) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户名至少3个字符，密码至少6个字符");
            return ResponseEntity.badRequest().body(error);
        }

        if (isUsernameTaken(username)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "用户名已存在");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        logger.info("用户注册成功: {}", username);

        String token = generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private boolean isValidUser(String username, String password) {
        if ("admin".equals(username) && "admin123".equals(password)) {
            return true;
        }
        if ("user".equals(username) && "user123".equals(password)) {
            return true;
        }
        return false;
    }

    private boolean isUsernameTaken(String username) {
        return "admin".equals(username) || "user".equals(username);
    }

    private String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(SignatureAlgorithm.HS256, jwtSecret.getBytes(StandardCharsets.UTF_8))
                .compact();
    }
}
