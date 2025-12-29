package control.evaluacioncontrollers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import model.Evaluacion;
import model.Materia;
import exceptions.InvalidEventTimeException;
import exceptions.HorarioConflictoExcepcion;
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

        Materia materiaNueva = request.getMateria();
        String nombreMateria = materiaNueva.getNombre();
        Double porcentajeNuevaMateria = request.getPorcentaje();

        // Calcular la suma de porcentajes de las evaluaciones existentes para esta materia específica
        double sumaPorcentajesExistentesMateria = evaluacionesExistentes.stream()
                .filter(eval -> eval.getMateria() != null && nombreMateria.equals(eval.getMateria().getNombre())) // Filtrar solo la materia actual
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

        // Validar choque de horario con otras evaluaciones del mismo día
        for (Evaluacion evaluacionExistente : evaluacionesExistentes) {
            LocalDateTime existenteStart = evaluacionExistente.getStartDateTime();
            LocalDateTime existenteEnd = evaluacionExistente.getEndDateTime();
            
            // Verificar si es el mismo día
            if (existenteStart.toLocalDate().equals(date)) {
                // Verificar solapamiento: (start < existenteEnd) && (end > existenteStart)
                if (startDateTime.isBefore(existenteEnd) && endDateTime.isAfter(existenteStart)) {
                    String nombreMateriaExistente = evaluacionExistente.getMateria() != null 
                        ? evaluacionExistente.getMateria().getNombre() 
                        : "Desconocida";
                    throw new HorarioConflictoExcepcion(
                        String.format("La evaluación entra en conflicto de horario con '%s' de %s (%s - %s)", 
                            evaluacionExistente.getTitulo(),
                            nombreMateriaExistente,
                            formatTime(existenteStart.toLocalTime()),
                            formatTime(existenteEnd.toLocalTime()))
                    );
                }
            }
        }

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

    public Evaluacion updateEvaluacion(Long userId, Long evaluacionId, CreateEvaluacionRequest request) {
        // Verificar que la evaluación existe
        Evaluacion evaluacionExistente = evaluacionRepository.findById(userId, evaluacionId);
        if (evaluacionExistente == null) {
            throw new IllegalArgumentException("Evaluación no encontrada");
        }

        // Obtener todas las evaluaciones existentes del usuario
        List<Evaluacion> evaluacionesExistentes = evaluacionRepository.findByUserId(userId);

        Materia materiaNueva = request.getMateria();
        String nombreMateria = materiaNueva.getNombre();
        Double porcentajeNuevaMateria = request.getPorcentaje();

        // Calcular la suma de porcentajes de las evaluaciones existentes para esta materia específica
        // Excluyendo la evaluación que estamos editando
        double sumaPorcentajesExistentesMateria = evaluacionesExistentes.stream()
                .filter(eval -> eval.getId() != null && !eval.getId().equals(evaluacionId)) // Excluir la evaluación actual
                .filter(eval -> eval.getMateria() != null && nombreMateria.equals(eval.getMateria().getNombre()))
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

        // Validar choque de horario con otras evaluaciones del mismo día (excluyendo la actual)
        for (Evaluacion otraEvaluacion : evaluacionesExistentes) {
            // Saltar la evaluación que estamos editando
            if (otraEvaluacion.getId() != null && otraEvaluacion.getId().equals(evaluacionId)) {
                continue;
            }
            
            LocalDateTime existenteStart = otraEvaluacion.getStartDateTime();
            LocalDateTime existenteEnd = otraEvaluacion.getEndDateTime();
            
            // Verificar si es el mismo día
            if (existenteStart.toLocalDate().equals(date)) {
                // Verificar solapamiento: (start < existenteEnd) && (end > existenteStart)
                if (startDateTime.isBefore(existenteEnd) && endDateTime.isAfter(existenteStart)) {
                    String nombreMateriaExistente = otraEvaluacion.getMateria() != null 
                        ? otraEvaluacion.getMateria().getNombre() 
                        : "Desconocida";
                    throw new HorarioConflictoExcepcion(
                        String.format("La evaluación entra en conflicto de horario con '%s' de %s (%s - %s)", 
                            otraEvaluacion.getTitulo(),
                            nombreMateriaExistente,
                            formatTime(existenteStart.toLocalTime()),
                            formatTime(existenteEnd.toLocalTime()))
                    );
                }
            }
        }

        Evaluacion updatedEvaluacion = new Evaluacion();
        updatedEvaluacion.setTitulo(request.getTitulo());
        updatedEvaluacion.setMateria(request.getMateria());
        updatedEvaluacion.setPorcentaje(request.getPorcentaje());
        updatedEvaluacion.setNota(request.getNota());
        updatedEvaluacion.setProfesor(request.getProfesor());
        updatedEvaluacion.setLocation(request.getLocation());
        updatedEvaluacion.setDescripcion(request.getDescripcion());
        updatedEvaluacion.setStartDateTime(startDateTime);
        updatedEvaluacion.setEndDateTime(endDateTime);
        updatedEvaluacion.setColorHex(request.getColorHex() != null ? request.getColorHex() : "#FF9800");

        return evaluacionRepository.update(userId, evaluacionId, updatedEvaluacion);
    }

    public void deleteEvaluacion(Long userId, Long evaluacionId) {
        // Verificar que la evaluación existe
        Evaluacion evaluacionExistente = evaluacionRepository.findById(userId, evaluacionId);
        if (evaluacionExistente == null) {
            throw new IllegalArgumentException("Evaluación no encontrada");
        }
        
        evaluacionRepository.delete(userId, evaluacionId);
    }

    private LocalTime parseTime24(String input) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return LocalTime.parse(input, fmt);
    }

    private String formatTime(LocalTime time) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return time.format(fmt);
    }
}

