declare module 'knex/types/tables' {
    interface Tables {
        // 20241123205025
        chat: {
            id: string;
            label: string | null;
            messages: string; // jsonb stored as string
        }
    }
}
