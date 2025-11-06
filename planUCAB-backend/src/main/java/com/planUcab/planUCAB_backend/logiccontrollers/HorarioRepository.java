package com.planUcab.planUCAB_backend.logiccontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import com.planUcab.planUCAB_backend.model.Horario;
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
public class HorarioRepository {

    private final Map<Long, List<Horario>> userIdToHorarios = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);
    private final ObjectMapper objectMapper = new ObjectMapper();

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
            Map<Long, List<Horario>> loaded = objectMapper.readValue(
                    path.toFile(), new TypeReference<Map<Long, List<Horario>>>() {}
            );
            if (loaded != null) {
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

