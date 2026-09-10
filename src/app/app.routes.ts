import { Routes } from '@angular/router'

import { AuthForm } from './auth/auth-form/auth-form'
import { Customer } from './pages/customer/liste/customer'
import { AppLayoutComponent } from './app-layout.component/app-layout.component'

import { authGuard } from './auth/auth.guard'
import { guestGuard } from './auth/guest.guard'
import { Form } from './pages/customer/form/form'
import { OrderList } from './pages/order/order-list/order-list'
import { OrderForm } from './pages/order/order-form/order-form'
import { ParcelForm } from './pages/parcel/parcel-form/parcel-form'
import { OrderDetail } from './pages/order/order-detail/order-detail'
import { ParcelList } from './pages/parcel/parcel-list/parcel-list'
import {
  DeliveryAgentListComponent
} from './pages/delivery-agents/delivery-agent-list.component/delivery-agent-list.component'
import {
  DeliveryAgentFormComponent
} from './pages/delivery-agents/delivery-agent-form.component/delivery-agent-form.component'
import { DeliveryAssignComponent } from './pages/deliveries/delivery-assign.component/delivery-assign.component'
import { DeliveryListComponent } from './pages/deliveries/delivery-list.component/delivery-list.component'
import { TrackingParcelComponent } from './pages/tracking/tracking-parcel/tracking-parcel.component'
import { homeRedirectGuard } from './auth/home-redirect.guard'
import { HomeRedirectComponent } from './pages/home-redirect/home-redirect.component'


import { ClientProfileComponent } from './pages/profile/client-profile.component/client-profile.component'
import { ClientAddressEditComponent } from './pages/profile/client-address-edit-component/client-address-edit-component'
import { ClientOrders } from './pages/profile/client-orders/client-orders'
import { ClientParcels } from './pages/profile/client-parcels/client-parcels'
import { ClientTrackingParcel } from './pages/profile/client-tracking-parcel/client-tracking-parcel'
import { DriverDeliveries } from './pages/driver/driver-deliveries/driver-deliveries'
import { DriverDeliveryDetail } from './pages/driver/driver-delivery-detail/driver-delivery-detail'
import { AddressForm } from './pages/profile/address-form/address-form'
import { ClientDashboard } from './pages/client/client-dashboard/client-dashboard'
import { ManagerDashboardComponent } from './pages/manager/manager-dashboard/manager-dashboard'
import { DriverDashboard } from './pages/driver/driver-dashboard/driver-dashboard'
import { DriverProfile } from './pages/driver/driver-profile/driver-profile'

export const routes: Routes = [
  /*
   * Page accessible uniquement quand on n'est pas connecté.
   */
  {
    path: 'auth',
    component: AuthForm,
    canActivate: [guestGuard],
  },

  /*
   * Toutes les pages placées dans le layout
   * nécessitent une authentification.
   */
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],

    children: [
      {
        path: 'customers',
        component: Customer,
      },

      {
        path: 'customers/create',
        component: Form,
      },
      {
        path: 'orders',
        component: OrderList,
      },
      {
        path: 'orders/create',
        component: OrderForm,
      },
      {
        path: 'parcels',
        component: ParcelList,
      },
      {
        path: 'orders/:id',
        component: OrderDetail,
      },
      {
        path: 'orders/:orderId/parcels/create',
        component: ParcelForm,
      },
      {
        path: 'delivery-agents',
        component: DeliveryAgentListComponent,
      },
      {
        path: 'delivery-agents/create',
        component: DeliveryAgentFormComponent,
      },
      {
        path: 'deliveries',
        component: DeliveryListComponent,
      },
      {
        path: 'deliveries/assign',
        component: DeliveryAssignComponent,
      },
      {
        path: 'tracking/parcels/:parcelId',
        component: TrackingParcelComponent,
      },
      {
        path: 'client/profile',
        component: ClientProfileComponent,
      },
      {
        path: 'client/addresses/:addressId/edit',
        component: ClientAddressEditComponent,
      },
      {
        path: 'client/orders',
        component: ClientOrders,
      },
      {
        path: 'client/parcels',
        component: ClientParcels,
      },
      {
        path: 'client/tracking/parcels/:parcelId',
        component: ClientTrackingParcel,
      },
      {
        path: 'driver/deliveries',
        component: DriverDeliveries,
      },
      {
        path: 'driver/deliveries/:id',
        component: DriverDeliveryDetail,
      },
      {
        path: 'client/addresses',
        component: AddressForm,
      },
      {
        path: 'client/dashboard',
        component: ClientDashboard,
      },
      {
        path: 'dashboard',
        component: ManagerDashboardComponent,
      },
      {
        path: 'driver/dashboard',
        component: DriverDashboard,
      },
      {
        path: 'driver/profile',
        component: DriverProfile,
      },

      /*
       * localhost:4200
       * redirige vers :
       * localhost:4200/customers
       */
      {
        path: '',
        pathMatch: 'full',
        component: HomeRedirectComponent,
        canActivate: [homeRedirectGuard],
      },
    ],
  },

  /*
   * Route inconnue.
   */
  {
    path: '**',
    redirectTo: '',
  },
]
