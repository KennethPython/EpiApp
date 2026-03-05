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
    public List<MedicationLog> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return medicationLogRepository.findByDate(date);
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
