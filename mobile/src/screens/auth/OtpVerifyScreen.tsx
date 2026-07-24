import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

type OtpVerifyScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OtpVerify'>;
type OtpVerifyScreenRouteProp = RouteProp<AuthStackParamList, 'OtpVerify'>;

interface Props {
  navigation: OtpVerifyScreenNavigationProp;
  route: OtpVerifyScreenRouteProp;
}

export default function OtpVerifyScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const { setToken, setUser } = useAuthStore();

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste of full OTP
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP to complete registration
      const res = await client.post('/api/users/verify-otp', {
        email,
        otp: otpCode,
      });

      // After successful verification, auto-login the user via the unified auth
      const loginRes = await client.post('/api/auth/login', {
        role: 'traveler',
        email,
        password: '', // The user just registered — we need to prompt them to login
      });

      // If auto-login fails, redirect to login screen
      Alert.alert('Success', 'Account verified! Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'OTP verification failed';
      Alert.alert('Verification Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await client.post('/api/users/register', {
        name: 'Resend', // The backend uses the stored name from OTP store
        email,
        password: 'placeholder', // Not used for resend
      });
      Alert.alert('OTP Resent', `A new verification code has been sent to ${email}`);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Could not resend OTP';
      Alert.alert('Error', errMsg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.emailHighlight}>{email}</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleVerify} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.promptText}>Didn't receive the code?</Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.linkText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  backText: { fontSize: 16, color: '#10b981', fontWeight: '600' },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b' },
  emailHighlight: { fontSize: 15, color: '#10b981', fontWeight: '700', marginTop: 4 },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  otpInputFilled: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 },
  promptText: { fontSize: 14, color: '#64748b' },
  linkText: { fontSize: 14, color: '#10b981', fontWeight: '700' },
});
