package control.horariocontrollers;

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

import jakarta.validation.Valid;
import model.Horario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users/{userId}/horarios")
@CrossOrigin(origins = "http://localhost:4200")
public class HorarioController {

    private static final Logger logger = LoggerFactory.getLogger(HorarioController.class);
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
        try {
            logger.info("Consultando horarios para usuario: {}", userId);
            List<Horario> horarios = horarioService.getHorariosByUser(userId);
            logger.info("Horarios encontrados: {}", horarios.size());
            return horarios;
        } catch (Exception e) {
            logger.error("Error al consultar horarios para usuario {}: {}", userId, e.getMessage(), e);
            throw e; // Re-lanzar para que el GlobalExceptionHandler lo maneje
        }
    }

    @PutMapping("/{horarioId}")
    public Horario updateHorario(@PathVariable Long userId, @PathVariable Long horarioId, @Valid @RequestBody CreateHorarioRequest request) {
        return horarioService.updateHorario(userId, horarioId, request);
    }

    @DeleteMapping("/{horarioId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHorario(@PathVariable Long userId, @PathVariable Long horarioId) {
        horarioService.deleteHorario(userId, horarioId);
    }
}

