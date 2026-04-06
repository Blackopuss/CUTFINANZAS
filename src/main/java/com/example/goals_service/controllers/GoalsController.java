package com.example.goals_service.controllers;
import org.aspectj.internal.lang.annotation.ajcDeclareAnnotation;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Controller;

import com.example.goals_service.services.GoalService;

@Controller
public class GoalsController {
    @autowired
    public GoalService goalService;

    

 
    
    
}
