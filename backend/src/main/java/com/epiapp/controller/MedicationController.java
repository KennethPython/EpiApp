package com.epiapp.controller;

import com.epiapp.model.Medication;
import com.epiapp.repository.MedicationLogRepository;
import com.epiapp.repository.MedicationRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;

    @GetMapping
    public List<Medication> getAll() {
        return medicationRepository.findAll();
    }

    @PostMapping
    public Medication create(@Valid @RequestBody Medication medication) {
        return medicationRepository.save(medication);
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!medicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        medicationLogRepository.deleteByMedicationId(id);
        medicationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
