package com.epiapp.controller;

import com.epiapp.model.MedicationLog;
import com.epiapp.model.User;
import com.epiapp.repository.MedicationLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/medication-logs")
public class MedicationLogController {

    private final MedicationLogRepository medicationLogRepository;

    public MedicationLogController(MedicationLogRepository medicationLogRepository) {
        this.medicationLogRepository = medicationLogRepository;
    }

    @GetMapping
    public List<MedicationLog> getLogs(@RequestParam(required = false) String date,
                                       @RequestParam(required = false) String yearMonth,
                                       @AuthenticationPrincipal User currentUser) {
        Long userId = currentUser.getId();
        if (date != null) {
            LocalDate d = LocalDate.parse(date);
            return medicationLogRepository.findByUserIdAndDate(userId, d);
        } else if (yearMonth != null) {
            YearMonth ym = YearMonth.parse(yearMonth, DateTimeFormatter.ofPattern("yyyy-MM"));
            return medicationLogRepository.findByUserIdAndDateBetween(userId, ym.atDay(1), ym.atEndOfMonth());
        }
        return medicationLogRepository.findByUserId(userId);
    }

    @PostMapping
    public MedicationLog markTaken(@RequestBody MedicationLog log, @AuthenticationPrincipal User currentUser) {
        log.setUserId(currentUser.getId());
        log.setTakenAt(java.time.LocalDateTime.now());
        return medicationLogRepository.save(log);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> untake(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        medicationLogRepository.findById(id).ifPresent(log -> {
            if (log.getUserId().equals(currentUser.getId())) {
                medicationLogRepository.deleteById(id);
            }
        });
        return ResponseEntity.noContent().build();
    }
}
