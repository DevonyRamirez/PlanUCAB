import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionService, Evaluation } from './evaluacion.service';
import { CrearEvaluacionComponent } from './crear-evaluacion.component';

@Component({
  selector: 'app-evaluaciones-list',
  standalone: true,
  imports: [CommonModule, CrearEvaluacionComponent],
  templateUrl: './evaluaciones-list.component.html',
  styleUrl: './evaluaciones-list.component.css'
})
export class EvaluacionesListComponent implements OnInit {
  readonly usuarioId = 1;
  evaluaciones = signal<Evaluation[]>([]);
  mostrarCrear = signal(false);
  seleccion = signal<Evaluation | null>(null);

  constructor(private evaluacionService: EvaluacionService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.evaluacionService.obtenerEvaluaciones(this.usuarioId).subscribe(evs => this.evaluaciones.set(evs || []));
  }

  abrirCrear(): void { this.mostrarCrear.set(true); }
  cerrarCrear(): void { this.mostrarCrear.set(false); this.seleccion.set(null); }
  onCreado(): void { this.cargar(); this.cerrarCrear(); }

  editar(ev: Evaluation): void {
    this.seleccion.set(ev);
    this.mostrarCrear.set(true);
  }

  eliminar(ev: Evaluation): void {
    if (!confirm(`¿Eliminar evaluación "${ev.name}"? Esta acción no se puede deshacer.`)) return;
    this.evaluacionService.eliminarEvaluacion(this.usuarioId, Number(ev.id)).subscribe({
      next: () => this.cargar(),
      error: (err) => { console.error('Error al eliminar', err); alert('No se pudo eliminar la evaluación.'); }
    });
  }
}
