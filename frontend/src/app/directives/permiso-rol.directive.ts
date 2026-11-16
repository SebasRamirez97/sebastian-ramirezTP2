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
        // Guardamos el perfil obtenido de la base de datos en localStorage opcionalmente para sincronizar
        if (user && user.perfil) {
          localStorage.setItem('perfil', user.perfil);
        }
        this.actualizarVista();
      },
      error: () => {
        this.actualizarVista();
      }
    });
  }

  private actualizarVista() {
    // Obtenemos el perfil actualizado (ya sea de la base de datos o respaldado en localStorage)
    const perfilUsuario = localStorage.getItem('perfil') || 'usuario';

    if (perfilUsuario === this.rolRequerido) {
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