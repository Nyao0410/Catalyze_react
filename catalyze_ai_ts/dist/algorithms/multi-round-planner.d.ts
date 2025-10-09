/**
 * MultiRoundPlanner
 *
 * 1周目の学習記録から苦手分野を分析し、複数周回学習のタスクを生成する。
 * レガシーの「登山マップロジック」を移植。
 */
import { StudySessionEntity } from '../domain/entities/study-session-entity';
export interface DifficultyChunk {
    chunkIndex: number;
    startUnit: number;
    endUnit: number;
    averageDifficulty: number;
    isHard: boolean;
}
export interface RoundTask {
    round: number;
    startUnit: number;
    endUnit: number;
    units: number;
    advice?: string;
}
export declare class MultiRoundPlanner {
    static readonly DEFAULT_CHUNK_SIZE = 10;
    static readonly DEFAULT_THRESHOLD = 3.5;
    /**
     * 実セッションから単位ごとの難易度配列を抽出
     * @param totalUnits - 計画の総単位数
     * @param sessions - 1周目のセッション（round=1）
     */
    extractDifficultiesFromSessions(totalUnits: number, sessions: StudySessionEntity[]): number[];
    /**
     * チャンクごとの平均難易度を計算する
     * @param totalUnits
     * @param difficulties - 単位ごとの難易度配列（0-based index）
     */
    buildDifficultyMap(totalUnits: number, difficulties: number[], chunkSize?: number, threshold?: number): DifficultyChunk[];
    /**
     * 苦手チャンクを抽出
     */
    findHardChunks(chunks: DifficultyChunk[], threshold?: number): DifficultyChunk[];
    /**
     * 複数周回のタスクを生成（アドバイス付き）
     * @param totalUnits
     * @param targetRounds - 目標周回数
     */
    generateRoundTasks(totalUnits: number, targetRounds: number): RoundTask[];
}
//# sourceMappingURL=multi-round-planner.d.ts.map