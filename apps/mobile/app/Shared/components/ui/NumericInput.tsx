import React from 'react';
import {
  TextInput, TextInputProps,
  InputAccessoryView, View, Button,
  Keyboard, Platform, StyleSheet,
} from 'react-native';

const ACCESSORY_ID = 'numeric-keyboard-accessory';

export const NumericInput: React.FC<TextInputProps> = (props) => (
  <>
    <TextInput
      keyboardType="decimal-pad"
      {...props}
      inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
    />
    {Platform.OS === 'ios' && (
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View style={s.accessory}>
          <Button onPress={() => Keyboard.dismiss()} title="Listo" color="#f05b22" />
        </View>
      </InputAccessoryView>
    )}
  </>
);

const s = StyleSheet.create({
  accessory: {
    backgroundColor: '#2c2c2e',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
});
