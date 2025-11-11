package model;

public class Materia {
    private Long id;
    private String nombre;
    private String semestre;
    private Integer uc; // Unidades de Crédito

    public Materia() {}

    public Materia(Long id, String nombre, String semestre, Integer uc) {
        this.id = id;
        this.nombre = nombre;
        this.semestre = semestre;
        this.uc = uc;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSemestre() {
        return semestre;
    }

    public void setSemestre(String semestre) {
        this.semestre = semestre;
    }

    public Integer getUc() {
        return uc;
    }

    public void setUc(Integer uc) {
        this.uc = uc;
    }
}

