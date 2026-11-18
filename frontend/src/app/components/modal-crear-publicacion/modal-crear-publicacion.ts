import { Component, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';
import { SombraHoverDirective } from '../../directives/sombra-hover.directive';
import { ResaltarHoverDirective } from '../../directives/resaltar-hover.directive';

@Component({
  selector: 'app-modal-crear-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, SombraHoverDirective, ResaltarHoverDirective],
  templateUrl: './modal-crear-publicacion.html',
  styleUrls: ['./modal-crear-publicacion.css'],
})
export class ModalCrearPublicacion implements OnInit {
  private publicacionesService = inject(PublicacionService);
  private userService = inject(UserService);

  usuario = signal<any>(null);
  isOpen = signal<boolean>(false);

  titulo = signal<string>('');
  contenido = signal<string>('');
  tiempoPreparacion = signal<string>('');
  imagenSeleccionada = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  cargando = signal<boolean>(false);

  onPublicado = output<void>();
  onIntentarPublicar = output<FormData>();

  ngOnInit(): void {
    this.userService.obtenerPerfil().subscribe({
      next: (user) => this.usuario.set(user),
      error: (err) => console.error('Error al obtener perfil:', err),
    });
  }

  abrirModal() {
    this.isOpen.set(true);
  }

  cerrarModal() {
    this.isOpen.set(false);
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.titulo.set('');
    this.contenido.set('');
    this.tiempoPreparacion.set(''); // <-- Limpiamos el tiempo de preparación
    this.imagenSeleccionada.set(null);
    this.previewUrl.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada.set(file);
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  crearPublicacion() {
    if (!this.titulo() || !this.contenido()) return;

    const formData = new FormData();
    formData.append('titulo', this.titulo());
    formData.append('descripcion', this.contenido());
    formData.append('tiempoPreparacion', this.tiempoPreparacion());

    if (this.imagenSeleccionada()) {
      formData.append('imagen', this.imagenSeleccionada()!);
    }

    // 💡 Le pasamos el formData al componente padre y cerramos el modal de creación
    this.onIntentarPublicar.emit(formData);
    this.cerrarModal();
  }
}
