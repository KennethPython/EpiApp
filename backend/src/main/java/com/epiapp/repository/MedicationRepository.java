package com.epiapp.repository;

import com.epiapp.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByUserId(Long userId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM medication_times WHERE medication_id = :id", nativeQuery = true)
    void deleteTimesByMedicationId(@Param("id") Long id);
}
