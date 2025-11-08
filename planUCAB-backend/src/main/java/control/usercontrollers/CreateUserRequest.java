package control.usercontrollers;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank(message = "El nombre de usuario es requerido")
    @Size(max = 30, message = "El nombre de usuario no puede tener más de 30 caracteres")
    private String username;

    @NotBlank(message = "El correo electrónico es requerido")
    @Email(message = "El correo electrónico debe ser válido")
    @Pattern(regexp = ".*@est\\.ucab\\.edu\\.ve$", message = "El correo debe ser del dominio @est.ucab.edu.ve")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    @Size(max = 10, message = "La contraseña no puede tener más de 10 caracteres")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

