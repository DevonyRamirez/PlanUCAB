package com.planUcab.planUCAB_backend.logiccontrollers;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateEvaluationRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String classroom;

    @NotBlank
    private String subject ;

    @NotBlank
    // Formato esperado: YYYY-MM-DD
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "date must be in format YYYY-MM-DD")
    private String date;

    @NotBlank
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "startTime must be HH:mm (24h)")
    private String startTime;

    @NotBlank
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "endTime must be HH:mm (24h)")
    private String endTime;

    @NotNull
    // Color hexadecimal como #RRGGBB
    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "color must be in hex #RRGGBB")
    private String colorHex;

    
    private String description;

    @NotBlank
    private Double porcentageWeight;

    public String getSubject() {
        return subject;
    }
    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }
    
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getClassroom() {
        return classroom;
    }
    public void setClassroom(String classroom) {
        this.classroom = classroom;
    }
    public String getDate() {
        return date;
    }
    public void setDate(String date) {
        this.date = date;
    }
    public String getStartTime() {
        return startTime;
    }
    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }
    public String getEndTime() {
        return endTime;
    }
    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public Double getPorcentageWeight() {
        return porcentageWeight;
    }
    public void setPorcentageWeight(Double porcentageWeight) {
        this.porcentageWeight = porcentageWeight;
    }

}
