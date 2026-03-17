package com.epiapp.controller;

import com.epiapp.model.MedicationLog;
import com.epiapp.repository.MedicationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medication-logs")
@RequiredArgsConstructor
public class MedicationLogController {

    private final MedicationLogRepository medicationLogRepository;

    @GetMapping
    public List<MedicationLog> getLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String yearMonth) {
        if (date != null) {
            return medicationLogRepository.findByDate(date);
        } else if (yearMonth != null) {
            String[] parts = yearMonth.split("-");
            LocalDate start = LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            return medicationLogRepository.findByDateBetween(start, end);
        }
        return medicationLogRepository.findAll();
    }

    @PostMapping
    public MedicationLog markTaken(@RequestBody Map<String, String> body) {
        MedicationLog log = new MedicationLog();
        log.setMedicationId(Long.parseLong(body.get("medicationId")));
        log.setScheduledTime(body.get("scheduledTime"));
        log.setDate(LocalDate.parse(body.get("date")));
        log.setTakenAt(LocalDateTime.now());
        return medicationLogRepository.save(log);
    }
}
