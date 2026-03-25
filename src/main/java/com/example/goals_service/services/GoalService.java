package com.example.goals_service.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.goals_service.models.SavingGoalModel;
import com.example.goals_service.repositories.GoalRepositorie;
import com.example.goals_service.repositories.SavingsGoalRepository;
import java.util.List;

@Service
public class GoalService {
    @Autowired
    public GoalRepositorie goalRepositorie;
    public SavingsGoalRepository savingsGoalRepository;



    public SavingGoalModel save(SavingGoalModel savingGoalModel) {
        return savingsGoalRepository.save(savingGoalModel);
    }
    public List<SavingGoalModel> getAll(){
        return savingsGoalRepository.findAll();
    }

    
}
