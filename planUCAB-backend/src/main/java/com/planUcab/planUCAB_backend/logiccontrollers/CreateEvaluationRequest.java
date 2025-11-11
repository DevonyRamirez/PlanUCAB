package com.planUcab.planUCAB_backend.logiccontrollers;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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

    @NotNull
    @DecimalMin(value = "0.0", message = "porcentageWeight must be >= 0")
    @DecimalMax(value = "100.0", message = "porcentageWeight must be <= 100")
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

    @AssertTrue(message = "endTime must be after startTime")
    public boolean isEndAfterStart() {
        if (this.startTime == null || this.endTime == null) return true;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        try {
            LocalTime s = LocalTime.parse(this.startTime, fmt);
            LocalTime e = LocalTime.parse(this.endTime, fmt);
            return e.isAfter(s);
        } catch (DateTimeParseException ex) {
            // If parsing fails, let other @Pattern validations handle format errors
            return true;
        }
    }

}
