export interface ServiceInterface {
        code: string,
        name_service: string,
        category?: 'CC' | 'CM' | 'CP' | 'CR' | 'DC' | 'DR' | 'DM' | 'DP' | 'DD',
        description_service: string,
        price: number,
        duration: number,
        points: number,
        image_url: string,
        registration_date: Date,
        status?: true | false;
}
