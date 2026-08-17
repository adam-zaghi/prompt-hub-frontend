import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { CustomerModel } from './customer.model'
import { CreateCustomerRequest } from './create-customer-request.model'
import { UpdateCustomerProfileRequest } from './UpdateCustomerProfileRequest'
import { AddressModel } from './address.model'
import { UpdateAddressRequest } from './UpdateAddressRequest'

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private httpClient = inject(HttpClient)

  private baseUrl = environment.apiUrl + 'CUSTOMER-SERVICE/api/customers'
  private addressBaseUrl = environment.apiUrl + 'CUSTOMER-SERVICE/api/address'

  getCustomers() {
    return this.httpClient.get<CustomerModel[]>(this.baseUrl)
  }

  createCustomer(request: CreateCustomerRequest) {
    return this.httpClient.post<CustomerModel>(this.baseUrl, request)
  }
  addAddress(request: AddressModel,userId:number) {
    return this.httpClient.post<CustomerModel>(`${this.baseUrl}/${userId}/addresses`,request)
  }

  deleteCustomer(id: number) {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`)
  }
  getCustomerById(id: number) {
    return this.httpClient.get<CustomerModel>(`${this.baseUrl}/${id}`)
  }
  getCustomerByUserId(userId: number) {
    return this.httpClient.get<CustomerModel>(`${this.baseUrl}/by-user/${userId}`)
  }
  updateCustomerProfile(customerId: number, request: UpdateCustomerProfileRequest) {
    return this.httpClient.put<CustomerModel>(`${this.baseUrl}/${customerId}`, request)
  }
  getAddressById(addressId: number) {
    return this.httpClient.get<AddressModel>(`${this.addressBaseUrl}/${addressId}`)
  }

  updateAddress(addressId: number, request: UpdateAddressRequest) {
    return this.httpClient.put<AddressModel>(`${this.addressBaseUrl}/${addressId}`, request)
  }
  setDefaultAddress(addressId: number) {
    return this.httpClient.patch<AddressModel>(`${this.addressBaseUrl}/${addressId}/default`, {})
  }
}
