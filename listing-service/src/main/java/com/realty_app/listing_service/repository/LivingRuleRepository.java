package com.realty_app.listing_service.repository;

import com.realty_app.listing_service.model.LivingRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LivingRuleRepository extends JpaRepository<LivingRule,Long> {
    List<LivingRule> findAllByIdIn(List<Long> ids);
}
