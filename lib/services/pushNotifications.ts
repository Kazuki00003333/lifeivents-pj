/**
 * プッシュ通知トークン登録（逆算リマインド用）
 * 本番の1〜3ヶ月前に「七五三の3ヶ月前です。写真館の予約を検討しましょう」等を送る想定
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function registerPushToken(): Promise<{ ok: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, message: 'ログインが必要です' };
    }

    // 動的 import（expo-notifications が未インストールでもビルドが通るように）
    const Notifications = await import('expo-notifications').catch(() => null);
    const Device = await import('expo-device').catch(() => null);
    if (!Notifications || !Device?.default) {
      return { ok: false, message: 'この環境ではプッシュ通知に未対応です' };
    }

    if (!Device.default.isDevice) {
      return { ok: false, message: '実機でお試しください' };
    }

    const { status } = await Notifications.default.requestPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, message: '通知の許可がありません。設定から許可してください。' };
    }

    const tokenData = await Notifications.default.getExpoPushTokenAsync({
      projectId: (await import('expo-constants')).default.expoConfig?.extra?.eas?.projectId as string | undefined,
    });
    const token = tokenData?.data;
    if (!token) {
      return { ok: false, message: 'トークンの取得に失敗しました' };
    }

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token,
        device_info: `${Device.default.modelName ?? 'unknown'} (${Device.default.osName ?? 'unknown'})`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    if (error) {
      logger.error('push_tokens upsert failed', { error: error.message });
      return { ok: false, message: '登録に失敗しました' };
    }

    logger.info('プッシュトークン登録完了', { userId: user.id });
    return { ok: true, message: 'リマインド通知をオンにしました。本番の1〜3ヶ月前に通知が届きます。' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('registerPushToken error', { error: msg });
    return { ok: false, message: msg || '登録に失敗しました' };
  }
}
