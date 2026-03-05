package com.epiapp.repository;

import com.epiapp.model.CustomTriggerOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomTriggerOptionRepository extends JpaRepository<CustomTriggerOption, Long> {
    Optional<CustomTriggerOption> findByLabelIgnoreCase(String label);
    boolean existsByLabelIgnoreCase(String label);
}
