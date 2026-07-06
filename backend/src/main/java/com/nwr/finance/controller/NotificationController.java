package com.nwr.finance.controller;

import com.nwr.finance.dto.NotificationDTO;
import com.nwr.finance.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @RequestHeader(value = "X-Username") String username) {
        return ResponseEntity.ok(notificationService.getUserNotifications(username));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @RequestHeader(value = "X-Username") String username) {
        notificationService.markAsRead(id, username);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader(value = "X-Username") String username) {
        notificationService.markAllAsRead(username);
        return ResponseEntity.noContent().build();
    }
}
