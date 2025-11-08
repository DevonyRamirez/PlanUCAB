package control.evaluacioncontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import model.Evaluacion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class EvaluacionRepository {

    private final Map<Long, List<Evaluacion>> userIdToEvaluaciones = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper;

    public EvaluacionRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Value("${evaluacion.storage.path:data/evaluaciones.json}")
    private String storagePath;

    @PostConstruct
    void init() {
        Path path = Paths.get(storagePath);
        try {
            if (Files.notExists(path)) {
                if (path.getParent() != null) {
                    Files.createDirectories(path.getParent());
                }
                objectMapper.writeValue(path.toFile(), new HashMap<Long, List<Evaluacion>>());
            }
            Map<Long, List<Evaluacion>> loaded = objectMapper.readValue(
                    path.toFile(), new TypeReference<Map<Long, List<Evaluacion>>>() {}
            );
            if (loaded != null) {
                userIdToEvaluaciones.putAll(loaded);
                long maxId = loaded.values().stream()
                        .flatMap(List::stream)
                        .mapToLong(e -> e.getId() == null ? 0L : e.getId())
                        .max().orElse(0L);
                idSequence.set(maxId + 1);
            }
        } catch (IOException e) {
            // Si falla la carga, iniciar con almacenamiento en memoria vacío
        }
    }

    public Evaluacion save(Long userId, Evaluacion evaluacion) {
        evaluacion.setId(idSequence.getAndIncrement());
        evaluacion.setUserId(userId);
        userIdToEvaluaciones.computeIfAbsent(userId, k -> new ArrayList<>()).add(evaluacion);
        persist();
        return evaluacion;
    }

    public List<Evaluacion> findByUserId(Long userId) {
        return userIdToEvaluaciones.containsKey(userId)
                ? Collections.unmodifiableList(userIdToEvaluaciones.get(userId))
                : List.of();
    }

    private synchronized void persist() {
        Path path = Paths.get(storagePath);
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), userIdToEvaluaciones);
        } catch (IOException e) {
            // Ignorar errores de persistencia por ahora; se podría agregar logging
        }
    }
}

