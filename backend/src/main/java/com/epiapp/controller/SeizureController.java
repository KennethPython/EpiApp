package com.epiapp.controller;

import com.epiapp.model.Seizure;
import com.epiapp.repository.SeizureRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seizures")
@RequiredArgsConstructor
public class SeizureController {

    private final SeizureRepository seizureRepository;

    @GetMapping
    public List<Seizure> getAll() {
        return seizureRepository.findAll();
    }

    @PostMapping
    public Seizure create(@Valid @RequestBody Seizure seizure) {
        return seizureRepository.save(seizure);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!seizureRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        seizureRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
