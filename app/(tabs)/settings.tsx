import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { ChevronRight, ShoppingBag, Church, Gift } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { colors, spacing, borderRadius } from '@/lib/constants/colors';

const ceremonialServices = [
  {
    id: 1,
    title: '喪服レンタル',
    description: '急な葬儀に対応。翌日配送可能',
    icon: ShoppingBag,
    url: 'https://example.com/mourning-wear',
  },
  {
    id: 2,
    title: '着物・礼服レンタル',
    description: '結婚式・成人式・七五三用',
    icon: ShoppingBag,
    url: 'https://example.com/kimono-rental',
  },
  {
    id: 3,
    title: '葬儀場予約',
    description: '全国の葬儀場を簡単予約',
    icon: Church,
    url: 'https://example.com/funeral-hall',
  },
  {
    id: 4,
    title: '結婚式場予約',
    description: '理想の式場を見つける',
    icon: Church,
    url: 'https://example.com/wedding-venue',
  },
  {
    id: 5,
    title: '引き出物サービス',
    description: 'センスの良い引き出物を',
    icon: Gift,
    url: 'https://example.com/gift-service',
  },
  {
    id: 6,
    title: '仏壇・仏具購入',
    description: '伝統的な仏壇から現代的なものまで',
    icon: Gift,
    url: 'https://example.com/buddhist-altar',
  },
];

export default function ExternalServicesScreen() {
  const handleServicePress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('URLを開けませんでした:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>外部サービス連携</Text>
        <Text style={styles.subtitle}>
          業務提携先の冠婚葬祭サービスをご利用いただけます
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>衣装・レンタル</Text>
          <View style={styles.servicesGrid}>
            {ceremonialServices
              .filter((s) => s.title.includes('レンタル'))
              .map((service) => (
                <Card key={service.id} padding="md" variant="elevated" style={styles.serviceCard}>
                  <TouchableOpacity
                    style={styles.serviceContent}
                    onPress={() => handleServicePress(service.url)}
                  >
                    <View style={styles.serviceIconContainer}>
                      <service.icon size={28} color={colors.accent} />
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <View style={styles.serviceArrow}>
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    </View>
                  </TouchableOpacity>
                </Card>
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>式場予約</Text>
          <View style={styles.servicesGrid}>
            {ceremonialServices
              .filter((s) => s.title.includes('予約'))
              .map((service) => (
                <Card key={service.id} padding="md" variant="elevated" style={styles.serviceCard}>
                  <TouchableOpacity
                    style={styles.serviceContent}
                    onPress={() => handleServicePress(service.url)}
                  >
                    <View style={styles.serviceIconContainer}>
                      <service.icon size={28} color={colors.accent} />
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <View style={styles.serviceArrow}>
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    </View>
                  </TouchableOpacity>
                </Card>
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ギフト・仏具</Text>
          <View style={styles.servicesGrid}>
            {ceremonialServices
              .filter((s) => !s.title.includes('レンタル') && !s.title.includes('予約'))
              .map((service) => (
                <Card key={service.id} padding="md" variant="elevated" style={styles.serviceCard}>
                  <TouchableOpacity
                    style={styles.serviceContent}
                    onPress={() => handleServicePress(service.url)}
                  >
                    <View style={styles.serviceIconContainer}>
                      <service.icon size={28} color={colors.accent} />
                    </View>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <View style={styles.serviceArrow}>
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    </View>
                  </TouchableOpacity>
                </Card>
              ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>お得な特典</Text>
          <Text style={styles.infoText}>
            LifePath経由でサービスをご利用いただくと、特別割引や優先予約などの特典をご利用いただけます。
          </Text>
        </View>

        <Text style={styles.version}>LifePath v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  serviceCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: spacing.md,
  },
  serviceContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs / 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  serviceArrow: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  infoSection: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  version: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
