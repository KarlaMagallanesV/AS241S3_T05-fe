export interface Client {
    id?: number;
    imageUrl?: string | File;
    typeDocument: string;
    numberDocument: number;
    nameClient: string;
    lastname: string;
    birthday: Date;
    cellphone: number;
    email: string;
    registrationDate?: Date;
    addressClient?: string; // Mantenido por compatibilidad pero no se usa
    ubigeoCode: string; // Código del ubigeo (distrito)
    status?: 'A' | 'I'; // activo / inactivo
    visitFrequency: 'N' | 'F' | 'O' | 'H'; // Nuevo / Frecuente / Ocasional / Habitual
    points?: number; // Puntos del cliente
}