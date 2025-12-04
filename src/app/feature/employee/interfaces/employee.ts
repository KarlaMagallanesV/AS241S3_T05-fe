export interface Employee {
    id?: number;
    imagenUrl?: string | File;
    nameEmployee: string;
    lastname: string;
    cellphone: number;
    email: string;
    shiftEmployee: string; // Turno de trabajo (M, T, N)
    registrationDate?: Date | string;
    status?: 'A' | 'I'; // activo / inactivo
}
