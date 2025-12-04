export interface ProductInterface {
    id: number,
    name_product: string,
    description_product: string,
    stock: number,
    sale_price: number,
    image_url: string,
    registration_date: Date,
    state?: true | false,
    supplier_id: number;
}
