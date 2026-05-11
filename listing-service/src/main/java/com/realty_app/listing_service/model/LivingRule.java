package com.realty_app.listing_service.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "living_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LivingRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;
}
