export interface BillingDetailInterface {
  product_id: number;
  amount: number;
}

export interface BillingInterface {
  payment_method: string;
  user_id: number;
  client_id: number;
  reservation_id: number | null;
  billingDetail: BillingDetailInterface[];
}

export interface ClientDTO {
  clientId: number;
  type_document: string;
  number_document: string;
  name_client: string;
  lastname: string;
}

export interface UserDTO {
  userId: number;
  name_user: string;
  lastname: string;
}

export interface ReservationDTO {
  reservationId: number;
  service_date: string;
  subtotal: number;
  clientId: number;
}

export interface BillingDetailDTO {
  productId: number;
  name_product: string;
  description: string;
  amount: number;
  priceSale: number;
  subtotal: number;
}

export interface BillingResponse {
  billingId: number;
  client: ClientDTO;
  user: UserDTO;
  date_pay: string;
  payment_method: string;
  reservation: ReservationDTO | null;
  billingDetail: BillingDetailDTO[];
  total: number;
  status: boolean;
}
