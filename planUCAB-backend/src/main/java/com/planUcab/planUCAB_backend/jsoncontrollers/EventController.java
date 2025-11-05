package com.planUcab.planUCAB_backend.jsoncontrollers;

import com.planUcab.planUCAB_backend.model.Event;
import com.planUcab.planUCAB_backend.logiccontrollers.CreateEventRequest;
import com.planUcab.planUCAB_backend.logiccontrollers.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/events")
@CrossOrigin(origins = "http://localhost:4200")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event createEvent(@PathVariable Long userId, @Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(userId, request);
    }

    @GetMapping
    public List<Event> getEvents(@PathVariable Long userId) {
        return eventService.getEventsByUser(userId);
    }
}

