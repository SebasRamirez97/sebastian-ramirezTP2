// src/app/directives/permiso-rol.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appPermisoRol]',
  standalone: true
})
export class PermisoRolDirective implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private userService = inject(UserService);

  private rolRequerido: string = '';
  private hasView = false;
  private subscription?: Subscription;

  @Input() set appPermisoRol(rol: string) {
    this.rolRequerido = rol;
    this.actualizarVista();
  }

  ngOnInit(): void {
    // Nos suscribimos al perfil del usuario para validar de forma reactiva cuando cargue de la base de datos
    this.subscription = this.userService.obtenerPerfil().subscribe({
      next: (user: any) => {
        if (user) {
          if (user.perfil) {
            localStorage.setItem('perfil', user.perfil);
          }
          // Guardamos también el estado activo del usuario para validarlo en la directiva
          if (user.activo !== undefined) {
            localStorage.setItem('activo', String(user.activo));
          }
        }
        this.actualizarVista();
      },
      error: () => {
        this.actualizarVista();
      }
    });
  }

  private actualizarVista() {
    // Obtenemos el perfil y el estado de habilitación
    const perfilUsuario = localStorage.getItem('perfil') || 'usuario';
    const activoStr = localStorage.getItem('activo');
    
    // Si el campo activo es 'false', interpretamos que está deshabilitado
    const estaActivo = activoStr !== 'false';

    // 🛡️ Condición estricta: debe coincidir el rol Y el usuario debe estar activo
    const cumplePermiso = (perfilUsuario === this.rolRequerido) && estaActivo;

    if (cumplePermiso) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else {
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}