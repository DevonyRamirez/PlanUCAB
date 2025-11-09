package control.evaluacioncontrollers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import model.Evaluacion;
import exceptions.InvalidEventTimeException;
import org.springframework.stereotype.Service;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;

    public EvaluacionService(EvaluacionRepository evaluacionRepository) {
        this.evaluacionRepository = evaluacionRepository;
    }

    public Evaluacion createEvaluacion(Long userId, CreateEvaluacionRequest request) {
        // Obtener todas las evaluaciones existentes del usuario
        List<Evaluacion> evaluacionesExistentes = evaluacionRepository.findByUserId(userId);

        String nombreMateria = request.getMateria();
        Double porcentajeNuevaMateria = request.getPorcentaje();

        // Calcular la suma de porcentajes de las evaluaciones existentes para esta materia específica
        double sumaPorcentajesExistentesMateria = evaluacionesExistentes.stream()
                .filter(eval -> nombreMateria.equals(eval.getMateria())) // Filtrar solo la materia actual
                .mapToDouble(eval -> eval.getPorcentaje() != null ? eval.getPorcentaje() : 0.0)
                .sum();

        // Validar que la suma total (existentes de esta materia + nueva) no exceda 100%
        double sumaTotal = sumaPorcentajesExistentesMateria + porcentajeNuevaMateria;
        if (sumaTotal > 100.0) {
            throw new IllegalArgumentException(
                String.format("La suma total de porcentajes para la materia '%s' (%.2f%% existentes + %.2f%% nueva = %.2f%%) excede el 100%%. Cada materia puede tener un máximo de 100%% distribuido entre sus evaluaciones.", 
                    nombreMateria, sumaPorcentajesExistentesMateria, porcentajeNuevaMateria, sumaTotal)
            );
        }

        // Validar horas
        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("La hora de fin debe ser posterior a la hora de inicio");
        }

        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setUserId(userId);
        evaluacion.setTitulo(request.getTitulo());
        evaluacion.setMateria(request.getMateria());
        evaluacion.setPorcentaje(request.getPorcentaje());
        evaluacion.setNota(request.getNota());
        evaluacion.setProfesor(request.getProfesor());
        evaluacion.setLocation(request.getLocation());
        evaluacion.setDescripcion(request.getDescripcion());
        evaluacion.setStartDateTime(startDateTime);
        evaluacion.setEndDateTime(endDateTime);
        evaluacion.setColorHex(request.getColorHex() != null ? request.getColorHex() : "#FF9800");

        return evaluacionRepository.save(userId, evaluacion);
    }

    public List<Evaluacion> getEvaluacionesByUser(Long userId) {
        return evaluacionRepository.findByUserId(userId);
    }

    private LocalTime parseTime24(String input) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return LocalTime.parse(input, fmt);
    }
}

