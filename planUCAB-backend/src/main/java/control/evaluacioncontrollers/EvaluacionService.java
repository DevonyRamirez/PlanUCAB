package control.evaluacioncontrollers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import model.Evaluacion;
import model.Evaluacion.MateriaEvaluacion;
import exceptions.InvalidEventTimeException;
import org.springframework.stereotype.Service;

@Service
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepository;

    public EvaluacionService(EvaluacionRepository evaluacionRepository) {
        this.evaluacionRepository = evaluacionRepository;
    }

    public Evaluacion createEvaluacion(Long userId, CreateEvaluacionRequest request) {
        // Validar que la nueva evaluación tenga al menos una materia
        if (request.getMaterias() == null || request.getMaterias().isEmpty()) {
            throw new IllegalArgumentException("La evaluación debe tener al menos una materia");
        }

        // Validar que cada materia tenga un porcentaje válido (0-100%)
        for (CreateEvaluacionRequest.MateriaRequest materia : request.getMaterias()) {
            if (materia.getPorcentaje() == null || materia.getPorcentaje() < 0 || materia.getPorcentaje() > 100) {
                throw new IllegalArgumentException(
                    String.format("El porcentaje de la materia '%s' debe estar entre 0 y 100%%.", materia.getNombre())
                );
            }
        }

        // Obtener todas las evaluaciones existentes del usuario
        List<Evaluacion> evaluacionesExistentes = evaluacionRepository.findByUserId(userId);

        // Validar para cada materia de la nueva evaluación
        for (CreateEvaluacionRequest.MateriaRequest nuevaMateria : request.getMaterias()) {
            String nombreMateria = nuevaMateria.getNombre();
            Double porcentajeNuevaMateria = nuevaMateria.getPorcentaje();

            // Calcular la suma de porcentajes de las evaluaciones existentes para esta materia específica
            double sumaPorcentajesExistentesMateria = evaluacionesExistentes.stream()
                    .flatMap(eval -> eval.getMaterias().stream())
                    .filter(m -> nombreMateria.equals(m.getNombre())) // Filtrar solo la materia actual
                    .mapToDouble(m -> m.getPorcentaje() != null ? m.getPorcentaje() : 0.0)
                    .sum();

            // Validar que la suma total (existentes de esta materia + nueva) no exceda 100%
            double sumaTotal = sumaPorcentajesExistentesMateria + porcentajeNuevaMateria;
            if (sumaTotal > 100.0) {
                throw new IllegalArgumentException(
                    String.format("La suma total de porcentajes para la materia '%s' (%.2f%% existentes + %.2f%% nueva = %.2f%%) excede el 100%%. Cada materia puede tener un máximo de 100%% distribuido entre sus evaluaciones.", 
                        nombreMateria, sumaPorcentajesExistentesMateria, porcentajeNuevaMateria, sumaTotal)
                );
            }
        }

        // Nota: Las materias pueden ser de la lista base o de los horarios del usuario
        // Ya no validamos que las materias existan en los horarios, permitimos cualquier materia

        // Validar horas
        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("La hora de fin debe ser posterior a la hora de inicio");
        }

        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

        // Convertir MateriaRequest a MateriaEvaluacion
        List<MateriaEvaluacion> materias = request.getMaterias().stream()
                .map(m -> new MateriaEvaluacion(m.getNombre(), m.getPorcentaje()))
                .collect(Collectors.toList());

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setTitulo(request.getTitulo());
        evaluacion.setMaterias(materias);
        evaluacion.setNota(request.getNota());
        evaluacion.setProfesor(request.getProfesor());
        evaluacion.setSalon(request.getSalon());
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

