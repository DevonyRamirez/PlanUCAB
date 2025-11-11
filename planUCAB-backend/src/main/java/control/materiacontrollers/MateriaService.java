package control.materiacontrollers;

import model.Materia;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MateriaService {

    private final MateriaRepository materiaRepository;

    public MateriaService(MateriaRepository materiaRepository) {
        this.materiaRepository = materiaRepository;
    }

    public List<Materia> getAllMaterias() {
        return materiaRepository.findAll();
    }
}

