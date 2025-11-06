package com.planUcab.planUCAB_backend.logiccontrollers;

import com.planUcab.planUCAB_backend.model.Horario;
import com.planUcab.planUCAB_backend.exceptions.InvalidEventTimeException;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class HorarioService {

    private final HorarioRepository horarioRepository;

    public HorarioService(HorarioRepository horarioRepository) {
        this.horarioRepository = horarioRepository;
    }

    public Horario createHorario(Long userId, CreateHorarioRequest request) {
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new InvalidEventTimeException("endTime must be after startTime");
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
}

