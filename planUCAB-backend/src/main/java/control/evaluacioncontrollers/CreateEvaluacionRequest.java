package control.evaluacioncontrollers;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public class CreateEvaluacionRequest {

    @NotBlank(message = "El título es requerido")
    @Size(max = 100, message = "El título no puede tener más de 100 caracteres")
    private String titulo;

    @NotNull(message = "Las materias son requeridas")
    @NotEmpty(message = "Debe tener al menos una materia")
    @Valid
    private List<MateriaRequest> materias;

    @NotNull(message = "La nota es requerida")
    @DecimalMin(value = "0.0", message = "La nota debe ser mayor o igual a 0")
    @DecimalMax(value = "20.0", message = "La nota debe ser menor o igual a 20")
    private Double nota;

    @NotBlank(message = "El profesor es requerido")
    @Size(max = 100, message = "El profesor no puede tener más de 100 caracteres")
    private String profesor;

    @NotBlank(message = "El salón es requerido")
    @Size(max = 50, message = "El salón no puede tener más de 50 caracteres")
    private String salon;

    private String descripcion;

    @NotBlank(message = "La fecha es requerida")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "La fecha debe estar en formato YYYY-MM-DD")
    private String date;

    @NotBlank(message = "La hora de inicio es requerida")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de inicio debe estar en formato HH:mm (24h)")
    private String startTime;

    @NotBlank(message = "La hora de fin es requerida")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "La hora de fin debe estar en formato HH:mm (24h)")
    private String endTime;

    @NotBlank(message = "El color es requerido")
    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "El color debe estar en formato hexadecimal (#RRGGBB)")
    private String colorHex;

    public static class MateriaRequest {
        @NotBlank(message = "El nombre de la materia es requerido")
        private String nombre;

        @NotNull(message = "El porcentaje es requerido")
        @DecimalMin(value = "0.0", message = "El porcentaje debe ser mayor o igual a 0")
        @DecimalMax(value = "100.0", message = "El porcentaje debe ser menor o igual a 100")
        private Double porcentaje;

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
        }

        public Double getPorcentaje() {
            return porcentaje;
        }

        public void setPorcentaje(Double porcentaje) {
            this.porcentaje = porcentaje;
        }
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public List<MateriaRequest> getMaterias() {
        return materias;
    }

    public void setMaterias(List<MateriaRequest> materias) {
        this.materias = materias;
    }

    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }

    public String getProfesor() {
        return profesor;
    }

    public void setProfesor(String profesor) {
        this.profesor = profesor;
    }

    public String getSalon() {
        return salon;
    }

    public void setSalon(String salon) {
        this.salon = salon;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
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

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
    }
}

