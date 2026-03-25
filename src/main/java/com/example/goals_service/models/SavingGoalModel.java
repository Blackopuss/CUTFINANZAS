package com.example.goals_service.models;


import java.time.LocalDate;
import java.time.LocalDateTime;

import java.math.BigDecimal;




import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "savings_goals")
public class SavingGoalModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long id;

    @Column(name = "user_id")
    private Long userId;
    
    private String name; 
    @Column(name = "target_amount")
    private BigDecimal targetAmiount;
    @Column(name = "current_amount")
    private BigDecimal currentAmount;
    @Column(name = "dead_line") 
    private LocalDate deadLine; 
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private  LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SavingGoalModel(Long id, Long userId, String name, BigDecimal targetAmiount, BigDecimal currentAmount, LocalDate deadLine, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.targetAmiount = targetAmiount;
        this.currentAmount = currentAmount;
        this.deadLine = deadLine;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    public SavingGoalModel() {
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public BigDecimal getTargetAmiount() {
        return targetAmiount;
    }
    public void setTargetAmiount(BigDecimal targetAmiount) {
        this.targetAmiount = targetAmiount;
    }
    public BigDecimal getCurrentAmount() {
        return currentAmount;
    }
    public void setCurrentAmount(BigDecimal currentAmount) {
        this.currentAmount = currentAmount;
    }
    public LocalDate getDeadLine() {
        return deadLine;
    }

    public void setDeadLine(LocalDate deadLine) {
        this.deadLine = deadLine;
    }
    public String getStatus() {
        return status;    
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

  
    
}


