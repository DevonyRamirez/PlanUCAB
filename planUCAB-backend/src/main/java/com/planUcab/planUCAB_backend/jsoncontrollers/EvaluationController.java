package com.planUcab.planUCAB_backend.jsoncontrollers;

import com.planUcab.planUCAB_backend.model.Evaluation;
import com.planUcab.planUCAB_backend.logiccontrollers.CreateEvaluationRequest;
import com.planUcab.planUCAB_backend.logiccontrollers.EvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

}


