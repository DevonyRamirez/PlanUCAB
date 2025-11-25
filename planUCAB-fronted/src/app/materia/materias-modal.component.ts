import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MateriaService, Materia } from '../service/materia.service';

@Component({
  selector: 'app-materias-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materias-modal.component.html',
  styleUrl: './materias-modal.component.css'
})
export class MateriasModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  materias: Materia[] = [];
  cargando = true;
  error = '';

  constructor(private materiaService: MateriaService) {}

  ngOnInit(): void {
    this.cargarMaterias();
  }

  cargarMaterias(): void {
    this.cargando = true;
    this.materiaService.obtenerMaterias().subscribe({
      next: (materias) => {
        this.materias = materias;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar materias', err);
        this.error = 'No se pudieron cargar las materias. Verifica que el backend esté corriendo.';
        this.cargando = false;
      }
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}

