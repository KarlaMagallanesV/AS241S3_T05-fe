export interface ReservationDetail {
    id?: number;
    registrationDate?: Date | string;
    status: string;
    serviceCode: string;
}

export interface Reservation {
    id?: number;
    serviceDate: Date | string;
    serviceDateEnd: Date | string;
    reservationDate?: Date | string;
    subtotal: number;
    totalPoints: number;
    status: string; // P, A, C, R, N
    clientId: number;
    employeeId: number;
    details?: ReservationDetail[];
}

export interface ReservationResponse {
    id?: number;
    serviceDate: Date | string;
    serviceDateEnd: Date | string;
    reservationDate?: Date | string;
    subtotal: number;
    totalPoints: number;
    status: string;
    clientId: number;
    employeeId: number;
    clientName?: string;
    employeeName?: string;
    details?: ReservationDetail[];
}

export const ReservationStatus = {
    PENDING: 'P',      // Pendiente
    ATTENDED: 'A',     // Atendido
    CANCELLED: 'C',    // Cancelado
    RESCHEDULED: 'R',  // Reprogramada
    NO_SHOW: 'N'       // No se presentó
};
