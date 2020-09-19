import { StyleContextType } from '@styles/StyleContext';
import React from 'react';
import {
  StyleSheet,
  Text,
} from 'react-native';
import { Node, OutputFunction, RenderState } from 'react-native-markdown-view';

import { WithText } from '../CardTextComponent/types';

export default function FlavorBoldNode({ typography }: StyleContextType) {
  return (
    node: Node & WithText,
    output: OutputFunction,
    state: RenderState
  ) => {
    return (
      <Text key={state.key} style={typography.boldItalic}>
        { node.text }
      </Text>
    );
  }
}
