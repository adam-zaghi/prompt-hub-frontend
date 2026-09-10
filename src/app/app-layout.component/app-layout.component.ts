import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'

import { AvatarModule } from 'primeng/avatar'
import { ButtonModule } from 'primeng/button'
import { DrawerModule } from 'primeng/drawer'
import { AuthService } from '../auth/auth-service'

interface NavItem {
  label: string
  icon: string
  route: string
  badge?: string
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DrawerModule,
    ButtonModule,
    AvatarModule,
    NgOptimizedImage,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  authService = inject(AuthService)
  get homeLink(): string {
    const role = this.authService.currentUser()?.role

    switch (role) {
      case 'CUSTOMER':
        return '/client/dashboard'

      case 'DELIVERY_AGENT':
        return '/driver/dashboard'

      case 'ADMIN':
        return '/dashboard'

      case 'LOGISTICS_MANAGER':
        return '/dashboard'

      default:
        return '/auth'
    }
  }
  /**
   * Contrôle le mode réduit de la sidebar sur ordinateur.
   */
  readonly sidebarCollapsed = signal(false)

  /**
   * Contrôle l'ouverture du Drawer sur mobile.
   */
  getUserInitials(): string {
    const user = this.authService.currentUser()

    if (!user) return 'U'

    const firstInitial = user.email?.charAt(0)?.toUpperCase() ?? ''

    return `${firstInitial}` || 'U'
  }
  mobileSidebarVisible = false
  readonly driverNavGroups: NavGroup[] = [
    {
      label: 'Espace livreur',
      items: [
        {
          label: 'Tableau de bord',
          icon: 'pi pi-home',
          route: '/driver/dashboard',
          exact: true,
        },
        {
          label: 'Mes livraisons',
          icon: 'pi pi-truck',
          route: '/driver/deliveries',
        },
        {
          label: 'Livraison en cours',
          icon: 'pi pi-send',
          route: '/driver/current-delivery',
        },
      ],
    },
    {
      label: 'Compte',
      items: [
        {
          label: 'Mon profil',
          icon: 'pi pi-user',
          route: '/driver/profile',
        },
      ],
    },
  ]
  readonly clientNavGroups: NavGroup[] = [
    {
      label: 'Espace Client',
      items: [
        {
          label: 'Tableau de bord',
          icon: 'pi pi-home',
          route: '/client/dashboard',
          exact: true,
        },
        {
          label: 'Mes commandes',
          icon: 'pi pi-shopping-cart',
          route: '/client/orders',
          exact: true,
        },
        {
          label: 'Mes colis',
          icon: 'pi pi-box',
          route: '/client/parcels',
          exact: true,
        },
      ],
    },
    {
      label: 'Compte',
      items: [
        {
          label: 'ajouter adresse',
          icon: 'pi pi-map',
          route: '/client/addresses',
          exact: true,
        },
        {
          label: 'Mon profil',
          icon: 'pi pi-user',
          route: '/client/profile',
          exact: true,
        },
      ],
    },
  ]
  readonly managerNavGroups: NavGroup[] = [
    {
      label: 'Clients',
      items: [
        {
          label: 'Liste des clients',
          icon: 'pi pi-users',
          route: '/customers',
          exact: true,
        },
        {
          label: 'Ajouter client',
          icon: 'pi pi-user-plus',
          route: '/customers/create',
          exact: true,
        },
      ],
    },
    {
      label: 'Commandes',
      items: [
        {
          label: 'Liste des commandes',
          icon: 'pi pi-shopping-cart',
          route: '/orders',
          exact: true,
        },
        {
          label: 'Créer commande',
          icon: 'pi pi-plus-circle',
          route: '/orders/create',
          exact: true,
        },
      ],
    },
    {
      label: 'Colis',
      items: [
        {
          label: 'Liste des colis',
          icon: 'pi pi-box',
          route: '/parcels',
          exact: true,
        },
      ],
    },
    {
      label: 'Livraisons',
      items: [
        {
          label: 'Livreurs',
          icon: 'pi pi-id-card',
          route: '/delivery-agents',
          exact: true,
        },
        {
          label: 'Ajouter livreur',
          icon: 'pi pi-user-plus',
          route: '/delivery-agents/create',
          exact: true,
        },
        {
          label: 'Livraisons',
          icon: 'pi pi-truck',
          route: '/deliveries',
          exact: true,
        },
      ],
    },
  ]

  get navGroups(): NavGroup[] {
    const role = this.authService.currentUser()?.role

    if (role === 'CUSTOMER') {
      return this.clientNavGroups
    }
    if (role === 'DELIVERY_AGENT') {
      return this.driverNavGroups
    }
    return this.managerNavGroups
  }

  toggleDesktopSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed)
  }

  openMobileSidebar(): void {
    this.mobileSidebarVisible = true
  }

  closeMobileSidebar(): void {
    this.mobileSidebarVisible = false
  }
  isDarkMode = signal(false)

  toggleDarkMode(): void {
    this.isDarkMode.update((value) => !value)

    document.documentElement.classList.toggle('app-dark', this.isDarkMode())
  }
  logout() {
    this.authService.logout()
  }
}
