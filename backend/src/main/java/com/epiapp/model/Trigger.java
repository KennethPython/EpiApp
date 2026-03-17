package com.epiapp.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "triggers")
public class Trigger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDate date;

    @NotNull
    @Enumerated(EnumType.STRING)
    private TriggerType type;

    // Used when type is OTHER to store a custom label
    private String label;

    // Optional link to the seizure this trigger is associated with
    private Long seizureId;

    // Reserved for future user authentication
    private String userId;
}
