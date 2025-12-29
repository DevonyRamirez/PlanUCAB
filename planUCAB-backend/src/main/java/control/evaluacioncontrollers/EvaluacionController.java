package control.evaluacioncontrollers;

import java.util.List;

import model.Evaluacion;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/{userId}/evaluaciones")
@CrossOrigin(origins = "http://localhost:4200")
public class EvaluacionController {

    private final EvaluacionService evaluacionService;

    public EvaluacionController(EvaluacionService evaluacionService) {
        this.evaluacionService = evaluacionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evaluacion createEvaluacion(@PathVariable Long userId, @Valid @RequestBody CreateEvaluacionRequest request) {
        return evaluacionService.createEvaluacion(userId, request);
    }

    @GetMapping
    public List<Evaluacion> getEvaluaciones(@PathVariable Long userId) {
        return evaluacionService.getEvaluacionesByUser(userId);
    }

    @PutMapping("/{evaluacionId}")
    public Evaluacion updateEvaluacion(@PathVariable Long userId, @PathVariable Long evaluacionId, @Valid @RequestBody CreateEvaluacionRequest request) {
        return evaluacionService.updateEvaluacion(userId, evaluacionId, request);
    }
}

