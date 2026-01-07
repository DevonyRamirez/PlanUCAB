package control.materiacontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import model.Materia;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Repository
public class MateriaRepository {

    private final List<Materia> materias = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String storagePath = "data/materias.json";

    @PostConstruct
    void init() {
        Path path = Paths.get(storagePath);
        try {
            if (Files.notExists(path)) {
                if (path.getParent() != null) {
                    Files.createDirectories(path.getParent());
                }
                // Inicializar con materias por defecto
                initializeDefaultMaterias();
                persist();
            } else {
                List<Materia> loaded = objectMapper.readValue(
                        path.toFile(), new TypeReference<List<Materia>>() {}
                );
                if (loaded != null && !loaded.isEmpty()) {
                    materias.addAll(loaded);
                } else {
                    // Si el archivo está vacío, inicializar con materias por defecto
                    initializeDefaultMaterias();
                    persist();
                }
            }
        } catch (IOException e) {
            // Si falla la carga, inicializar con materias por defecto
            initializeDefaultMaterias();
        }
    }

    private void initializeDefaultMaterias() {
        materias.clear();
        materias.add(new Materia(1L, "Ingeniería de Software", "4to Semestre", 5));
        materias.add(new Materia(2L, "Programación Orientada a la Web", "4to Semestre", 4));
        materias.add(new Materia(3L, "Organización del Computador", "4to Semestre", 4));
        materias.add(new Materia(4L, "Interacción Humano - Computador", "4to Semestre", 3));
        materias.add(new Materia(5L, "Cálculo Vectorial", "4to Semestre", 4));
        materias.add(new Materia(6L, "Ingeniería Económica", "4to Semestre", 3));
        materias.add(new Materia(7L, "Ecuaciones Diferenciales Ordinarias", "4to Semestre", 4));
    }

    public List<Materia> findAll() {
        return Collections.unmodifiableList(new ArrayList<>(materias));
    }

    private synchronized void persist() {
        Path path = Paths.get(storagePath);
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), materias);
        } catch (IOException e) {
            // Ignorar errores de persistencia por ahora
        }
    }
}

