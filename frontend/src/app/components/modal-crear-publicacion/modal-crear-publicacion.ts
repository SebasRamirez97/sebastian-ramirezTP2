import { Component, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicacionService } from '../../services/publicacion.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-modal-crear-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

    this.cargando.set(true);
    const formData = new FormData();
    formData.append('titulo', this.titulo());
    formData.append('descripcion', this.contenido());
    formData.append('tiempoPreparacion', this.tiempoPreparacion());

    if (this.imagenSeleccionada()) {
      formData.append('imagen', this.imagenSeleccionada()!);
    }

    this.publicacionesService.crearPublicacion(formData).subscribe({
      next: () => {
        this.cargando.set(false);
        this.cerrarModal();
        this.onPublicado.emit();
      },
      error: (err: any) => {
        this.cargando.set(false);
        console.error('Error al crear publicación:', err);
      },
    });
  }
}
