package com.planUcab.planUCAB_backend.jsoncontrollers;

import com.planUcab.planUCAB_backend.model.Horario;
import com.planUcab.planUCAB_backend.logiccontrollers.CreateHorarioRequest;
import com.planUcab.planUCAB_backend.logiccontrollers.HorarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/horarios")
@CrossOrigin(origins = "http://localhost:4200")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Horario createHorario(@PathVariable Long userId, @Valid @RequestBody CreateHorarioRequest request) {
        return horarioService.createHorario(userId, request);
    }

    @GetMapping
    public List<Horario> getHorarios(@PathVariable Long userId) {
        return horarioService.getHorariosByUser(userId);
    }
}

