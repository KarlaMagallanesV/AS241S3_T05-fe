export interface DecodedToken {
    username: string;
    role: string;
    exp?: number;
    iat?: number;
}