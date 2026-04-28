package com.example.goals_service.repositories;
import com.example.goals_service.models.GoalContributationModel;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepositorie  extends JpaRepository<GoalContributationModel, Long> {
}
