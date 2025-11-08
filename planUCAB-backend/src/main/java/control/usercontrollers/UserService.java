package control.usercontrollers;

import model.User;
import exceptions.EventException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse register(CreateUserRequest request) {
        // Validar que el email termine en @est.ucab.edu.ve
        if (!request.getEmail().toLowerCase().endsWith("@est.ucab.edu.ve")) {
            throw new EventException("El correo debe ser del dominio @est.ucab.edu.ve");
        }

        // Validar que el email no esté registrado
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EventException("El correo electrónico ya está registrado");
        }

        // Validar longitud del nombre de usuario
        if (request.getUsername().length() > 30) {
            throw new EventException("El nombre de usuario no puede tener más de 30 caracteres");
        }

        // Validar longitud de la contraseña
        if (request.getPassword().length() > 10) {
            throw new EventException("La contraseña no puede tener más de 10 caracteres");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPassword(request.getPassword()); // En producción, aquí se debería encriptar la contraseña

        User savedUser = userRepository.save(user);
        return new UserResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
    }

    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase());
        
        if (user == null) {
            throw new EventException("Credenciales inválidas");
        }

        if (!user.getPassword().equals(request.getPassword())) {
            throw new EventException("Credenciales inválidas");
        }

        return new UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new EventException("Usuario no encontrado");
        }
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}

