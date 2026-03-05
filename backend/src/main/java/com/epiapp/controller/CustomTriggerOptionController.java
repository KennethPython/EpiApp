package com.epiapp.controller;

import com.epiapp.model.CustomTriggerOption;
import com.epiapp.repository.CustomTriggerOptionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/custom-trigger-options")
@RequiredArgsConstructor
public class CustomTriggerOptionController {

    private final CustomTriggerOptionRepository repository;

    @GetMapping
    public List<CustomTriggerOption> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<CustomTriggerOption> create(@Valid @RequestBody CustomTriggerOption option) {
        if (repository.existsByLabelIgnoreCase(option.getLabel())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        return ResponseEntity.ok(repository.save(option));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
