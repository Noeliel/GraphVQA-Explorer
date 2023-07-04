export interface EvaluationGraphCategory {
    name: string;
    frequency_total: number;
    frequency_pos: number;
    frequency_neg: number;
    weight_total: number;
    weight_avg_total: number;
    weight_pos: number;
    weight_avg_pos: number;
    weight_neg: number;
    weight_avg_neg: number;
    performance_pos: number;
    performance_norm_pos: number;
    performance_norm_smax_pos: number;
    performance_neg: number;
    performance_norm_neg: number;
    performance_norm_smax_neg: number;
    performance_net: number;
    performance_norm_net: number;
    performance_norm_smax_net: number;
}
