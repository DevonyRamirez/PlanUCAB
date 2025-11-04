package com.planUcab.planUCAB_backend.event.service;

import com.planUcab.planUCAB_backend.event.dto.CreateEventRequest;
import com.planUcab.planUCAB_backend.event.model.Event;
import com.planUcab.planUCAB_backend.event.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Long userId, CreateEventRequest request) {
        LocalDate date = LocalDate.parse(request.getDate());
        LocalTime start = parseTime24(request.getStartTime());
        LocalTime end = parseTime24(request.getEndTime());
        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        LocalDateTime startDateTime = LocalDateTime.of(date, start);
        LocalDateTime endDateTime = LocalDateTime.of(date, end);

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

}
