

 package com.example.goals_service.models;
 import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;


@Table(name = "goal_contributation")
@Entity
public class GoalContributation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    @Column(name = "goal_id")
    private Long goalId; 

    @Column(name = "user_id")
    private Long userId; 

    private BigDecimal amount;
    @Column(name = "contributation_date")
    private LocalDate ContributationDate;

    @Column(name = "created_at") 
    private  LocalDateTime   createdAt;


    public GoalContributation(Long id, Long goalId, Long userId, BigDecimal amount, LocalDate contributationDate, LocalDateTime createdAt) {
        this.id = id;
        this.goalId = goalId;
        this.userId = userId;
        this.amount = amount;
        this.ContributationDate = contributationDate;
        this.createdAt = createdAt;
    }

    public GoalContributation() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGoalId() {
        return goalId;
    }

    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }    

    public LocalDate getContributationDate() {
        return ContributationDate;
    }

    public void setContributationDate(LocalDate contributationDate) {
        this.ContributationDate = contributationDate;
    }    

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    
}