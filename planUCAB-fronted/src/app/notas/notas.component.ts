import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EvaluacionService, Evaluacion } from '../service/evaluacion.service';
import { AuthService } from '../service/auth.service';
import { Materia } from '../service/materia.service';

interface NotaPorMateria {
  materia: Materia;
  evaluaciones: Evaluacion[];
  total: number;
  aprobado: boolean;
}

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas.component.html',
  styleUrl: './notas.component.css'
})
export class NotasComponent implements OnInit {
  usuarioId = 0;
  evaluaciones = signal<Evaluacion[]>([]);
  notasPorMateria = computed<NotaPorMateria[]>(() => {
    const evaluaciones = this.evaluaciones();
    const materiasMap = new Map<string, NotaPorMateria>();

    evaluaciones.forEach(evaluacion => {
      const nombreMateria = typeof evaluacion.materia === 'string' 
        ? evaluacion.materia 
        : evaluacion.materia?.nombre || 'Sin materia';
      
      if (!materiasMap.has(nombreMateria)) {
        const materiaObj: Materia = typeof evaluacion.materia === 'object' && evaluacion.materia 
          ? evaluacion.materia 
          : { id: 0, nombre: nombreMateria, semestre: '', uc: 0 };
        materiasMap.set(nombreMateria, {
          materia: materiaObj,
          evaluaciones: [],
          total: 0,
          aprobado: false
        });
      }

      const notaPorMateria = materiasMap.get(nombreMateria)!;
      notaPorMateria.evaluaciones.push(evaluacion);
    });

    // Calcular totales para cada materia
    materiasMap.forEach((notaPorMateria, nombreMateria) => {
      let total = 0;
      notaPorMateria.evaluaciones.forEach(evaluacion => {
        const notaPonderada = evaluacion.nota * (evaluacion.porcentaje / 100);
        total += notaPonderada;
      });
      notaPorMateria.total = total;
      notaPorMateria.aprobado = total >= 10; // Aprobado si total >= 10 (base 20)
    });

    // Ordenar por nombre de materia
    return Array.from(materiasMap.values()).sort((a, b) => 
      a.materia.nombre.localeCompare(b.materia.nombre)
    );
  });

  constructor(
    private evaluacionService: EvaluacionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.usuarioId = userId;
      this.cargarEvaluaciones();
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarEvaluaciones(): void {
    this.evaluacionService.obtenerEvaluaciones(this.usuarioId).subscribe({
      next: (evaluaciones) => {
        this.evaluaciones.set(evaluaciones);
      },
      error: (err) => {
        console.error('Error al cargar evaluaciones', err);
      }
    });
  }

  calcularNotaPonderada(evaluacion: Evaluacion): number {
    return evaluacion.nota * (evaluacion.porcentaje / 100);
  }

  formatearNumero(numero: number): string {
    return numero.toFixed(1).replace('.', ',');
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}

