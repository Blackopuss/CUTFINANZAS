package com.example.goals_service.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import com.example.goals_service.models.GoalContributationModel;
import com.example.goals_service.models.SavingGoalModel;
import com.example.goals_service.services.GoalService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;








@RestController
@RequestMapping("/goals")
public class GoalsController {
    @Autowired
    public GoalService goalService;
    //savings goals
    @GetMapping
    public List<SavingGoalModel> getAll() {
        return goalService.getAllGoals();
    }
    @GetMapping("/{id}")
    public SavingGoalModel getById(@PathVariable Long id) {
        return goalService.getById(id);    }
    
    @PostMapping
    public SavingGoalModel post(@RequestBody SavingGoalModel data) {
        
        
        return goalService.create(data); 
    }
    //esta en duda porque no se si lo tendria que hacer solo las aportaciones de metas 
    @PutMapping("/{id}")
    public SavingGoalModel put(@PathVariable Long id, @RequestBody SavingGoalModel data) {
        
        
        return goalService.update(id, data); 
    }
    @DeleteMapping("/{id}")
    public  void delete(@PathVariable Long id) {
       goalService.delete(id); 
    }
   

    @PutMapping("/{id}/contribute")
    public GoalContributationModel putContribue(@PathVariable Long id, @RequestBody GoalContributationModel data ) {
        
        
        return goalService.contribute(data);
    }

    

    

 
    
    
}
