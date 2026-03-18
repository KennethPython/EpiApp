package com.epiapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "medication_logs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"medication_id", "scheduled_time", "date"}))
public class MedicationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "medication_id")
    private Long medicationId;

    @NotBlank
    @Column(name = "scheduled_time")
    private String scheduledTime; // e.g. "09:00"

    @NotNull
    private LocalDate date;

    private LocalDateTime takenAt; // set server-side when taken

    private Long userId;
}
