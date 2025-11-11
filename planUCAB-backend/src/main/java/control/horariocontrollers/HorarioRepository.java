package control.horariocontrollers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import model.Horario;
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
public class HorarioRepository {

    private final Map<Long, List<Horario>> userIdToHorarios = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    @Lazy
    private MateriaRepository materiaRepository;

    @Value("${horario.storage.path:data/horarios.json}")
    private String storagePath;

    @PostConstruct
    void init() {
        Path path = Paths.get(storagePath);
        try {
            if (Files.notExists(path)) {
                if (path.getParent() != null) {
                    Files.createDirectories(path.getParent());
                }
                objectMapper.writeValue(path.toFile(), new HashMap<Long, List<Horario>>());
            }
            // Leer como JsonNode para poder manejar strings y objetos
            JsonNode rootNode = objectMapper.readTree(path.toFile());
            Map<Long, List<Horario>> loaded = new HashMap<>();
            
            if (rootNode != null && rootNode.isObject()) {
                Iterator<String> fieldNames = rootNode.fieldNames();
                while (fieldNames.hasNext()) {
                    String userIdStr = fieldNames.next();
                    Long userId = Long.parseLong(userIdStr);
                    JsonNode horariosArray = rootNode.get(userIdStr);
                    List<Horario> horarios = new ArrayList<>();
                    
                    if (horariosArray.isArray()) {
                        for (JsonNode horarioNode : horariosArray) {
                            try {
                                // Deserializar manualmente para manejar materia como string u objeto
                                Horario horario = new Horario();
                                if (horarioNode.has("id")) horario.setId(horarioNode.get("id").asLong());
                                if (horarioNode.has("userId")) horario.setUserId(horarioNode.get("userId").asLong());
                                if (horarioNode.has("diaSemana")) horario.setDiaSemana(horarioNode.get("diaSemana").asText());
                                if (horarioNode.has("startTime")) horario.setStartTime(horarioNode.get("startTime").asText());
                                if (horarioNode.has("endTime")) horario.setEndTime(horarioNode.get("endTime").asText());
                                if (horarioNode.has("profesor")) horario.setProfesor(horarioNode.get("profesor").asText());
                                if (horarioNode.has("tipoClase")) horario.setTipoClase(horarioNode.get("tipoClase").asText());
                                // location y colorHex están en Bloque
                                if (horarioNode.has("location")) horario.setLocation(horarioNode.get("location").asText());
                                if (horarioNode.has("colorHex")) horario.setColorHex(horarioNode.get("colorHex").asText());
                                
                                // Manejar materia (puede ser string o objeto)
                                JsonNode materiaNode = horarioNode.get("materia");
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
                                    horario.setMateria(materia);
                                }
                                
                                horarios.add(horario);
                            } catch (Exception e) {
                                // Si falla, continuar con el siguiente
                            }
                        }
                    }
                    loaded.put(userId, horarios);
                }
            }
            
            if (loaded != null && !loaded.isEmpty()) {
                userIdToHorarios.putAll(loaded);
                long maxId = loaded.values().stream()
                        .flatMap(List::stream)
                        .mapToLong(h -> h.getId() == null ? 0L : h.getId())
                        .max().orElse(0L);
                idSequence.set(maxId + 1);
            }
        } catch (IOException e) {
            // Si falla la carga, iniciar con almacenamiento en memoria vacío
        }
    }

    public Horario save(Long userId, Horario horario) {
        horario.setId(idSequence.getAndIncrement());
        horario.setUserId(userId);
        userIdToHorarios.computeIfAbsent(userId, k -> new ArrayList<>()).add(horario);
        persist();
        return horario;
    }

    public List<Horario> findByUserId(Long userId) {
        return userIdToHorarios.containsKey(userId)
                ? Collections.unmodifiableList(userIdToHorarios.get(userId))
                : List.of();
    }

    private synchronized void persist() {
        Path path = Paths.get(storagePath);
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), userIdToHorarios);
        } catch (IOException e) {
            // Ignorar errores de persistencia por ahora
        }
    }
}

