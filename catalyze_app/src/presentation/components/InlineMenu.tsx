import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, textStyles } from '../theme';

type MenuItem = {
  key: string;
  label: string;
  icon?: any;
  color?: string;
  onPress: () => void;
};

type Props = {
  items: MenuItem[];
};

export const InlineMenu: React.FC<Props> = ({ items }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible((v) => !v)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {visible && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {items.map((it) => (
              <TouchableOpacity
                key={it.key}
                style={styles.menuItem}
                onPress={() => {
                  setVisible(false);
                  it.onPress();
                }}
              >
                {it.icon}
                <Text style={[styles.menuText, it.color ? { color: it.color } : undefined]}>{it.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    padding: spacing.xs,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menu: {
    position: 'absolute',
    right: 8,
    top: 56,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  menuText: {
    ...textStyles.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
});

export default InlineMenu;
