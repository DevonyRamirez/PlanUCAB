import { Component, Input, Output, EventEmitter, signal, computed, HostListener, ElementRef, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css'
})
export class ColorPickerComponent implements OnInit, OnChanges {
  @Input() value: string = '#2196F3';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('pickerContainer', { static: false }) pickerContainer!: ElementRef;
  
  mostrarPicker = signal(false);
  isDragging = signal(false);
  isDraggingHue = signal(false);
  
  // Valores HSL (0-360 para hue, 0-100 para saturation y lightness)
  hue = signal(210); // Azul por defecto
  saturation = signal(100);
  lightness = signal(50);
  
  // Computed para el color actual en HSL y HEX
  colorHex = computed(() => {
    return this.hslToHex(this.hue(), this.saturation(), this.lightness());
  });
  
  hueGradient = computed(() => {
    return `hsl(${this.hue()}, 100%, 50%)`;
  });
  
  saturationGradient = computed(() => {
    return `linear-gradient(to right, white, hsl(${this.hue()}, 100%, 50%))`;
  });
  
  brightnessGradient = computed(() => {
    return `linear-gradient(to bottom, transparent, black)`;
  });
  
  ngOnInit(): void {
    if (this.value) {
      this.hexToHsl(this.value);
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value) {
      this.hexToHsl(this.value);
    }
  }
  
  hexToHsl(hex: string): void {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    this.hue.set(Math.round(h * 360));
    this.saturation.set(Math.round(s * 100));
    this.lightness.set(Math.round(l * 100));
  }
  
  hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }
  
  onColorAreaClick(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.saturation.set(Math.round((x / rect.width) * 100));
    this.lightness.set(Math.round(100 - (y / rect.height) * 100));
    this.updateColor();
  }
  
  onColorAreaMouseDown(event: MouseEvent): void {
    this.isDragging.set(true);
    this.onColorAreaClick(event);
  }
  
  onHueSliderClick(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    this.hue.set(Math.round((x / rect.width) * 360));
    this.updateColor();
  }
  
  onHueSliderMouseDown(event: MouseEvent): void {
    this.isDraggingHue.set(true);
    this.onHueSliderClick(event);
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging()) {
      const colorArea = document.querySelector('.color-picker__saturation-area');
      if (colorArea) {
        const rect = colorArea.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        this.saturation.set(Math.round((x / rect.width) * 100));
        this.lightness.set(Math.round(100 - (y / rect.height) * 100));
        this.updateColor();
      }
    }
    if (this.isDraggingHue()) {
      const hueSlider = document.querySelector('.color-picker__hue-slider');
      if (hueSlider) {
        const rect = hueSlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        this.hue.set(Math.round((x / rect.width) * 360));
        this.updateColor();
      }
    }
  }
  
  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging.set(false);
    this.isDraggingHue.set(false);
  }
  
  togglePicker(): void {
    this.mostrarPicker.set(!this.mostrarPicker());
  }
  
  onHexInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      this.hexToHsl(value);
      this.updateColor();
    }
  }
  
  updateColor(): void {
    const hex = this.colorHex();
    this.valueChange.emit(hex);
  }
  
  getSelectorPosition(): { left: string; top: string } {
    return {
      left: `${this.saturation()}%`,
      top: `${100 - this.lightness()}%`
    };
  }
  
  getHueSliderPosition(): string {
    return `${(this.hue() / 360) * 100}%`;
  }
}

