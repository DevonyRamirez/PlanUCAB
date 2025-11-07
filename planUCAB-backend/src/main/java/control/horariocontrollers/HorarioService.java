package control.horariocontrollers;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import model.Horario;
import model.Event;
import control.eventcontrollers.EventRepository;
import org.springframework.stereotype.Service;

import exceptions.InvalidEventTimeException;
import exceptions.ScheduleConflictException;

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
            throw new InvalidEventTimeException("endTime must be after startTime");
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
                    throw new ScheduleConflictException(
                        String.format("El horario entra en conflicto con '%s' (%s - %s)", 
                            horarioExistente.getMateria(),
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
                        throw new ScheduleConflictException(
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
        horario.setAula(request.getAula());
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

    private LocalTime parseTime24(String input) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return LocalTime.parse(input, fmt);
    }

    private String formatTime(LocalTime time) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return time.format(fmt);
    }
}

