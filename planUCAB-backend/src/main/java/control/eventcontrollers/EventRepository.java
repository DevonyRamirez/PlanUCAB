package control.eventcontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import model.Event;
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
public class EventRepository {

    private final Map<Long, List<Event>> userIdToEvents = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper;

    public EventRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Value("${event.storage.path:data/eventos.json}")
    private String storagePath;

    @PostConstruct
    void init() {
        Path path = Paths.get(storagePath);
        try {
            if (Files.notExists(path)) {
                if (path.getParent() != null) {
                    Files.createDirectories(path.getParent());
                }
                // Inicializar mapa vacío {}
                objectMapper.writeValue(path.toFile(), new HashMap<Long, List<Event>>());
            }
            Map<Long, List<Event>> loaded = objectMapper.readValue(
                    path.toFile(), new TypeReference<Map<Long, List<Event>>>() {}
            );
            if (loaded != null) {
                userIdToEvents.putAll(loaded);
                // Reconstruir secuencia de ID máximo
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

    public Event save(Long userId, Event event) {
        event.setId(idSequence.getAndIncrement());
        event.setUserId(userId);
        userIdToEvents.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);
        persist();
        return event;
    }

    public List<Event> findByUserId(Long userId) {
        return userIdToEvents.containsKey(userId)
                ? Collections.unmodifiableList(userIdToEvents.get(userId))
                : List.of();
    }

    public Event findById(Long userId, Long eventId) {
        List<Event> eventos = userIdToEvents.get(userId);
        if (eventos == null) {
            return null;
        }
        return eventos.stream()
                .filter(e -> e.getId() != null && e.getId().equals(eventId))
                .findFirst()
                .orElse(null);
    }

    public Event update(Long userId, Long eventId, Event updatedEvent) {
        List<Event> eventos = userIdToEvents.get(userId);
        if (eventos == null) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        int index = -1;
        for (int i = 0; i < eventos.size(); i++) {
            if (eventos.get(i).getId() != null && eventos.get(i).getId().equals(eventId)) {
                index = i;
                break;
            }
        }
        
        if (index == -1) {
            throw new IllegalArgumentException("Evento no encontrado");
        }
        
        updatedEvent.setId(eventId);
        updatedEvent.setUserId(userId);
        eventos.set(index, updatedEvent);
        persist();
        return updatedEvent;
    }

    private synchronized void persist() {
        Path path = Paths.get(storagePath);
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), userIdToEvents);
        } catch (IOException e) {
            // Ignorar errores de persistencia por ahora; se podría agregar logging
        }
    }
}

