"use strict";
/**
 * MultiRoundPlanner
 *
 * 1周目の学習記録から苦手分野を分析し、複数周回学習のタスクを生成する。
 * レガシーの「登山マップロジック」を移植。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiRoundPlanner = void 0;
class MultiRoundPlanner {
    /**
     * 実セッションから単位ごとの難易度配列を抽出
     * @param totalUnits - 計画の総単位数
     * @param sessions - 1周目のセッション（round=1）
     */
    extractDifficultiesFromSessions(totalUnits, sessions) {
        // 単位ごとの難易度を格納する配列（0で初期化）
        const difficulties = new Array(totalUnits).fill(0);
        const counts = new Array(totalUnits).fill(0);
        // 1周目のセッションのみを使用
        const firstRoundSessions = sessions
            .filter((s) => s.round === 1)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        let cumulativeUnits = 0;
        for (const session of firstRoundSessions) {
            const startUnit = cumulativeUnits;
            const endUnit = cumulativeUnits + session.unitsCompleted;
            // このセッションで学習した単位に難易度を割り当て
            for (let i = startUnit; i < endUnit && i < totalUnits; i++) {
                difficulties[i] += session.difficulty;
                counts[i]++;
            }
            cumulativeUnits = endUnit;
        }
        // 平均化（カウントが0の場合はデフォルト値3を使用）
        return difficulties.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 3));
    }
    /**
     * チャンクごとの平均難易度を計算する
     * @param totalUnits
     * @param difficulties - 単位ごとの難易度配列（0-based index）
     */
    buildDifficultyMap(totalUnits, difficulties, chunkSize = MultiRoundPlanner.DEFAULT_CHUNK_SIZE, threshold = MultiRoundPlanner.DEFAULT_THRESHOLD) {
        const chunks = [];
        const chunksCount = Math.ceil(totalUnits / chunkSize);
        for (let i = 0; i < chunksCount; i++) {
            const start = i * chunkSize + 1;
            const end = Math.min(totalUnits, (i + 1) * chunkSize);
            const slice = difficulties.slice(i * chunkSize, end);
            const avg = slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
            chunks.push({
                chunkIndex: i,
                startUnit: start,
                endUnit: end,
                averageDifficulty: avg,
                isHard: avg >= threshold,
            });
        }
        return chunks;
    }
    /**
     * 苦手チャンクを抽出
     */
    findHardChunks(chunks, threshold = MultiRoundPlanner.DEFAULT_THRESHOLD) {
        return chunks.filter((c) => c.averageDifficulty >= threshold);
    }
    /**
     * 複数周回のタスクを生成（アドバイス付き）
     * @param totalUnits
     * @param targetRounds - 目標周回数
     */
    generateRoundTasks(totalUnits, targetRounds) {
        const tasks = [];
        // 1周目は全範囲（既存の設計を踏襲）
        tasks.push({
            round: 1,
            startUnit: 1,
            endUnit: totalUnits,
            units: totalUnits,
        });
        // debug
        // eslint-disable-next-line no-console
        console.log(`[MultiRoundPlanner] generateRoundTasks totalUnits=${totalUnits} targetRounds=${targetRounds}`);
        // 2周目以降は難易度マップを用いてチャンクごとに分割して返す
        if (targetRounds > 1) {
            // 仮にセッション情報が未提供の場所でも動くよう、ここでは平均難易度3相当で構築
            // Build difficulty map with default values (caller may override by using extractDifficultiesFromSessions externally)
            // We'll create chunks and order them with hard chunks first
            const difficultyChunks = this.buildDifficultyMap(totalUnits, new Array(totalUnits).fill(3));
            // Hard chunks first, then the rest
            const hard = this.findHardChunks(difficultyChunks);
            const soft = difficultyChunks.filter((c) => !hard.includes(c));
            const ordered = [...hard, ...soft];
            for (let round = 2; round <= targetRounds; round++) {
                for (const chunk of ordered) {
                    tasks.push({
                        round,
                        startUnit: chunk.startUnit,
                        endUnit: chunk.endUnit,
                        units: chunk.endUnit - chunk.startUnit + 1,
                        advice: `${round}周目: ${chunk.isHard ? '苦手分野優先' : '復習'}`,
                    });
                }
            }
        }
        // eslint-disable-next-line no-console
        console.log(`[MultiRoundPlanner] generated ${tasks.length} roundTasks sample=${JSON.stringify(tasks.slice(0, 5))}`);
        return tasks;
    }
}
exports.MultiRoundPlanner = MultiRoundPlanner;
MultiRoundPlanner.DEFAULT_CHUNK_SIZE = 10;
MultiRoundPlanner.DEFAULT_THRESHOLD = 3.5;
//# sourceMappingURL=multi-round-planner.js.map