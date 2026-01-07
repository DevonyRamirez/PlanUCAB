package control.eventcontrollers;

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
import model.Event;

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

    @PutMapping("/{eventId}")
    public Event updateEvent(@PathVariable Long userId, @PathVariable Long eventId, @Valid @RequestBody CreateEventRequest request) {
        return eventService.updateEvent(userId, eventId, request);
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long userId, @PathVariable Long eventId) {
        eventService.deleteEvent(userId, eventId);
    }
}

