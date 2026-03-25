package com.example.goals_service.repositories;
import com.example.goals_service.models.GoalContributation;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepositorie  extends JpaRepository<GoalContributation, Long> {
}
