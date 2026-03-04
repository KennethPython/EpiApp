package com.epiapp.controller;

import com.epiapp.model.Trigger;
import com.epiapp.repository.TriggerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/triggers")
@RequiredArgsConstructor
public class TriggerController {

    private final TriggerRepository triggerRepository;

    @GetMapping
    public List<Trigger> getAll() {
        return triggerRepository.findAll();
    }

    @PostMapping
    public Trigger create(@Valid @RequestBody Trigger trigger) {
        return triggerRepository.save(trigger);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!triggerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        triggerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
