export interface QuestionEvaluationData {
    sid: string;
    q: string;
    ambig: number;
    gt: string;
    p1: string;
    c1: number;
    p2: string;
    c2: number;
    p3: string;
    c3: number;
    p4: string;
    c4: number;
    p5: string;
    c5: number;
    f1: string;
    w1: number;
    f2: string;
    w2: number;
    f3: string;
    w3: number;
    f4: string;
    w4: number;
    f5: string;
    w5: number;
}

export type EvaluationData = {
    [qid: string]: QuestionEvaluationData;
};
