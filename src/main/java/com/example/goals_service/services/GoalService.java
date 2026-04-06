    package com.example.goals_service.services;

    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.stereotype.Service;

import com.example.goals_service.models.GoalContributation;
import com.example.goals_service.models.SavingGoalModel;
    import com.example.goals_service.repositories.GoalRepositorie;
    import com.example.goals_service.repositories.SavingsGoalRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

    @Service
    public class GoalService {
         @Autowired
        public GoalRepositorie goalRepositorie;
        @Autowired
        public SavingsGoalRepository savingsGoalRepository;

        public List<SavingGoalModel> getAllGoals(){ 
            return savingsGoalRepository.findAll(); 
        }
        public SavingGoalModel getById(Long id){
            return savingsGoalRepository.findById(id).orElse(null); 
        }
         public SavingGoalModel create(SavingGoalModel data) {
        if (data == null) {
            throw new IllegalArgumentException("Goal data cannot be null");
        }
        data.setId(null); 
        return savingsGoalRepository.save(data);
    }

    public SavingGoalModel update(Long id, SavingGoalModel data) {
        SavingGoalModel upG = savingsGoalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Goal not found with id: " + id));

       upG.setUserId(data.getUserId());
       upG.setName(data.getName());
       upG.setTargetAmiount(data.getTargetAmiount());
       upG.setCurrentAmount(data.getCurrentAmount());
       upG.setDeadLine(data.getDeadLine());
       upG.setStatus(data.getStatus());
       upG.setUpdatedAt(data.getUpdatedAt());

        return savingsGoalRepository.save(upG);
    }


        
    
    public List<GoalContributation> getAllContributions() {
        return goalRepositorie.findAll();
    }

    public GoalContributation getByGoalId(Long goalId) {
        return goalRepositorie.findById(goalId).orElse(null);
    }
    public GoalContributation contribute (GoalContributation data){ 
        if(data==null){ 
            throw new IllegalArgumentException("los datos no pueden ser nill"); 

        }
        SavingGoalModel goal = savingsGoalRepository.findById(data.getGoalId()).orElse(null);
        if(goal.getStatus().equals("COMPLETED")){
            throw new RuntimeException("No se puede contribuir a una meta completada");

        }
        goal.setCurrentAmount(goal.getCurrentAmount().add(data.getAmount()));
        if(goal.getCurrentAmount().compareTo(goal.getTargetAmiount()) >= 0 ){
            goal.setStatus("COMPLETED"); 
        }
        goal.setUpdatedAt(LocalDateTime.now());
        savingsGoalRepository.save(goal);
        data.setId(null);
        data.setContributationDate(LocalDate.now());
        data.setCreatedAt(LocalDateTime.now());
        return goalRepositorie.save(data); 

    }
       
}
    


    


