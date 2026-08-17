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
        {
          label: 'Historique',
          icon: 'pi pi-history',
          route: '/driver/history',
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
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          route: '/driver/settings',
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
        },
        {
          label: 'Mes colis',
          icon: 'pi pi-box',
          route: '/client/parcels',
        },
        {
          label: 'Suivi colis',
          icon: 'pi pi-map-marker',
          route: '/client/tracking',
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
        },
        {
          label: 'Mon profil',
          icon: 'pi pi-user',
          route: '/client/profile',
        },
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          route: '/settings',
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
        },
        {
          label: 'Ajouter client',
          icon: 'pi pi-user-plus',
          route: '/customers/create',
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
        },
        {
          label: 'Créer commande',
          icon: 'pi pi-plus-circle',
          route: '/orders/create',
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
        },
        {
          label: 'Ajouter livreur',
          icon: 'pi pi-user-plus',
          route: '/delivery-agents/create',
        },
        {
          label: 'Livraisons',
          icon: 'pi pi-truck',
          route: '/deliveries',
        },
      ],
    },
    {
      label: 'Compte',
      items: [
        {
          label: 'Paramètres',
          icon: 'pi pi-cog',
          route: '/settings',
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
