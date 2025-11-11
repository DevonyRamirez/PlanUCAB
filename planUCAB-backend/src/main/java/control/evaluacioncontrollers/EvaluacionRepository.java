package control.evaluacioncontrollers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import model.Evaluacion;
import model.Materia;
import control.materiacontrollers.MateriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class EvaluacionRepository {

    private final Map<Long, List<Evaluacion>> userIdToEvaluaciones = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper;
    
    @Autowired
    @Lazy
    private MateriaRepository materiaRepository;

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
            // Leer como JsonNode para poder manejar strings y objetos
            JsonNode rootNode = objectMapper.readTree(path.toFile());
            Map<Long, List<Evaluacion>> loaded = new HashMap<>();
            
            if (rootNode != null && rootNode.isObject()) {
                Iterator<String> fieldNames = rootNode.fieldNames();
                while (fieldNames.hasNext()) {
                    String userIdStr = fieldNames.next();
                    Long userId = Long.parseLong(userIdStr);
                    JsonNode evaluacionesArray = rootNode.get(userIdStr);
                    List<Evaluacion> evaluaciones = new ArrayList<>();
                    
                    if (evaluacionesArray.isArray()) {
                        for (JsonNode evaluacionNode : evaluacionesArray) {
                            try {
                                // Deserializar manualmente para manejar materia como string u objeto
                                Evaluacion evaluacion = new Evaluacion();
                                if (evaluacionNode.has("id")) evaluacion.setId(evaluacionNode.get("id").asLong());
                                if (evaluacionNode.has("userId")) evaluacion.setUserId(evaluacionNode.get("userId").asLong());
                                if (evaluacionNode.has("titulo")) evaluacion.setTitulo(evaluacionNode.get("titulo").asText());
                                if (evaluacionNode.has("porcentaje")) evaluacion.setPorcentaje(evaluacionNode.get("porcentaje").asDouble());
                                if (evaluacionNode.has("nota")) evaluacion.setNota(evaluacionNode.get("nota").asDouble());
                                if (evaluacionNode.has("profesor")) evaluacion.setProfesor(evaluacionNode.get("profesor").asText());
                                if (evaluacionNode.has("location")) evaluacion.setLocation(evaluacionNode.get("location").asText());
                                if (evaluacionNode.has("descripcion")) evaluacion.setDescripcion(evaluacionNode.get("descripcion").asText());
                                if (evaluacionNode.has("colorHex")) evaluacion.setColorHex(evaluacionNode.get("colorHex").asText());
                                
                                // Manejar fechas
                                if (evaluacionNode.has("startDateTime")) {
                                    evaluacion.setStartDateTime(
                                        java.time.LocalDateTime.parse(evaluacionNode.get("startDateTime").asText())
                                    );
                                }
                                if (evaluacionNode.has("endDateTime")) {
                                    evaluacion.setEndDateTime(
                                        java.time.LocalDateTime.parse(evaluacionNode.get("endDateTime").asText())
                                    );
                                }
                                
                                // Manejar materia (puede ser string o objeto)
                                JsonNode materiaNode = evaluacionNode.get("materia");
                                if (materiaNode != null) {
                                    Materia materia;
                                    if (materiaNode.isTextual()) {
                                        // Es un string, convertir a objeto Materia
                                        String nombreMateria = materiaNode.asText();
                                        if (materiaRepository != null) {
                                            materia = materiaRepository.findAll().stream()
                                                    .filter(m -> nombreMateria.equals(m.getNombre()))
                                                    .findFirst()
                                                    .orElse(new Materia(null, nombreMateria, "", 0));
                                        } else {
                                            materia = new Materia(null, nombreMateria, "", 0);
                                        }
                                    } else if (materiaNode.isObject()) {
                                        // Ya es un objeto Materia
                                        materia = objectMapper.treeToValue(materiaNode, Materia.class);
                                    } else {
                                        materia = null;
                                    }
                                    evaluacion.setMateria(materia);
                                }
                                
                                evaluaciones.add(evaluacion);
                            } catch (Exception e) {
                                // Si falla, continuar con el siguiente
                            }
                        }
                    }
                    loaded.put(userId, evaluaciones);
                }
            }
            
            if (loaded != null && !loaded.isEmpty()) {
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

