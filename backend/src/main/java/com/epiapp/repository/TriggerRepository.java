package com.epiapp.repository;

import com.epiapp.model.Trigger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TriggerRepository extends JpaRepository<Trigger, Long> {
    List<Trigger> findBySeizureId(Long seizureId);
    List<Trigger> findByUserId(Long userId);
}
