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
        @Autowired
        public SavingsGoalRepository savingsGoalRepository;

        public List<SavingGoalModel> getAll(){ 
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


        



        
    }
