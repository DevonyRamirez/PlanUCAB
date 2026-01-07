package control.horariocontrollers;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import model.Horario;
import model.Event;
import control.eventcontrollers.EventRepository;
import org.springframework.stereotype.Service;

import exceptions.InvalidEventTimeException;
import exceptions.HorarioConflictoExcepcion;

@Service
public class HorarioService {

    private final HorarioRepository horarioRepository;
    private final EventRepository eventRepository;

    // Mapeo de nombres de días en español a DayOfWeek de Java
    private static final Map<String, DayOfWeek> DIA_SEMANA_MAP = new HashMap<>();
    static {
        DIA_SEMANA_MAP.put("Lunes", DayOfWeek.MONDAY);
        DIA_SEMANA_MAP.put("Martes", DayOfWeek.TUESDAY);
        DIA_SEMANA_MAP.put("Miércoles", DayOfWeek.WEDNESDAY);
        DIA_SEMANA_MAP.put("Jueves", DayOfWeek.THURSDAY);
        DIA_SEMANA_MAP.put("Viernes", DayOfWeek.FRIDAY);
        DIA_SEMANA_MAP.put("Sábado", DayOfWeek.SATURDAY);
        DIA_SEMANA_MAP.put("Domingo", DayOfWeek.SUNDAY);
    }

    public HorarioService(HorarioRepository horarioRepository, EventRepository eventRepository) {
        this.horarioRepository = horarioRepository;
        this.eventRepository = eventRepository;
    }

    public Horario createHorario(Long userId, CreateHorarioRequest request) {
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("la hora de fin debe ser posterior a la hora de inicio");
        }

        // Verificar conflictos con otros horarios del mismo día de la semana
        List<Horario> horariosExistentes = horarioRepository.findByUserId(userId);
        for (Horario horarioExistente : horariosExistentes) {
            // Verificar si es el mismo día de la semana
            if (horarioExistente.getDiaSemana().equals(request.getDiaSemana())) {
                LocalTime existenteStart = parseTime24(horarioExistente.getStartTime());
                LocalTime existenteEnd = parseTime24(horarioExistente.getEndTime());
                
                // Verificar solapamiento: (start < existenteEnd) && (end > existenteStart)
                if (start.isBefore(existenteEnd) && end.isAfter(existenteStart)) {
                    String nombreMateria = horarioExistente.getMateria() != null ? horarioExistente.getMateria().getNombre() : "Desconocida";
                    throw new HorarioConflictoExcepcion(
                        String.format("El horario entra en conflicto con '%s' (%s - %s)", 
                            nombreMateria,
                            horarioExistente.getStartTime(),
                            horarioExistente.getEndTime())
                    );
                }
            }
        }

        // Verificar conflictos con eventos del mismo día de la semana
        DayOfWeek diaSemanaHorario = DIA_SEMANA_MAP.get(request.getDiaSemana());
        if (diaSemanaHorario != null) {
            List<Event> eventosExistentes = eventRepository.findByUserId(userId);
            for (Event eventoExistente : eventosExistentes) {
                DayOfWeek diaSemanaEvento = eventoExistente.getStartDateTime().getDayOfWeek();
                if (diaSemanaEvento.equals(diaSemanaHorario)) {
                    LocalTime eventoStart = eventoExistente.getStartDateTime().toLocalTime();
                    LocalTime eventoEnd = eventoExistente.getEndDateTime().toLocalTime();
                    
                    // Verificar solapamiento: (start < eventoEnd) && (end > eventoStart)
                    if (start.isBefore(eventoEnd) && end.isAfter(eventoStart)) {
                        throw new HorarioConflictoExcepcion(
                            String.format("El horario entra en conflicto con el evento '%s' (%s - %s)", 
                                eventoExistente.getName(),
                                formatTime(eventoStart),
                                formatTime(eventoEnd))
                        );
                    }
                }
            }
        }

        Horario horario = new Horario();
        horario.setMateria(request.getMateria());
        horario.setLocation(request.getLocation());
        horario.setDiaSemana(request.getDiaSemana());
        horario.setStartTime(request.getStartTime());
        horario.setEndTime(request.getEndTime());
        horario.setProfesor(request.getProfesor());
        horario.setTipoClase(request.getTipoClase());
        horario.setColorHex(request.getColorHex());

        return horarioRepository.save(userId, horario);
    }

    public List<Horario> getHorariosByUser(Long userId) {
        return horarioRepository.findByUserId(userId);
    }

    public Horario updateHorario(Long userId, Long horarioId, CreateHorarioRequest request) {
        // Verificar que el horario existe
        Horario horarioExistente = horarioRepository.findById(userId, horarioId);
        if (horarioExistente == null) {
            throw new IllegalArgumentException("Horario no encontrado");
        }

        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("la hora de fin debe ser posterior a la hora de inicio");
        }

        // Obtener el nombre de la materia del horario existente para identificar horarios relacionados
        String nombreMateriaExistente = horarioExistente.getMateria() != null 
            ? horarioExistente.getMateria().getNombre() 
            : null;
        String nombreMateriaNueva = request.getMateria() != null 
            ? request.getMateria().getNombre() 
            : null;

        // Determinar si la materia cambió
        boolean materiaCambio = nombreMateriaExistente != null && nombreMateriaNueva != null 
            && !nombreMateriaExistente.equals(nombreMateriaNueva);

        // Si la materia no cambió, actualizar campos genéricos en todos los horarios de la misma materia
        if (!materiaCambio && nombreMateriaExistente != null) {
            List<Horario> horariosRelacionados = horarioRepository.findByUserId(userId).stream()
                .filter(h -> {
                    // Excluir el horario que estamos editando
                    if (h.getId() != null && h.getId().equals(horarioId)) {
                        return false;
                    }
                    String nombreMateria = h.getMateria() != null ? h.getMateria().getNombre() : null;
                    return nombreMateria != null && nombreMateria.equals(nombreMateriaExistente);
                })
                .collect(Collectors.toList());

            // Actualizar campos genéricos (profesor, tipoClase, colorHex) en todos los horarios relacionados
            // Mantener los campos específicos (diaSemana, startTime, endTime, location) sin cambios
            for (Horario horarioRelacionado : horariosRelacionados) {
                // Crear una copia del horario con solo los campos genéricos actualizados
                Horario horarioActualizado = new Horario();
                horarioActualizado.setId(horarioRelacionado.getId());
                horarioActualizado.setUserId(horarioRelacionado.getUserId());
                horarioActualizado.setMateria(horarioRelacionado.getMateria()); // Mantener la materia original
                horarioActualizado.setLocation(horarioRelacionado.getLocation()); // Mantener location específica
                horarioActualizado.setDiaSemana(horarioRelacionado.getDiaSemana()); // Mantener día específico
                horarioActualizado.setStartTime(horarioRelacionado.getStartTime()); // Mantener hora inicio específica
                horarioActualizado.setEndTime(horarioRelacionado.getEndTime()); // Mantener hora fin específica
                // Actualizar solo campos genéricos
                horarioActualizado.setProfesor(request.getProfesor());
                horarioActualizado.setTipoClase(request.getTipoClase());
                horarioActualizado.setColorHex(request.getColorHex());
                
                // Actualizar el horario en el repositorio
                horarioRepository.update(userId, horarioRelacionado.getId(), horarioActualizado);
            }
        }

        // Verificar conflictos con otros horarios del mismo día de la semana (excluyendo el horario actual y los relacionados)
        List<Horario> horariosExistentes = horarioRepository.findByUserId(userId);
        for (Horario otroHorario : horariosExistentes) {
            // Saltar el horario que estamos editando
            if (otroHorario.getId() != null && otroHorario.getId().equals(horarioId)) {
                continue;
            }
            
            // Saltar horarios relacionados si no cambió la materia
            if (!materiaCambio && nombreMateriaExistente != null) {
                String nombreMateriaOtro = otroHorario.getMateria() != null ? otroHorario.getMateria().getNombre() : null;
                if (nombreMateriaOtro != null && nombreMateriaOtro.equals(nombreMateriaExistente)) {
                    continue;
                }
            }
            
            // Verificar si es el mismo día de la semana
            if (otroHorario.getDiaSemana().equals(request.getDiaSemana())) {
                LocalTime existenteStart = parseTime24(otroHorario.getStartTime());
                LocalTime existenteEnd = parseTime24(otroHorario.getEndTime());
                
                // Verificar solapamiento: (start < existenteEnd) && (end > existenteStart)
                if (start.isBefore(existenteEnd) && end.isAfter(existenteStart)) {
                    String nombreMateria = otroHorario.getMateria() != null ? otroHorario.getMateria().getNombre() : "Desconocida";
                    throw new HorarioConflictoExcepcion(
                        String.format("El horario entra en conflicto con '%s' (%s - %s)", 
                            nombreMateria,
                            otroHorario.getStartTime(),
                            otroHorario.getEndTime())
                    );
                }
            }
        }

        // Verificar conflictos con eventos del mismo día de la semana
        DayOfWeek diaSemanaHorario = DIA_SEMANA_MAP.get(request.getDiaSemana());
        if (diaSemanaHorario != null) {
            List<Event> eventosExistentes = eventRepository.findByUserId(userId);
            for (Event eventoExistente : eventosExistentes) {
                DayOfWeek diaSemanaEvento = eventoExistente.getStartDateTime().getDayOfWeek();
                if (diaSemanaEvento.equals(diaSemanaHorario)) {
                    LocalTime eventoStart = eventoExistente.getStartDateTime().toLocalTime();
                    LocalTime eventoEnd = eventoExistente.getEndDateTime().toLocalTime();
                    
                    // Verificar solapamiento: (start < eventoEnd) && (end > eventoStart)
                    if (start.isBefore(eventoEnd) && end.isAfter(eventoStart)) {
                        throw new HorarioConflictoExcepcion(
                            String.format("El horario entra en conflicto con el evento '%s' (%s - %s)", 
                                eventoExistente.getName(),
                                formatTime(eventoStart),
                                formatTime(eventoEnd))
                        );
                    }
                }
            }
        }

        // Actualizar el horario específico con todos los campos (específicos y genéricos)
        Horario updatedHorario = new Horario();
        updatedHorario.setMateria(request.getMateria());
        updatedHorario.setLocation(request.getLocation());
        updatedHorario.setDiaSemana(request.getDiaSemana());
        updatedHorario.setStartTime(request.getStartTime());
        updatedHorario.setEndTime(request.getEndTime());
        updatedHorario.setProfesor(request.getProfesor());
        updatedHorario.setTipoClase(request.getTipoClase());
        updatedHorario.setColorHex(request.getColorHex());

        return horarioRepository.update(userId, horarioId, updatedHorario);
    }

    public void deleteHorario(Long userId, Long horarioId) {
        // Verificar que el horario existe
        Horario horarioExistente = horarioRepository.findById(userId, horarioId);
        if (horarioExistente == null) {
            throw new IllegalArgumentException("Horario no encontrado");
        }
        
        horarioRepository.delete(userId, horarioId);
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

