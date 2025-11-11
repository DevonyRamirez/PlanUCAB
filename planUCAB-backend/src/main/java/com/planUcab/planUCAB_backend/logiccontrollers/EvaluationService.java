package com.planUcab.planUCAB_backend.logiccontrollers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.planUcab.planUCAB_backend.exceptions.InvalidEvaluationTimeException;
import com.planUcab.planUCAB_backend.model.Evaluation;

@Service
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;

    public EvaluationService (EvaluationRepository evaluationRepository) {
        this.evaluationRepository = evaluationRepository;
    }

    public Evaluation createEvaluation(Long userId, CreateEvaluationRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        // Parsing times here to build LocalDateTime. Validation of time order is handled by the DTO
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

        Evaluation evaluation = new Evaluation();
        evaluation.setName(request.getName());
        evaluation.setSubject(request.getSubject());
        evaluation.setClassroom(request.getClassroom());
        evaluation.setDescription(request.getDescription());
        evaluation.setStartDateTime(startDateTime);
        evaluation.setEndDateTime(endDateTime);
        evaluation.setColorHex(request.getColorHex());
        evaluation.setPorcentageWeight(request.getPorcentageWeight());

        return evaluationRepository.save(userId, evaluation);
    }

    public List<Evaluation> getEvaluationsByUser(Long userId) {
        return evaluationRepository.findByUserId(userId);
    }

    public Evaluation updateEvaluation(Long userId, Long evaluationId, CreateEvaluationRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEvaluationTimeException("endTime must be after startTime");
        }
        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

        Evaluation evaluation = new Evaluation();
        evaluation.setName(request.getName());
        evaluation.setSubject(request.getSubject());
        evaluation.setClassroom(request.getClassroom());
        evaluation.setDescription(request.getDescription());
        evaluation.setStartDateTime(startDateTime);
        evaluation.setEndDateTime(endDateTime);
        evaluation.setColorHex(request.getColorHex());
        evaluation.setPorcentageWeight(request.getPorcentageWeight());

        return evaluationRepository.update(userId, evaluationId, evaluation);
    }

    public void deleteEvaluation(Long userId, Long evaluationId) {
        evaluationRepository.delete(userId, evaluationId);
    }

    private LocalTime parseTime24(String input) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return LocalTime.parse(input, fmt);
    }



    

} 