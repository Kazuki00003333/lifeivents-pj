import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';
import { MIN_TOUCH_TARGET } from '@/lib/constants/layout';
import { getRecentLogs } from '@/lib/logger';

type LogRow = {
  id: string;
  level: string;
  message: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export default function LogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getRecentLogs(200);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const exportLogs = () => {
    const text = logs
      .map((l) => `${l.created_at} [${l.level}] ${l.message} ${JSON.stringify(l.meta)}`)
      .join('\n');
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('コピーしました', 'ログをクリップボードにコピーしました');
    } else {
      Share.share({ message: text, title: 'LifePath ログ' }).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>ログ</Text>
        <TouchableOpacity onPress={exportLogs} style={styles.exportButton}>
          <Text style={styles.exportText}>エクスポート</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>更新</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{logs.length} 件</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {logs.length === 0 ? (
            <Text style={styles.empty}>ログがありません</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={[styles.row, styles[`level_${log.level}` as keyof typeof styles] || styles.row]}>
                <Text style={styles.time}>
                  {new Date(log.created_at).toLocaleString('ja-JP')}
                </Text>
                <Text style={styles.level}>[{log.level}]</Text>
                <Text style={styles.message}>{log.message}</Text>
                {Object.keys(log.meta).length > 0 && (
                  <Text style={styles.meta} numberOfLines={3}>
                    {JSON.stringify(log.meta)}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  backButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  exportButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  refreshBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  refreshText: {
    fontSize: 14,
    color: colors.accent,
  },
  count: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.text.tertiary,
  },
  level_error: {
    borderLeftColor: colors.status.error,
  },
  level_warn: {
    borderLeftColor: colors.status.warning,
  },
  level_info: {
    borderLeftColor: colors.accent,
  },
  time: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  level: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: colors.text.primary,
  },
  meta: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
});
