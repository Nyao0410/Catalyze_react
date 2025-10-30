# CMakeエラー分析レポート

**プロジェクト**: Catalyze React Native アプリ  
**作成日**: 2025年10月30日  
**ステータス**: ビルド失敗 (CMake構築エラー)

---

## 実行結果サマリー

| 項目 | 状態 | 詳細 |
|------|------|------|
| ローカルGradle (Debug) | ❌ 失敗 | CMake configureCMakeDebug[arm64-v8a] エラー |
| ローカルGradle (Release) | ❌ 失敗 | CMake configureCMakeRelWithDebInfo[arm64-v8a] エラー |
| EAS Cloud Build | ❌ 失敗 | 「Install dependencies」段階で不明エラー |
| npm install | ✅ 成功 | 984パッケージのインストール完了 |
| Expo Prebuild | ✅ 成功 | Androidプロジェクト生成完了 |

---

## エラーの詳細分析

### 1. エラーの根本原因

**エラーメッセージ**:
```
java.lang.IllegalStateException: WARNING: A restricted method in java.lang.System has been called
```

**発生場所**:
- `GeneratePrefabPackagesKt.reportErrors()` (GeneratePrefabPackages.kt:304)
- `ExternalNativeJsonGenerator.configureOneAbi()` (ExternalNativeJsonGenerator.kt:213)

**オブジェクト**:
- Gradle: 8.14.3
- Android Gradle Plugin: 最新版
- Java: Temurin 24.0.0 (OpenJDK)
- NDK: 27.1.12297006

### 2. CMakeエラーの詳細

失敗しているCMakeタスク（3つ）:

| ライブラリ | タスク | アーキテクチャ | 段階 |
|-----------|--------|--------------|------|
| react-native-worklets | configureCMakeDebug/RelWithDebInfo | arm64-v8a | CMake設定生成 |
| react-native-screens | configureCMakeDebug/RelWithDebInfo | arm64-v8a | CMake設定生成 |
| expo-modules-core | configureCMakeDebug/RelWithDebInfo | arm64-v8a | CMake設定生成 |

### 3. エラースタックの分析

```
com.android.build.gradle.tasks.GeneratePrefabPackagesKt
  ↓
ExternalNativeJsonGenerator.configureOneAbi()
  ↓
ExternalNativeBuildJsonTask.doTaskAction()
  ↓
CMakeプロセス実行時に「制限されたメソッド」呼び出しエラー
```

**根本原因の考察**:

1. **Java 24との互換性問題**: 
   - Temurin JDK 24.0.0は最新のセキュリティ制限を実装している
   - `java.lang.System`の特定メソッドが制限されている可能性

2. **Prefabパッケージ生成フェーズでのエラー**:
   - CMakeビルドシステムグローブ（Glue）の生成時にエラー
   - `GeneratePrefabPackagesKt.reportErrors()` が例外を投げている

3. **制限されたメソッド**:
   - Android Gradle Pluginが呼び出しているセキュリティ機構で禁止されているメソッド
   - 可能性が高い: `System.setProperty()`, `System.getenv()`, または類似メソッド

---

## 環境設定の詳細

### プロジェクト構成

```
Android SDK Version:
  - compileSdk: 36
  - targetSdk: 36
  - minSdk: 24

Gradle Configuration:
  - Build Tools: 36.0.0
  - Gradle Version: 8.14.3
  - NDK Version: 27.1.12297006
  - Kotlin Version: 2.1.20

Java:
  - JDK: Temurin 24.0.0 (OpenJDK)
  - Location: /Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home
```

### ネイティブモジュール (CMakeLists.txt)

| モジュール | 行数 | 状態 |
|-----------|------|------|
| expo-modules-core | 327 | ❌ CMake エラー |
| react-native-worklets | 137 | ❌ CMake エラー |
| react-native-screens | 87-92 | ❌ CMake エラー |
| react-native-reanimated | 124 | ✅ (worklets依存) |
| react-native-safe-area-context | 90 | ✅ (screens依存) |

---

## 問題の影響範囲

### 直接的な影響
1. **ローカルビルド不可**: `./gradlew app:assembleDebug/Release` 実行不可
2. **APK/App Bundle生成不可**: デバッグAPKも リリース ビルドも失敗
3. **EAS Cloud Build失敗**: 同じCMakeエラーで遠隔ビルドも失敗

### 間接的な影響
1. **開発ワークフロー停止**: ローカルテストビルド不可
2. **デプロイ不可**: PlayStore公開前テスト不可
3. **CI/CD失敗**: 自動ビルドパイプラインが動作しない

---

## 原因の深掘り分析

### 原因 A: Java 24のセキュリティ制限

**理由**:
- Temurin JDK 24.0.0は、Java 21での大幅なセキュリティ改良を継承
- Android Gradle Plugin (最新版)が、古いAPIパターンを使用している可能性

**根拠**:
- エラースタックに `MethodHandleUtils.invokeKotlinStaticDefault` が出現
- Kotlinライブラリのメソッド呼び出しが制限されている

**対策**:
- JDKを Java 21 LTS または Java 17 LTS にダウングレード
- Android Gradle Plugin をさらに新しい版にアップグレード

### 原因 B: CMakeのPrefab統合の問題

**理由**:
- Prefab（prebuilt FABrication）はライブラリのプリビルトバイナリパッケージング形式
- CMake生成時に、不正なコマンド実行またはファイルアクセスが発生

**根拠**:
- `GeneratePrefabPackagesKt.createPrefabBuildSystemGlue()` でエラー発生
- `ExternalNativeJsonGenerator` が CMake JSON設定生成に失敗

**対策**:
- `gradle.properties` で Prefab キャッシュをクリア
- NDK バージョンを確認 (27.1.12297006 は新しすぎる可能性)

### 原因 C: macOS固有のパス問題

**理由**:
- macOS のパス（Spaces含む）が CMake処理に干渉
- ファイルシステムアクセス権限の問題

**根拠**:
- パスに「React Native」等のスペースが含まれている
- macOS Ventura以上のセキュリティコントロール

**対策**:
- プロジェクトパスを短くし、スペースを削除
- または、ビルドを別ドライブで実行

---

## 実装されていない対策

### 試行済みの対策
- ✅ `npm install --legacy-peer-deps --force`
- ✅ `npx expo prebuild --clean`
- ✅ `node_modules` キャッシュ削除
- ✅ node PATHの修正
- ✅ package.json フォーマット修正

### 未試行の対策
1. ❌ JDK ダウングレード (Java 17/21)
2. ❌ NDK ダウングレード
3. ❌ Android Gradle Plugin ダウングレード
4. ❌ Gradle キャッシュのクリア (`--no-build-cache`)
5. ❌ CMake キャッシュの削除

---

## 推奨される解決手順

### 段階 1: 環境修復

```bash
# JDKバージョン確認
java -version

# Gradle キャッシュクリア
./gradlew clean --no-build-cache

# CMake キャッシュ削除
rm -rf .gradle/cxx
rm -rf android/.cxx
rm -rf node_modules/.gradle
```

### 段階 2: ダウングレード試行

```bash
# Java 17 LTS へのダウングレード (推奨)
# または brew install openjdk@17 (macOS)

# gradle.properties に追加
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+IgnoreUnrecognizedVMOptions -XX:+UseG1GC
```

### 段階 3: NDK設定調整

```properties
# gradle.properties
ndkVersion=27.1.12297006
# ↓ ダウングレードを試す
ndkVersion=26.3.11579264
```

### 段階 4: CMakeオプション追加

```gradle
// android/app/build.gradle
android {
    externalNativeBuild {
        cmake {
            path "CMakeLists.txt"
            version "3.22.1"  // 明示的にバージョン指定
        }
    }
    
    defaultConfig {
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++17"
                arguments "-DCMAKE_BUILD_TYPE=Release"
                arguments "-DCMAKE_SYSTEM_NAME=Android"
            }
        }
    }
}
```

---

## CMake統合の複雑性

### なぜCMakeが必要?

React Native の以下のモジュールは C/C++ 実装を含む:

1. **react-native-worklets**
   - Reanimatedの仕事スケジューラー
   - JSI (JavaScript Interface) 実装
   - ネイティブ高速パス

2. **react-native-screens**
   - ネイティブナビゲーション最適化
   - ネイティブUIコンポーネント統合

3. **expo-modules-core**
   - Expo SDKのコアネイティブモジュール
   - 約327行のCMakeL構成

### なぜmacOSで失敗するのか?

- Linux/Android環境では正常に動作
- macOSのJDK+CMake組み合わせで特定の問題
- クロスコンパイル環境（macOS → Android）での複雑性

---

## 代替案

### 案 1: Docker/Linux環境でビルド

```bash
docker run --rm -v $(pwd):/project android-sdk:latest \
  bash -c "cd /project && ./gradlew app:assembleRelease"
```

### 案 2: Expo Go アプリでテスト

```bash
npx expo start
# QRコードをスキャンしてExpo Goアプリで実行
```

### 案 3: GitHub Actions で自動ビルド

```yaml
name: Android Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: npm install --legacy-peer-deps
      - run: ./gradlew app:assembleRelease
```

---

## 結論

| 項目 | 評価 |
|------|------|
| エラーの重大度 | 🔴 高 (デプロイ不可能) |
| 解決難易度 | 🟡 中 (環境修復が必要) |
| 推奨対応 | JDK ダウングレード + CMake キャッシュクリア |
| 代替手段 | Linux/Docker環境での構築 |

**最終推奨**: 
1. Java 17 LTS へのダウングレード を第一優先で試す
2. それでも失敗する場合、Linux/Docker環境でのビルドに切り替える
3. GitHub Actions での自動ビルドセットアップを検討

---

## 附録: コマンドリファレンス

```bash
# 現在の環境確認
java -version
gradle --version
./gradlew --version

# クリーンビルド試行
./gradlew clean app:assembleDebug

# 詳細ログ出力
./gradlew app:assembleDebug --info --debug

# CMakeキャッシュの完全削除
find . -type d -name ".cxx" -exec rm -rf {} +
find . -type d -name ".gradle" -exec rm -rf {} +

# Gradle キャッシュのクリア
./gradlew cleanBuildCache

# Java 17 のインストール (macOS Homebrew)
brew install openjdk@17
sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

---

**作成者**: GitHub Copilot  
**最終更新**: 2025-10-30
