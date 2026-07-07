# クラス設計 (Class Design)

> design.md の実装方針が固まった後、コードを書き始める前に記入します。
> クラス構造に影響しない小さな変更（バグ修正・文言変更など）ではスキップして構いません。

## 新規クラス

<!-- 追加するクラスごとに以下のブロックを繰り返す。不要なら「なし」 -->

### `App\Service\ExampleService`（新規）

<!-- 責務を1〜2文で。続けて対応要件（requirements.md の AC-n）と依存を1行で -->

このクラスが担う役割を1〜2文で。
対応要件: AC-1, AC-2 / 依存: `ExampleRepository`, `Logger`

```php
public function doSomething(OrderId $id, Reason $reason): Result
```

- **振る舞い:** 何を受け取り、何をして、何を返すか
- **例外:** 投げる例外と条件。呼び出し元がどう扱う想定か（リトライ可 / ユーザーに見せる 等）
- **副作用:** DB 更新以外に起きること（イベント発行・メール・外部API）。なければ省略

## 既存クラスへの変更

<!-- 変更するクラスごとに以下のブロックを繰り返す。不要なら「なし」 -->

### `App\Service\OrderService`（変更・AC-3）

```php
public function cancel(OrderId $id): void                    // 追加
public function create(CartId $id, Coupon $coupon): Order    // 変更前: create(CartId $id): Order
// public function legacyMethod(): void                      // 削除（代替: cancel）
```

- 追加・変更メソッドの振る舞い / 例外 / 副作用を新規クラスと同じ粒度で
- シグネチャ変更・削除は呼び出し元への影響（修正が必要な箇所）を明記

## クラス間の関係

<!-- 呼び出しの流れやデータの受け渡しを簡潔に。1行のフローで十分なら図は不要 -->

```
Controller → ExampleService → ExampleRepository → DB
```

## トランザクションと整合性

<!-- 該当する場合のみ。どこからどこまでがアトミックか、途中失敗時にどうなるか、
     同じ操作が2回実行されたら（冪等性・並行実行）どうなるか -->

## 設計上の判断

<!-- 迷った点と選んだ理由。インターフェースを切る/切らない、既存クラス拡張 vs 新規クラス等 -->

## 未確定事項

<!-- 実装しながら決める点、ユーザーに確認したい点。確認が必要なものは questions.md へ -->
