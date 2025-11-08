package model;

import java.time.LocalDateTime;
import java.util.List;

public class Evaluacion {

    private Long id;
    private Long userId;
    private String titulo;
    private List<MateriaEvaluacion> materias;
    private Double nota; // En base a 20
    private String profesor;
    private String salon;
    private String descripcion;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String colorHex;

    public static class MateriaEvaluacion {
        private String nombre;
        private Double porcentaje;

        public MateriaEvaluacion() {}

        public MateriaEvaluacion(String nombre, Double porcentaje) {
            this.nombre = nombre;
            this.porcentaje = porcentaje;
        }

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

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public List<MateriaEvaluacion> getMaterias() {
        return materias;
    }

    public void setMaterias(List<MateriaEvaluacion> materias) {
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
}

