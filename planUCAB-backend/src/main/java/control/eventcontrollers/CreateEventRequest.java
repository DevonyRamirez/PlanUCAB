package control.eventcontrollers;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateEventRequest {

    @NotBlank
    private String name;

    private String location;

    @NotBlank
    // Formato esperado: YYYY-MM-DD
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "la fecha debe estar en el formato aaaa-mm-dd")
    private String date;

    @NotBlank
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "la hora de inicio debe estar en el formato hh:mm (formato militar)")
    private String startTime;

    @NotBlank
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "la hora de fin debe estar en el formato hh:mm (formato militar)")
    private String endTime;

    private String description;

    @NotNull
    // Color hexadecimal como #RRGGBB
    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "El color debe estar en hexadecimal #RRGGBB")
    private String colorHex;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }
}

