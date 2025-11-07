package exceptions;

public class InvalidEventTimeException extends EventException {

    public InvalidEventTimeException(String message) {
        super(message);
    }
}

