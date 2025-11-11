package com.planUcab.planUCAB_backend.jsoncontrollers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.planUcab.planUCAB_backend.logiccontrollers.CreateEvaluationRequest;
import com.planUcab.planUCAB_backend.logiccontrollers.EvaluationService;
import com.planUcab.planUCAB_backend.model.Evaluation;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/evaluations")
@CrossOrigin(origins = "http://localhost:4200")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @PostMapping("/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Evaluation createEvaluation(
            @PathVariable Long userId,
            @Valid @RequestBody CreateEvaluationRequest request) {
        return evaluationService.createEvaluation(userId, request);
    }

    @GetMapping("/{userId}")
    public List<Evaluation> getEvaluationsByUser(@PathVariable Long userId) {
        return evaluationService.getEvaluationsByUser(userId);
    }

    @PutMapping("/{userId}/{evaluationId}")
    public Evaluation updateEvaluation(
            @PathVariable Long userId,
            @PathVariable Long evaluationId,
            @Valid @RequestBody CreateEvaluationRequest request) {
        return evaluationService.updateEvaluation(userId, evaluationId, request);
    }

    @DeleteMapping("/{userId}/{evaluationId}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void deleteEvaluation(@PathVariable Long userId, @PathVariable Long evaluationId) {
        evaluationService.deleteEvaluation(userId, evaluationId);
    }

}


