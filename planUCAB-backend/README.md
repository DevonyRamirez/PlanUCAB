# PlanUCAB Backend

Backend para el sistema de gestión de calendario académico PlanUCAB.

## 🚀 Cómo Iniciar el Backend

### Requisitos Previos

- **Java 21** o superior
- **Maven 3.6+** (opcional, se incluye Maven Wrapper)

### Verificar Instalación

```bash
java -version  # Debe mostrar Java 21 o superior
```

### Opción 1: Usando Maven Wrapper (Recomendado)

#### Windows:
```bash
cd planUCAB-backend
.\mvnw.cmd spring-boot:run
```

#### Linux/Mac:
```bash
cd planUCAB-backend
./mvnw spring-boot:run
```

### Opción 2: Usando Maven Instalado

```bash
cd planUCAB-backend
mvn spring-boot:run
```

### Opción 3: Compilar y Ejecutar JAR

```bash
cd planUCAB-backend
mvn clean package
java -jar target/planUCAB-backend-0.0.1-SNAPSHOT.jar
```

## ✅ Verificar que el Backend esté Funcionando

Una vez iniciado, el servidor estará disponible en:

- **URL Base**: `http://localhost:8080`

Puedes verificar que está funcionando abriendo tu navegador en esa dirección o usando curl:

```bash
curl http://localhost:8080
```

## 📝 Notas

- El backend se ejecuta en el puerto **8080** por defecto
- Los datos se almacenan en archivos JSON en la carpeta `data/`
- El backend acepta peticiones desde `http://localhost:4200` (frontend Angular)

## 🔧 Solución de Problemas

### Puerto 8080 ocupado

Si el puerto 8080 está ocupado, cambia el puerto en `src/main/resources/application.properties`:

```properties
server.port=8081
```

### Error de Java version

Asegúrate de tener Java 21 instalado. Si no, cambia la versión en `pom.xml`:

```xml
<properties>
    <java.version>17</java.version>  <!-- Cambiar a tu versión -->
</properties>
```

---

**Backend desarrollado con Spring Boot 3.5.6 y Java 21**