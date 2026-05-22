package com.chatapp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.prefix:Bearer}")
    private String jwtPrefix;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String header = authHeaders.get(0);
                if (StringUtils.hasText(header) && header.startsWith(jwtPrefix + " ")) {
                    String token = header.substring(jwtPrefix.length() + 1);
                    try {
                        Claims claims = Jwts.parserBuilder()
                                .setSigningKey(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8))
                                .build()
                                .parseClaimsJws(token)
                                .getBody();
                        String username = claims.getSubject();
                        if (username != null) {
                            var userDetails = new User(username, "", Collections.emptyList());
                            var auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(auth);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    } catch (Exception e) {
                        // Token invalid - connection allowed but user remains anonymous
                    }
                }
            }
        } else if (StompCommand.SUBSCRIBE.equals(command) || StompCommand.SEND.equals(command)) {
            if (accessor.getUser() == null) {
                String destination = accessor.getDestination();
                if (destination != null && destination.startsWith("/user/")) {
                    return null;
                }
                if (destination != null && destination.startsWith("/app/")) {
                    return null;
                }
            }
        }

        return message;
    }
}
