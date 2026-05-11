package com.realty_app.listing_service.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "districts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_district_city_name", columnNames = {"city_id", "name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class District {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(name = "name", nullable = false)
    private String name;
}
