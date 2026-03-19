package com.epiapp.controller;

import com.epiapp.model.Seizure;
import com.epiapp.model.User;
import com.epiapp.repository.SeizureRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seizures")
public class SeizureController {

    private final SeizureRepository seizureRepository;

    public SeizureController(SeizureRepository seizureRepository) {
        this.seizureRepository = seizureRepository;
    }

    @GetMapping
    public List<Seizure> getAll(@AuthenticationPrincipal User currentUser) {
        return seizureRepository.findByUserId(currentUser.getId());
    }

    @PostMapping
    public Seizure create(@RequestBody Seizure seizure, @AuthenticationPrincipal User currentUser) {
        seizure.setUserId(currentUser.getId());
        return seizureRepository.save(seizure);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Seizure> update(@PathVariable Long id,
                                          @RequestBody Seizure updated,
                                          @AuthenticationPrincipal User currentUser) {
        return seizureRepository.findById(id)
                .filter(s -> s.getUserId().equals(currentUser.getId()))
                .map(s -> {
                    s.setDateTime(updated.getDateTime());
                    s.setDurationMinutes(updated.getDurationMinutes());
                    s.setType(updated.getType());
                    s.setNotes(updated.getNotes());
                    return ResponseEntity.ok(seizureRepository.save(s));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        seizureRepository.findById(id).ifPresent(s -> {
            if (s.getUserId().equals(currentUser.getId())) {
                seizureRepository.deleteById(id);
            }
        });
        return ResponseEntity.noContent().build();
    }
}
