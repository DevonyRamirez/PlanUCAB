package com.planUcab.planUCAB_backend.model;

import java.time.LocalDateTime;

public class Evaluation {
    
    private Long id;
    private Long userId;
    private String name;
    private String subject;
    private String classroom;
    private String description;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String colorHex;
    private Double porcentageWeight;

    // Getters and Setters
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
    public String getSubject() {
        return subject;
    }
    public void setSubject(String subject) {
        this.subject = subject;
    }
    public String getClassroom() {
        return classroom;
    }
    public void setClassroom(String classroom) {
        this.classroom = classroom;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }
    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }
    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }
    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }
    public String getColorHex() {
        return colorHex;
    }
    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }
    public Double getPorcentageWeight() {
        return porcentageWeight;
    }
    public void setPorcentageWeight(Double porcentageWeight) {
        this.porcentageWeight = porcentageWeight;
    }



}
