package com.epiapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "seizures")
public class Seizure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDateTime dateTime;

    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    private SeizureType type;

    @Column(length = 1000)
    private String notes;

    // Reserved for future user authentication
    private String userId;
}
