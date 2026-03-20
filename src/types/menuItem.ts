export interface MenuItem {
    id?: number;
    pos_id: string;
    menu: string;
    item_type: string;
    category?: string;
    parent_group?: string;
    name: string;
    description?: string;
    price?: string;
    in_stock?: boolean;
    out_of_stock_icon?: string;
    sort_order?: number;
    created_at?: Date;
    updated_at?: Date;
    last_synced_to_onsign?: Date;
    is_active?: boolean;
    toast_last_modified?: Date;
    onsign_row_id?: string;
    onsign_version?: number;
}
