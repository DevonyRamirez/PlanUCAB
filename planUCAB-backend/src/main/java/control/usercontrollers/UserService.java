package control.usercontrollers;

import model.User;
import exceptions.EventException;
import control.evaluacioncontrollers.EvaluacionRepository;
import control.horariocontrollers.HorarioRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final HorarioRepository horarioRepository;

    public UserService(UserRepository userRepository, 
                       EvaluacionRepository evaluacionRepository,
                       HorarioRepository horarioRepository) {
        this.userRepository = userRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.horarioRepository = horarioRepository;
    }

    public UserResponse register(CreateUserRequest request) {
        // Validar que el email no esté registrado
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EventException("El correo electrónico ya está registrado");
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

    public UserResponse UpdateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new EventException("Usuario no encontrado");
        }

        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().toLowerCase());
        }
        if (request.getPassword() != null) {
            user.setPassword(request.getPassword()); // En producción, aquí se debería encriptar la contraseña
        }

        User updatedUser = userRepository.save(user);
        return new UserResponse(updatedUser.getId(), updatedUser.getUsername(), updatedUser.getEmail());
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new EventException("Usuario no encontrado");
        }

        // Eliminar todos los datos asociados al usuario
        evaluacionRepository.deleteAllByUserId(id);
        horarioRepository.deleteAllByUserId(id);
        
        // Eliminar el usuario
        userRepository.delete(user);
    }
}

