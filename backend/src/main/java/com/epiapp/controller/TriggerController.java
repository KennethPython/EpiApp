package com.epiapp.controller;

import com.epiapp.model.Trigger;
import com.epiapp.model.User;
import com.epiapp.repository.TriggerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/triggers")
public class TriggerController {

    private final TriggerRepository triggerRepository;

    public TriggerController(TriggerRepository triggerRepository) {
        this.triggerRepository = triggerRepository;
    }

    @GetMapping
    public List<Trigger> getAll(@AuthenticationPrincipal User currentUser) {
        return triggerRepository.findByUserId(currentUser.getId());
    }

    @PostMapping
    public Trigger create(@RequestBody Trigger trigger, @AuthenticationPrincipal User currentUser) {
        trigger.setUserId(currentUser.getId());
        return triggerRepository.save(trigger);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        triggerRepository.findById(id).ifPresent(t -> {
            if (t.getUserId().equals(currentUser.getId())) {
                triggerRepository.deleteById(id);
            }
        });
        return ResponseEntity.noContent().build();
    }
}
