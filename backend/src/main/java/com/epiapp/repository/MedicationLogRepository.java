package com.epiapp.repository;

import com.epiapp.model.MedicationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MedicationLogRepository extends JpaRepository<MedicationLog, Long> {
    List<MedicationLog> findByDate(LocalDate date);
    List<MedicationLog> findByDateBetween(LocalDate start, LocalDate end);
    void deleteByMedicationId(Long medicationId);
}
