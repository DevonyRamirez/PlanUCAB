package control.eventcontrollers;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import model.Event;
import model.Horario;
import control.horariocontrollers.HorarioRepository;
import org.springframework.stereotype.Service;

import exceptions.InvalidEventTimeException;
import exceptions.ScheduleConflictException;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final HorarioRepository horarioRepository;

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

    public EventService(EventRepository eventRepository, HorarioRepository horarioRepository) {
        this.eventRepository = eventRepository;
        this.horarioRepository = horarioRepository;
    }

    public Event createEvent(Long userId, CreateEventRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("endTime must be after startTime");
        }
        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

        // Verificar conflictos con otros eventos del mismo día
        List<Event> eventosExistentes = eventRepository.findByUserId(userId);
        for (Event eventoExistente : eventosExistentes) {
            LocalDateTime existenteStart = eventoExistente.getStartDateTime();
            LocalDateTime existenteEnd = eventoExistente.getEndDateTime();
            
            // Verificar si es el mismo día
            if (existenteStart.toLocalDate().equals(date)) {
                // Verificar solapamiento: (start < existenteEnd) && (end > existenteStart)
                if (startDateTime.isBefore(existenteEnd) && endDateTime.isAfter(existenteStart)) {
                    throw new ScheduleConflictException(
                        String.format("El evento entra en conflicto con '%s' (%s - %s)", 
                            eventoExistente.getName(),
                            formatTime(existenteStart.toLocalTime()),
                            formatTime(existenteEnd.toLocalTime()))
                    );
                }
            }
        }

        // Verificar conflictos con horarios del mismo día de la semana
        DayOfWeek diaSemanaEvento = date.getDayOfWeek();
        List<Horario> horariosExistentes = horarioRepository.findByUserId(userId);
        for (Horario horarioExistente : horariosExistentes) {
            DayOfWeek diaSemanaHorario = DIA_SEMANA_MAP.get(horarioExistente.getDiaSemana());
            if (diaSemanaHorario != null && diaSemanaHorario.equals(diaSemanaEvento)) {
                LocalTime horarioStart = parseTime24(horarioExistente.getStartTime());
                LocalTime horarioEnd = parseTime24(horarioExistente.getEndTime());
                
                // Verificar solapamiento: (start < horarioEnd) && (end > horarioStart)
                if (start.isBefore(horarioEnd) && end.isAfter(horarioStart)) {
                    throw new ScheduleConflictException(
                        String.format("El evento entra en conflicto con el horario '%s' (%s - %s)", 
                            horarioExistente.getMateria(),
                            horarioExistente.getStartTime(),
                            horarioExistente.getEndTime())
                    );
                }
            }
        }

        Event event = new Event();
        event.setName(request.getName());
        event.setLocation(request.getLocation());
        event.setDescription(request.getDescription());
        event.setStartDateTime(startDateTime);
        event.setEndDateTime(endDateTime);
        event.setColorHex(request.getColorHex());

        return eventRepository.save(userId, event);
    }

    public List<Event> getEventsByUser(Long userId) {
        return eventRepository.findByUserId(userId);
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

