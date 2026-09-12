import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../tokens';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  flex?: number;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found in register',
  style,
}: DataTableProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={[
              styles.headerCell,
              col.flex ? { flex: col.flex } : undefined,
              col.width ? { width: col.width as any } : undefined,
            ]}
          >
            <Text style={styles.headerText}>{col.header}</Text>
          </View>
        ))}
      </View>

      {/* Table Body */}
      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        data.map((item, index) => (
          <View
            key={keyExtractor(item, index)}
            style={[
              styles.dataRow,
              index % 2 === 1 && styles.alternateRow,
            ]}
          >
            {columns.map((col) => (
              <View
                key={col.key}
                style={[
                  styles.dataCell,
                  col.flex ? { flex: col.flex } : undefined,
                  col.width ? { width: col.width as any } : undefined,
                ]}
              >
                {col.render ? (
                  col.render(item, index)
                ) : (
                  <Text style={styles.cellText}>
                    {(item as any)[col.key] !== undefined && (item as any)[col.key] !== null
                      ? String((item as any)[col.key])
                      : '—'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSelected,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerCell: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  headerText: {
    fontFamily: typography.fontSans,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  alternateRow: {
    backgroundColor: colors.surfaceMuted,
  },
  dataCell: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textPrimary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fontSans,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
