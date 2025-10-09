/**
 * ドメイン層 - 値オブジェクト
 * 
 * 進捗を表す不変の値オブジェクト
 */

export class Progress {
  readonly completed: number;
  readonly total: number;

  constructor(completed: number, total: number) {
    if (completed < 0) {
      throw new Error('Completed must be non-negative');
    }
    if (total <= 0) {
      throw new Error('Total must be positive');
    }
    if (completed > total) {
      throw new Error('Completed cannot exceed total');
    }

    this.completed = completed;
    this.total = total;
  }

  /**
   * 進捗率 (0.0 ~ 1.0)
   */
  get percentage(): number {
    return this.total > 0 ? this.completed / this.total : 0.0;
  }

  /**
   * 残り
   */
  get remaining(): number {
    return this.total - this.completed;
  }

  /**
   * 完了したか
   */
  get isComplete(): boolean {
    return this.completed >= this.total;
  }

  /**
   * 完了したか（エイリアス）
   */
  get isCompleted(): boolean {
    return this.isComplete;
  }

  /**
   * 未着手か
   */
  get isNotStarted(): boolean {
    return this.completed === 0;
  }

  /**
   * 進行中か
   */
  get isInProgress(): boolean {
    return this.completed > 0 && this.completed < this.total;
  }

  /**
   * 進捗を進める
   */
  advance(amount: number): Progress {
    const newCompleted = Math.max(0, Math.min(this.total, this.completed + amount));
    return new Progress(newCompleted, this.total);
  }

  /**
   * 進捗をリセット
   */
  reset(): Progress {
    return new Progress(0, this.total);
  }

  /**
   * 総数を変更
   */
  withTotal(newTotal: number): Progress {
    const newCompleted = Math.max(0, Math.min(newTotal, this.completed));
    return new Progress(newCompleted, newTotal);
  }

  equals(other: Progress): boolean {
    return this.completed === other.completed && this.total === other.total;
  }

  toString(): string {
    return `Progress(${this.completed}/${this.total} = ${(this.percentage * 100).toFixed(1)}%)`;
  }
}
