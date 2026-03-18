package com.epiapp.repository;

import com.epiapp.model.Seizure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeizureRepository extends JpaRepository<Seizure, Long> {
    List<Seizure> findByUserId(Long userId);
}
