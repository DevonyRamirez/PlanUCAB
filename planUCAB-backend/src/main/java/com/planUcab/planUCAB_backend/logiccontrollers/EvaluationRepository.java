package com.planUcab.planUCAB_backend.logiccontrollers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;

import com.planUcab.planUCAB_backend.model.Evaluation;
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
public class EvaluationRepository {

    private final Map<Long, List<Evaluation>> userIdToEvaluations = new ConcurrentHashMap<>();
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
                objectMapper.writeValue(path.toFile(), new HashMap<Long, List<Evaluation>>());
            }
            Map<Long, List<Evaluation>> loaded = objectMapper.readValue(
                    path.toFile(), new TypeReference<Map<Long, List<Evaluation>>>() {}
            );
            if (loaded != null) {
                userIdToEvaluations.putAll(loaded);
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
    public Evaluation save(Long userId, Evaluation evaluation) {
        if (evaluation.getId() == null) {
            evaluation.setId(idSequence.getAndIncrement());
        }
        userIdToEvaluations.computeIfAbsent(userId, k -> new ArrayList<>()).add(evaluation);
        persist();
        return evaluation;
    }
    public List<Evaluation> findByUserId(Long userId) {
        return Collections.unmodifiableList(
                userIdToEvaluations.getOrDefault(userId, Collections.emptyList())
                        .stream()
                        .map(e -> (Evaluation) e)
                        .toList()
        );
    }
    private void persist() {
        Path path = Paths.get(storagePath);
        try {
            objectMapper.writeValue(path.toFile(), userIdToEvaluations);
        } catch (IOException e) {
            // Manejar error de persistencia si es necesario
        }
    }

    public Evaluation update(Long userId, Long evaluationId, Evaluation updated) {
        List<Evaluation> list = userIdToEvaluations.get(userId);
        if (list == null) {
            throw new com.planUcab.planUCAB_backend.exceptions.EvaluationException("Evaluation not found for user: " + userId);
        }
        for (int i = 0; i < list.size(); i++) {
            Evaluation existing = list.get(i);
            if (existing.getId() != null && existing.getId().equals(evaluationId)) {
                updated.setId(evaluationId);
                updated.setUserId(userId);
                list.set(i, updated);
                persist();
                return updated;
            }
        }
        throw new com.planUcab.planUCAB_backend.exceptions.EvaluationException("Evaluation not found: " + evaluationId);
    }

    public void delete(Long userId, Long evaluationId) {
        List<Evaluation> list = userIdToEvaluations.get(userId);
        if (list == null) {
            throw new com.planUcab.planUCAB_backend.exceptions.EvaluationException("Evaluation not found for user: " + userId);
        }
        boolean removed = list.removeIf(e -> e.getId() != null && e.getId().equals(evaluationId));
        if (!removed) {
            throw new com.planUcab.planUCAB_backend.exceptions.EvaluationException("Evaluation not found: " + evaluationId);
        }
        persist();
    }

    

}
