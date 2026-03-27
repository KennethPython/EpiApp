package com.epiapp.controller;

import com.epiapp.model.Medication;
import com.epiapp.model.User;
import com.epiapp.repository.MedicationLogRepository;
import com.epiapp.repository.MedicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    private static final Logger log = LoggerFactory.getLogger(MedicationController.class);

    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;

    public MedicationController(MedicationRepository medicationRepository,
                                MedicationLogRepository medicationLogRepository) {
        this.medicationRepository = medicationRepository;
        this.medicationLogRepository = medicationLogRepository;
    }

    @GetMapping
    public List<Medication> getAll(@AuthenticationPrincipal User currentUser) {
        return medicationRepository.findByUserId(currentUser.getId());
    }

    @PostMapping
    public Medication create(@RequestBody Medication medication, @AuthenticationPrincipal User currentUser) {
        medication.setUserId(currentUser.getId());
        if (medication.getStartDate() == null) {
            medication.setStartDate(LocalDate.now());
        }
        return medicationRepository.save(medication);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medication> update(@PathVariable Long id,
                                             @RequestBody Medication updated,
                                             @AuthenticationPrincipal User currentUser) {
        return medicationRepository.findById(id)
                .filter(m -> m.getUserId().equals(currentUser.getId()))
                .map(m -> {
                    m.setName(updated.getName());
                    m.setDosage(updated.getDosage());
                    m.setTimes(updated.getTimes());
                    return ResponseEntity.ok(medicationRepository.save(m));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("DELETE /api/medications/{} | auth={} | principal={} | currentUser={}",
                id,
                auth != null ? auth.getClass().getSimpleName() : "null",
                auth != null ? auth.getPrincipal() : "null",
                currentUser);
        if (currentUser == null) {
            log.warn("currentUser is null for DELETE /api/medications/{}", id);
            return ResponseEntity.status(403).build();
        }
        medicationRepository.findById(id).ifPresent(m -> {
            if (m.getUserId().equals(currentUser.getId())) {
                log.info("Deleting medication {} for user {}", id, currentUser.getId());
                medicationLogRepository.deleteByMedicationId(id);
                medicationRepository.deleteTimesByMedicationId(id);
                medicationRepository.deleteById(id);
            } else {
                log.warn("User {} does not own medication {}", currentUser.getId(), id);
            }
        });
        return ResponseEntity.noContent().build();
    }
}
