/**
 * デバイス共通のレイアウト定数
 * - iPhone 14 Pro Max 等のセーフエリア・タブバーを考慮
 */

/** タップ可能領域の最小サイズ（Apple HIG 推奨 44pt） */
export const MIN_TOUCH_TARGET = 44;

/** タブバーエリアの概算高さ（コンテンツ + セーフエリア用）。ScrollView の paddingBottom に使う */
export const TAB_BAR_AREA_HEIGHT = 100;
