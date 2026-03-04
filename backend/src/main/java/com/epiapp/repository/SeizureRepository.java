package com.epiapp.repository;

import com.epiapp.model.Seizure;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeizureRepository extends JpaRepository<Seizure, Long> {
}
