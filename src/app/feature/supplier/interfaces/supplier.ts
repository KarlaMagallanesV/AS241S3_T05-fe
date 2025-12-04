export interface SupplierInterface {
    id?: number,
    ruc: string,
    company_name: string,
    cellphone: number,
    status?: true | false,
    registration_date: Date,
    ubigeo_id: string;
}
