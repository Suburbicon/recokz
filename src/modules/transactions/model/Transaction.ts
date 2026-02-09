export interface Transaction {
    id: string;
    amount: string;
    date: Date;
    meta: {
        data: {
            id: number;
            date: Date;
            amount: number;
            client: {
                id: number;
                name: string;
                email: string;
                phone: string;
                surname: string;
                patronymic: string;
            };
            master: any[]; // Adjust type if you know the structure
            record: {
                id: number;
                date: Date;
                comment: string;
                deleted: boolean;
                prepaid: boolean;
                staff_id: number;
                visit_id: number;
                is_online: boolean;
                paid_full: number;
                activity_id: number;
                location_id: number;
                custom_color: string;
                clients_count: number;
                attendance_status: number;
            };
            account: {
                id: number;
                title: string;
                is_cash: boolean;
                is_default: boolean;
            };
            comment: string;
            expense: {
                id: number;
                type: number;
                title: string;
            };
            supplier: any[]; // Adjust type if you know the structure
            visit_id: number;
            record_id: number;
            document_id: number;
            sold_item_id: number;
            sold_item_type: string;
            last_change_date: string;
        };
        status: string;
        resource: string;
        company_id: number;
        resource_id: number;
        crm: string;
    };
    documentId: string | null;
    organizationId: string;
    createdAt: string;
    bankTransactionId: string | null;
    sentToRekassa: boolean;
}
