package control.horariocontrollers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import model.Horario;

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

