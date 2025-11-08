import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges, OnInit, HostListener, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TimeOption {
  hour24: number;
  hour12: number;
  minute: number;
  ampm: 'AM' | 'PM';
  display: string;
}

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css'
})
export class TimePickerComponent implements OnInit, OnChanges {
  @Input() value: string = '';
  @Input() minTime: string | null = null; // Hora mínima permitida (ej: "09:00")
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('timePickerRef', { static: false }) timePickerRef!: ElementRef;
  
  mostrarSelector = signal(false);
  inputValue = signal('');
  lastValidValue = signal('');
  isSelectingOption = false;
  
  // Generar todas las opciones de hora en intervalos de 15 minutos
  opcionesHora: TimeOption[] = (() => {
    const opciones: TimeOption[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        // Formato 24h (militar)
        const display = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        opciones.push({
          hour24: h,
          hour12,
          minute: m,
          ampm,
          display
        });
      }
    }
    return opciones;
  })();
  
  horaSeleccionada = computed(() => {
    if (!this.value) return null;
    const [h, m] = this.value.split(':');
    const hour24 = parseInt(h, 10);
    const minute = parseInt(m, 10) || 0;
    // Buscar por hour24 y minute ya que display ahora es formato 24h
    return this.opcionesHora.find(op => op.hour24 === hour24 && op.minute === minute) || null;
  });

  // Filtrar opciones basándose en minTime
  opcionesDisponibles = computed(() => {
    if (!this.minTime) {
      return this.opcionesHora;
    }
    
    // Parsear minTime
    const [minH, minM] = this.minTime.split(':');
    const minHour24 = parseInt(minH, 10);
    const minMinute = parseInt(minM, 10) || 0;
    const minTimeMinutes = minHour24 * 60 + minMinute;
    
    // Filtrar opciones que sean mayores a minTime
    return this.opcionesHora.filter(op => {
      const opTimeMinutes = op.hour24 * 60 + op.minute;
      return opTimeMinutes > minTimeMinutes;
    });
  });
  
  ngOnInit(): void {
    if (this.value) {
      this.actualizarInput();
      this.lastValidValue.set(this.value);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value !== this.lastValidValue()) {
      this.actualizarInput();
      this.lastValidValue.set(this.value);
    }
    
    // Si cambia minTime y el valor actual es menor o igual, limpiar el valor
    if (changes['minTime'] && this.value && this.minTime) {
      const [minH, minM] = this.minTime.split(':');
      const minHour24 = parseInt(minH, 10);
      const minMinute = parseInt(minM, 10) || 0;
      const minTimeMinutes = minHour24 * 60 + minMinute;
      
      const [h, m] = this.value.split(':');
      const hour24 = parseInt(h, 10);
      const minute = parseInt(m, 10) || 0;
      const currentTimeMinutes = hour24 * 60 + minute;
      
      if (currentTimeMinutes <= minTimeMinutes) {
        this.valueChange.emit('');
        this.lastValidValue.set('');
        this.inputValue.set('');
      }
    }
  }
  
  actualizarInput(): void {
    if (!this.value) {
      this.inputValue.set('');
      return;
    }
    // Mostrar en formato 24h (militar)
    const [h, m] = this.value.split(':');
    const hour = parseInt(h, 10);
    const min = parseInt(m, 10) || 0;
    this.inputValue.set(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  
  @HostListener('document:click', ['$event'])
  cerrarSiClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    // Verificar si el click es dentro de este componente específico
    if (this.timePickerRef?.nativeElement) {
      const element = this.timePickerRef.nativeElement as HTMLElement;
      if (element.contains(target)) {
        // El click es dentro de este componente, no cerrar
        return;
      }
    }
    // Si el click es fuera de este componente, cerrar el selector
    this.mostrarSelector.set(false);
  }
  
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.inputValue.set(value);
    
    const parsed = this.parseFlexibleTime(value);
    if (parsed) {
      this.valueChange.emit(parsed);
      this.lastValidValue.set(parsed);
    }
  }
  
  onBlur(): void {
    // Esperar un poco antes de cerrar para permitir que el click del botón se ejecute
    setTimeout(() => {
      if (!this.isSelectingOption) {
        const parsed = this.parseFlexibleTime(this.inputValue());
        if (parsed) {
          this.valueChange.emit(parsed);
          this.lastValidValue.set(parsed);
          this.actualizarInput();
        } else if (this.lastValidValue()) {
          // Revertir al último valor válido
          this.actualizarInput();
        } else {
          this.inputValue.set('');
        }
        this.mostrarSelector.set(false);
      }
    }, 200);
  }
  
  onFocus(): void {
    this.mostrarSelector.set(true);
  }
  
  parseFlexibleTime(input: string): string | null {
    if (!input || !input.trim()) return null;
    
    input = input.trim().toLowerCase();
    
    // Formato: HH:mm (24h) o H:mm
    let match = input.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = parseInt(match[2], 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    
    // Formato: h:mm am/pm o h am/pm o h:mmam/pm
    match = input.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      
      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        if (ampm === 'pm' && h !== 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    
    // Formato: HHmm (24h)
    match = input.match(/^(\d{3,4})$/);
    if (match) {
      let num = parseInt(match[1], 10);
      if (num >= 0 && num <= 2359) {
        let h = Math.floor(num / 100);
        let m = num % 100;
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }
  
  seleccionarOpcion(opcion: TimeOption): void {
    this.isSelectingOption = true;
    const timeStr = `${String(opcion.hour24).padStart(2, '0')}:${String(opcion.minute).padStart(2, '0')}`;
    this.valueChange.emit(timeStr);
    this.lastValidValue.set(timeStr);
    // display ya está en formato 24h
    this.inputValue.set(opcion.display);
    this.mostrarSelector.set(false);
    setTimeout(() => {
      this.isSelectingOption = false;
    }, 300);
  }
}

