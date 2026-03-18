package com.epiapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "medications")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String dosage;

    @ElementCollection
    @CollectionTable(name = "medication_times", joinColumns = @JoinColumn(name = "medication_id"))
    @Column(name = "scheduled_time")
    private List<String> times = new ArrayList<>();

    private Long userId;

    private LocalDate startDate;
}
