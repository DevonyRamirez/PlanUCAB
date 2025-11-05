package com.planUcab.planUCAB_backend.logiccontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planUcab.planUCAB_backend.model.Event;
import jakarta.annotation.PostConstruct;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

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

