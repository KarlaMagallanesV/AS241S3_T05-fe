export interface User {
    id?: number;
    username: string;
    role: string;
    password?: string;
    registrationDate?: Date | string;
    status?: boolean;
    employee_id?: number | null;
    client_id?: number | null;
}

export interface UserRequestDTO {
    password: string;
    role: string;
    employeeId?: number | null;
    clientId?: number | null;
}
